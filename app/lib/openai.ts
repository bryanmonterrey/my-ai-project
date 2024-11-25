// app/lib/openai.ts
import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables at the start of the file
config({ path: resolve(process.cwd(), '.env') });

if (!process.env.OPENAI_API_KEY) {
  console.error('Environment variables loaded:', process.env);
  console.error('OPENAI_API_KEY is missing from environment variables');
  throw new Error('Missing OpenAI API Key');
}

console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});