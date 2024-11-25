import { NextResponse } from 'next/server.js';
import { openai } from '@/app/lib/openai.js';
import { supabase } from '@/app/lib/supabase.js';
import { Database } from '@/types/supabase.js';

interface Memory {
  id: number;
  content: string;
  similarity: number;
}

const ALLOWED_MODELS = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'] as const;
type AllowedModel = typeof ALLOWED_MODELS[number];

function isAllowedModel(model: string): model is AllowedModel {
  return ALLOWED_MODELS.includes(model as AllowedModel);
}

export async function POST(req: Request) {
  try {
    const { message, model = 'gpt-4o' } = await req.json();

    // Validate model selection
    if (!isAllowedModel(model)) {
      return NextResponse.json(
        { error: 'Invalid model selected' },
        { status: 400 }
      );
    }

    // Get embedding for the message
    let embedding;
    try {
      embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: message,
      });
    } catch (error: any) {
      console.error('Embedding error:', error);
      if (error.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'The AI service is currently unavailable. Please check your API quota.' },
          { status: 503 }
        );
      }
      throw error;
    }

    // Search for similar memories
    const { data: memories, error: supabaseError } = await supabase
      .rpc('match_memories', {
        query_embedding: embedding.data[0].embedding,
        match_count: 5
      }) as { data: Memory[] | null; error: any };

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to retrieve context from memory' },
        { status: 500 }
      );
    }

    // Generate response with context
    const context = memories?.map((m: Memory) => m.content).join('\n') || '';
    
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are an advanced AI assistant with memory capabilities and enhanced reasoning abilities. You can think step by step and provide detailed explanations." 
          },
          { 
            role: "user", 
            content: `Context from previous conversations:\n${context}\n\nCurrent message: ${message}` 
          }
        ],
        temperature: 1.0, // Higher temperature for more creative responses
        max_tokens: 1000, // Increased token limit for more detailed responses
        top_p: 0.9,
        frequency_penalty: 0.3, // Slightly increased for more diverse responses
        presence_penalty: 0.3,
      });
    } catch (error: any) {
      console.error('Completion error:', error);
      if (error.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'The AI service is currently unavailable. Please check your API quota.' },
          { status: 503 }
        );
      }
      throw error;
    }

    // Store the interaction in memory
    try {
      await supabase.from('memories').insert({
        content: `User: ${message}\nAssistant: ${completion.choices[0].message.content}`,
        embedding: embedding.data[0].embedding,
        metadata: { 
          type: 'interaction',
          model: model,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to store memory:', error);
      // Continue execution even if memory storage fails
    }

    return NextResponse.json({
      response: completion.choices[0].message.content,
      model: model // Return the model used for the response
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}