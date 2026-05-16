import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { createAISession, saveAIMessage, getServerUser } from '@/lib/api/messageAI';

// 1. 初始化阿里云百炼 Provider (利用兼容模式)
const dashscope = createOpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();
    const user = await getServerUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let currentSessionId = sessionId;
    const latestMessage = messages?.[messages.length - 1]; // 当前用户发来的最新问题
    const messageContent = latestMessage?.content || latestMessage?.text || (latestMessage?.parts && latestMessage.parts[0]?.text) || '新会话';

    // 2. 如果 sessionId 为空，按需惰性创建新会话
    if (!currentSessionId) {
      try {
        const newSession = await createAISession(user.id, messageContent);
        currentSessionId = newSession.id;
      } catch (sessionError) {
        return new Response(JSON.stringify({ error: sessionError }), { status: 500 });
      }
    }

    // 3. 将用户最新问题存入数据库
    await saveAIMessage(currentSessionId, 'user', messageContent).catch(err => {
      console.error('Failed to save user message:', err);
    });

    // 4. 将前端发送的 UIMessages 转换为 ModelMessages 规范
    const modelMessages = await convertToModelMessages(messages);

    // 5. 调用通义千问大模型并流式返回
    const result = await streamText({
      model: dashscope('qwen-plus'), // 或 qwen-max
      messages: modelMessages,
      onFinish: async ({ text }) => {
        await saveAIMessage(currentSessionId, 'assistant', text).catch(err => {
          console.error('Failed to save ai message:', err);
        });
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

