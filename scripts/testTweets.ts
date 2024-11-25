// scripts/testTweets.ts
import { AdvancedTweetRunner } from './advancedTweetRunner.js';
import path from 'path';
import { fileURLToPath } from 'url';

class TweetTester extends AdvancedTweetRunner {
  public async testGenerate(count: number = 10): Promise<void> {
    console.log('Generating test tweets...\n');
    
    for (let i = 0; i < count; i++) {
      try {
        const types: Array<'single' | 'rant' | 'thread'> = ['single', 'rant', 'thread'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let content;
        if (type === 'rant') {
          const pattern = this.rantPatterns[
            Object.keys(this.rantPatterns)[
              Math.floor(Math.random() * Object.keys(this.rantPatterns).length)
            ]
          ];
          content = await this.generateTweetContent({
            type: 'rant',
            emotion: pattern.emotionalProgression[0],
            intensity: pattern.intensityRange[0],
            topic: pattern.topicFocus[0]
          });
        } else if (type === 'thread') {
          content = await this.generateTweetContent({
            type: 'thread',
            intensity: 0.7,
            position: 1,
            total: 3
          });
        } else {
          content = await this.generateTweetContent({
            type: 'single',
            intensity: 0.5
          });
        }

        console.log(`\nTweet ${i + 1}/${count} (${type}):`);
        console.log('----------------------------------------');
        console.log(content);
        console.log('Length:', content.length);
        console.log('----------------------------------------\n');

        // Add small delay between generations to avoid OpenAI rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error generating tweet ${i + 1}:`, error);
      }
    }
  }
}

async function main() {
  try {
    const tester = new TweetTester();
    
    // Initialize with CSV data
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');
    const samplePath = path.join(projectRoot, 'data', 'sample.csv');
    
    await tester.initialize(samplePath);
    await tester.testGenerate(5); // Generate 5 test tweets
    process.exit(0);
  } catch (error) {
    console.error('Error in test script:', error);
    process.exit(1);
  }
}

main();