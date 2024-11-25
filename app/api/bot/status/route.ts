// app/api/bot/status/route.ts
import { NextResponse } from 'next/server.js';
import { AdvancedTweetRunner } from '@/scripts/advancedTweetRunner.js';

declare const botInstance: AdvancedTweetRunner | null;

export async function GET() {
  try {
    if (!botInstance) {
      return NextResponse.json({
        isRunning: false,
        recentTweets: [],
        mood: 'neutral',
        tweetCount: 0,
        uptime: 0
      });
    }

    const uptime = botInstance.startTime ? Date.now() - botInstance.startTime : 0;

    return NextResponse.json({
      isRunning: botInstance.isRunning,
      recentTweets: Array.from(botInstance.recentTweets).slice(-10),
      mood: botInstance.currentMood,
      tweetCount: botInstance.tweetCount || 0,
      uptime
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    return NextResponse.json({ error: 'Failed to get bot status' }, { status: 500 });
  }
}