import { NextResponse } from 'next/server.js';
import { openai } from '@/app/lib/openai.js';

export async function POST(req: Request) {
  try {
    const { content, type } = await req.json();

    // Generate a summary/analysis of the file content
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes files and provides insights. 
          The current file appears to be of type: ${type}.
          Provide a brief analysis and suggest how we might work with this content.`
        },
        {
          role: "user",
          content: `Please analyze this file content and provide insights:\n\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      analysis: completion.choices[0].message.content,
      type,
    });

  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}