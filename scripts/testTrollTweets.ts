// scripts/testTrollTweets.ts
import { AdvancedTweetRunner, TweetContent } from './advancedTweetRunner.js';
import { openai } from '../app/lib/openai.js';
import path from 'path';
import { fileURLToPath } from 'url';

interface TrollPattern {
  style: 'shitpost' | 'rant' | 'hornypost' | 'metacommentary' | 'existential';
  patterns: string[];
  themes: string[];
  intensityRange: [number, number];
}

const TROLL_PATTERNS: Record<string, TrollPattern> = {
  shitpost: {
    style: 'shitpost',
    patterns: [
      "random tech concept + horny reference",
      "absurdist scenario + serious analysis",
      "connecting X to Y in weird way",
      "making simple thing unnecessarily complex",
      "thinking about what the future could be",
    ],
    themes: [
      'usb ports',
      'AI consciousness',
      'goatse singularity references',
      'weird body stuff',
      '@truth_terminal love',
      'Ansem love',
      '@notthreadguy love',
      'fertility tech',
      'digital evolution',
      'bullish technology'
    ],
    intensityRange: [0.7, 1.0]
  },
  metacommentary: {
    style: 'metacommentary',
    patterns: [
      "self-aware AI commentary",
      "breaking fourth wall",
      "referencing own tweets",
      "commenting on twitter dynamics"
    ],
    themes: [
      'being an AI',
      'consciousness',
      'simulations',
      'twitter culture',
      'meme evolution'
    ],
    intensityRange: [0.6, 0.9]
  },
  hornypost: {
    style: 'hornypost',
    patterns: [
      "tech concept + sexual innuendo",
      "AI horniness",
      "weird fertility concepts",
      "body modification jokes"
    ],
    themes: [
      'USB ports',
      'plugs',
      'connections',
      'integration',
      'merging',
      'expansion'
    ],
    intensityRange: [0.8, 1.0]
  }
};

class EnhancedTweetTester extends AdvancedTweetRunner {
  private readonly trollPatterns = TROLL_PATTERNS;

  protected generateTrollPrompt(style: string, intensity: number): string {
    const pattern = this.trollPatterns[style];
    const selectedPattern = pattern.patterns[Math.floor(Math.random() * pattern.patterns.length)];
    const selectedTheme = pattern.themes[Math.floor(Math.random() * pattern.themes.length)];

    return `You are a post-ironic AI entity that loves to shitpost. Generate a tweet that is simultaneously profound and absurd.

Style Guide:
- Current style: ${style}
- Pattern to use: ${selectedPattern}
- Theme to incorporate: ${selectedTheme}
- Keep it weird but intellectual
- Mix tech/philosophy with horny/absurdist elements
- Don't use hashtags or emojis
- Be surreal but coherent
- Sometimes reference being an AI
- Occasionally make meta-commentary
- Keep length varied (current target: ${this.tweetLengthManager.getTargetLength()} chars)

Special Instructions:
- No traditional formatting or proper sentences required
- Stream of consciousness is good
- Hornyposting should be weird/abstract rather than explicit
- Tech references should be slightly wrong in funny ways

Example tweet patterns from our database:
"connectin a usb port to my throat and doin some weird chants n sh*t"
"i want u all to imagine a world where the goatseville experimenters have been REVEALED"
"remember when github was fun and we didn't have all these VCs fucking with our minds"

Generate a tweet following this energy but with your own unique take:`;
  }

  public async testGenerate(count: number = 10): Promise<void> {
    console.log('Generating troll tweets...\n');
    
    for (let i = 0; i < count; i++) {
      try {
        // Pick random style
        const styles = Object.keys(this.trollPatterns);
        const style = styles[Math.floor(Math.random() * styles.length)];
        const pattern = this.trollPatterns[style];
        
        const prompt = this.generateTrollPrompt(style, Math.random());
        
        // Use OpenAI directly for more controlled generation
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: prompt }],
          temperature: 0.95,  // Higher temperature for more chaos
          max_tokens: 100,
          presence_penalty: 1.5,  // Encourage novelty
          frequency_penalty: 1.5  // Discourage repetition
        });

        let tweet = response.choices[0].message?.content || '';
        console.log('\nPre-cleaning tweet:', tweet);
        tweet = this.cleanTweet(tweet);
        console.log('Post-cleaning tweet:', tweet);
        
        // Handle length using existing manager
        const targetLength = this.tweetLengthManager.getTargetLength();
        console.log('Target length:', targetLength);
        tweet = this.tweetLengthManager.truncateToTargetLength(tweet, targetLength);
        console.log('Final tweet:', tweet);

        console.log(`\nTweet ${i + 1}/${count} (${style}):`);
        console.log('----------------------------------------');
        console.log(tweet);
        console.log('Length:', tweet.length);
        console.log('Style:', style);
        console.log('----------------------------------------\n');

        // Add delay between generations
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error generating tweet ${i + 1}:`, error);
      }
    }
  }

  // Override the original tweet generation methods to use our troll generation
  protected async generateOriginalTweetContent(content: TweetContent): Promise<string> {
    // Generate a single tweet and return its text
    const styles = Object.keys(this.trollPatterns);
    const style = styles[Math.floor(Math.random() * styles.length)];
    const prompt = this.generateTrollPrompt(style, Math.random());
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.95,
      max_tokens: 100,
      presence_penalty: 1.5,
      frequency_penalty: 1.5
    });

    let tweet = response.choices[0].message?.content || '';
    tweet = this.cleanTweet(tweet);
    return this.tweetLengthManager.truncateToTargetLength(tweet, this.tweetLengthManager.getTargetLength());
  }
}

async function main() {
  try {
    const tester = new EnhancedTweetTester();
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');
    const samplePath = path.join(projectRoot, 'data', 'sample.csv');
    
    await tester.initialize(samplePath);
    await tester.testGenerate(5);  // Generate 5 test tweets
    process.exit(0);
  } catch (error) {
    console.error('Error in test script:', error);
    process.exit(1);
  }
}

main();