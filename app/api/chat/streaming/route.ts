import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '@/app/lib/openai.js';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    const config = data?.config;

    const response = await openai.chat.completions.create({
      model: config?.model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: config?.prompt || "You are a helpful AI assistant."
        },
        ...messages
      ],
      temperature: config?.temperature || 0.7,
      max_tokens: config?.maxTokens || 1000,
      stream: true,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('Error:', error);
    throw error;
  }
}