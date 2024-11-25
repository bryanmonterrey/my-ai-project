// scripts/control.ts
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const controlFile = resolve(process.cwd(), 'bot-control.json');

interface TweetCommand {
  type: 'single' | 'thread' | 'rant';
  content?: string;
  count?: number;
  mood?: string;
}

function updateControl(command: string, options: any = {}) {
  try {
    const control = {
      command: 'run',
      pauseDuration: 0,
      moodOverride: null,
      engagementThreshold: 0.7,
      manualTweet: {
        enabled: false,
        content: null,
        type: 'single',
        tweetCount: 1,
        processed: false
      }
    };

    switch (command) {
      case 'tweet':
        control.manualTweet = {
          enabled: true,
          content: options.content || null,
          type: 'single',
          tweetCount: 1,
          processed: false
        };
        break;

      case 'thread':
        control.manualTweet = {
          enabled: true,
          content: null,
          type: 'thread',
          tweetCount: options.count || 3,
          processed: false
        };
        break;

      case 'rant':
        control.manualTweet = {
          enabled: true,
          content: null,
          type: 'rant',
          tweetCount: options.count || 5,
          processed: false
        };
        break;

      case 'pause':
        control.command = 'pause';
        break;

      case 'resume':
        control.command = 'resume';
        break;

      case 'mood':
        control.moodOverride = options.mood || 'neutral';
        break;
    }

    writeFileSync(controlFile, JSON.stringify(control, null, 2));
    console.log('Control updated:', command);
    console.log(control);
  } catch (error) {
    console.error('Error updating control:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options: any = {};

// Parse options
args.slice(1).forEach(arg => {
  const [key, value] = arg.split('=');
  options[key] = value;
});

updateControl(command, options);