// app/api/bot/heartbeat/route.ts
import { NextResponse } from 'next/server.js';
import { AdvancedTweetRunner as AdvancedTweetRunnerType } from '@/scripts/advancedTweetRunner.js';
import { default as AdvancedTweetRunner } from '@/scripts/advancedTweetRunner.js';

let botInstance: AdvancedTweetRunner | null = null;

export async function GET() {
  try {
    if (!botInstance?.isRunning) {
      botInstance = new AdvancedTweetRunner();
      await botInstance.start();
    }

    return NextResponse.json({ status: 'running' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}