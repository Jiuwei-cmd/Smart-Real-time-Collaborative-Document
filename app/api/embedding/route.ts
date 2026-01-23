import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: text is required and must be a string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Aliyun DashScope API key not configured' },
        { status: 500 }
      );
    }

    // Call Aliyun DashScope text-embedding-v4 API
    // API文档: https://help.aliyun.com/zh/model-studio/developer-reference/text-embedding-api
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-v4',
        input: {
          texts: [text]
        },
        parameters: {
          text_type: 'document', // 文档类型，用于生成文档嵌入
          dimension: 1536 // 指定输出向量维度为 1536（默认是 1024）
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aliyun DashScope API error:', errorText);
      return NextResponse.json(
        { 
          error: 'Failed to call Aliyun DashScope API',
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 检查响应格式
    if (!data.output || !data.output.embeddings || !data.output.embeddings[0]) {
      console.error('Unexpected API response format:', data);
      return NextResponse.json(
        { error: 'Unexpected response format from Aliyun DashScope' },
        { status: 500 }
      );
    }

    // 提取 embedding 向量
    const embedding = data.output.embeddings[0].embedding;

    return NextResponse.json({
      embedding: embedding,
      dimensions: embedding.length,
    });

  } catch (error: unknown) {
    console.error('Embedding generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to generate embedding',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
