// app/api/ai/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { Configuration, OpenAIApi } from 'openai';

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

// export async function POST(request: NextRequest) {
//   const { prompt, model = 'gpt-3.5-turbo' } = await request.json();

//   try {
//     const response = await openai.createChatCompletion({
//       model,
//       messages: [{ role: 'user', content: prompt }],
//     });

//     return NextResponse.json({ success: true, content: response.data.choices[0].message.content });
//   } catch (error) {
//     console.error('AI Request Error:', error);
//     return NextResponse.json({ success: false, error: 'AI 服务异常' }, { status: 500 });
//   }
// }