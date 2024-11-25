// app/api/bot-control/route.ts
import { NextResponse } from 'next/server.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const controlFile = join(process.cwd(), 'bot-control.json');

interface BotControl {
  command: 'run' | 'pause' | 'resume' | 'mood';
  manualTweet?: {
    enabled: boolean;
    content: string | null;
    type: 'single' | 'thread' | 'rant';
    tweetCount: number;
    processed: boolean;
  };
  moodOverride?: string | null;
  pauseDuration?: number;
}

export async function GET() {
  try {
    const controlData = readFileSync(controlFile, 'utf-8');
    const control: BotControl = JSON.parse(controlData);
    return NextResponse.json(control);
  } catch (error) {
    console.error('Error reading bot control:', error);
    // Return default configuration if file doesn't exist or is invalid
    const defaultControl: BotControl = {
      command: 'run',
      manualTweet: {
        enabled: false,
        content: null,
        type: 'single',
        tweetCount: 1,
        processed: false
      }
    };
    
    // Write default config to file
    try {
      writeFileSync(controlFile, JSON.stringify(defaultControl, null, 2));
    } catch (writeError) {
      console.error('Error writing default config:', writeError);
    }
    
    return NextResponse.json(defaultControl);
  }
}

export async function POST(req: Request) {
  try {
    const config: BotControl = await req.json();
    
    // Validate config
    if (!config.command || !['run', 'pause', 'resume', 'mood'].includes(config.command)) {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    // If it's a tweet command, validate tweet data
    if (config.command === 'run' && config.manualTweet?.enabled) {
      if (!['single', 'thread', 'rant'].includes(config.manualTweet.type)) {
        return NextResponse.json({ error: 'Invalid tweet type' }, { status: 400 });
      }

      if (config.manualTweet.type === 'single' && !config.manualTweet.content) {
        return NextResponse.json({ error: 'Tweet content required for single tweets' }, { status: 400 });
      }

      if (['thread', 'rant'].includes(config.manualTweet.type) && 
          (!config.manualTweet.tweetCount || config.manualTweet.tweetCount < 2)) {
        return NextResponse.json({ error: 'Invalid tweet count for thread/rant' }, { status: 400 });
      }
    }

    // Write to control file
    writeFileSync(controlFile, JSON.stringify(config, null, 2));

    // Log the action
    console.log('Bot control updated:', {
      command: config.command,
      type: config.manualTweet?.type,
      tweetCount: config.manualTweet?.tweetCount
    });

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error updating bot control:', error);
    return NextResponse.json(
      { error: 'Failed to update bot control' },
      { status: 500 }
    );
  }
}