import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 1. 初始化阿里云百炼 Provider (利用兼容模式)
const dashscope = createOpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let currentSessionId = sessionId;
    const latestMessage = messages?.[messages.length - 1]; // 当前用户发来的最新问题
    // 完美兼容 AI SDK 6.0 新版 parts/text 结构与旧版 content 结构
    const messageContent = latestMessage?.content || latestMessage?.text || (latestMessage?.parts && latestMessage.parts[0]?.text) || '新会话';

    // 2. 场景一拦截：如果 sessionId 为空，按需惰性创建新会话
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.id,
          title: messageContent.slice(0, 20), // 截取前20个字符作标题
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
      }
      currentSessionId = newSession.id;
    }

    // 3. 将用户最新问题存入数据库
    const { error: msgError } = await supabase
      .from('ai_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: messageContent,
      });

    if (msgError) {
      console.error('Failed to save user message:', msgError);
    }

    // 4. 将前端发送的 UIMessages 完美转换为底层大模型要求的 ModelMessages 规范
    const modelMessages = await convertToModelMessages(messages);

    // 5. 调用通义千问大模型并流式返回
    const result = await streamText({
      model: dashscope('qwen-plus'), // 或 qwen-max
      messages: modelMessages,
      // 5. 利用 onFinish 钩子，当流式输出完毕后将 AI 回答持久化
      onFinish: async ({ text }) => {
        const { error: aiMsgError } = await supabase
          .from('ai_messages')
          .insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: text,
          });

        if (aiMsgError) {
          console.error('Failed to save ai message:', aiMsgError);
        }
      },
    });

    // 6. 将生成的 sessionId 放在 Header 中传回前端
    return result.toTextStreamResponse({
      headers: { 'X-Session-Id': currentSessionId },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
