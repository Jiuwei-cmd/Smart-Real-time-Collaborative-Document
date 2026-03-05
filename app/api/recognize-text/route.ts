import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { imageUrl, base64Data } = await request.json();

  if (!imageUrl && !base64Data) {
    return NextResponse.json({ error: 'imageUrl or base64Data is required' }, { status: 400 });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DASHSCOPE_API_KEY not configured' }, { status: 500 });
  }

  const dashScopePayload = {
    model: 'qwen-vl-max',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: imageUrl ? imageUrl : `data:image/png;base64,${base64Data}` },
            { text: '请提取并整理这张截图中的所有文字内容，保持原有的段落结构。' },
          ],
        },
      ],
    },
  };
  
  console.log('Sending to DashScope payload image:', imageUrl ? imageUrl : 'base64 data...');

  const response = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dashScopePayload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DashScope API Error Response:', errorText);
    return NextResponse.json(
      { error: `DashScope API error: ${response.status}`, detail: errorText },
      { status: response.status }
    );
  }

  const result = await response.json();
  // qwen-vl 的 content 是数组格式: [{text: "..."}, ...]
  const rawContent = result?.output?.choices?.[0]?.message?.content;
  const content = Array.isArray(rawContent)
    ? rawContent.map((c: { text?: string }) => c.text ?? '').join('')
    : (rawContent ?? '');
  return NextResponse.json({ content });
}
