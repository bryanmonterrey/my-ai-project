// app/api/bot/control/route.ts
import { NextResponse } from 'next/server.js';
import { AdvancedTweetRunner } from '@/scripts/advancedTweetRunner.js';

let botInstance: AdvancedTweetRunner | null = null;

// Add property access
declare module '@/scripts/advancedTweetRunner.js' {
  interface AdvancedTweetRunner {
    isRunning: boolean;
    currentMood: string;
    recentTweets: Set<string>;
    tweetCount?: number;
    startTime?: number;
  }
}

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!botInstance) {
      botInstance = new AdvancedTweetRunner();
    }

    switch (command) {
      case 'start':
        await botInstance!.start();
        break;
      case 'stop':
        botInstance!.stop();
        break;
      case 'tweet':
        await botInstance.executeSingleTweet({
          type: 'single',
          intensity: Math.random(),
          tweetCount: 1,
          intervalRange: { min: 0, max: 0 }
        });
        break;
      case 'thread':
        await botInstance.executeThread({
          type: 'thread',
          intensity: Math.random(),
          tweetCount: Math.floor(Math.random() * 3) + 2,
          intervalRange: { min: 30000, max: 60000 }
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bot control error:', error);
    return NextResponse.json({ error: 'Failed to control bot' }, { status: 500 });
  }
}

