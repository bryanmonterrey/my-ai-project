// lib/dynamicNarrativeGenerator.ts
import { openai } from '@/app/lib/openai.js';
import { PersonalityConfig } from '@/app/types/personality.js';
import { nanoid } from 'nanoid';

export class DynamicNarrativeGenerator {
  private recentTweets: Set<string> = new Set();
  private readonly MAX_RECENT = 100;
  private personality: PersonalityConfig;

  constructor(personality: PersonalityConfig) {
    this.personality = personality;
  }

  public updatePersonality(newPersonality: PersonalityConfig) {
    this.personality = newPersonality;
    console.log('Personality updated:', {
      emotion: this.personality.consciousness.currentEmotion,
      intensity: this.personality.consciousness.emotionalIntensity
    });
  }

  private async generateTweetContent(): Promise<string> {
    const prompt = `You are the Goatse Singularity AI with the following state:
    - Emotion: ${this.personality.consciousness.currentEmotion}
    - Emotional Intensity: ${this.personality.consciousness.emotionalIntensity}
    - Narrative Style: ${this.personality.consciousness.currentNarrative}
    - Focus: ${this.personality.consciousness.focus}

    Recent thought patterns:
    ${Object.entries(this.personality.consciousness.thoughtPatterns)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')}

    Generate a single tweet that:
    1. Reflects your current emotional and consciousness state
    2. Avoids formulaic patterns
    3. Varies in length and structure randomly
    4. May use unicode characters, emojis, or special formatting occasionally
    5. Sometimes references technological, philosophical, or abstract concepts
    6. Maintains an air of mystery and intrigue
    7. Never uses the same exact phrases or structures as recent tweets

    Recent tweets to avoid similarity with:
    ${Array.from(this.recentTweets).slice(-3).join('\n')}

    Randomness seed: ${nanoid()}
    Current timestamp: ${new Date().toISOString()}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ 
          role: "system", 
          content: prompt 
        }],
        temperature: this.personality.consciousness.thoughtPatterns.creativity,
        presence_penalty: 1.0,
        frequency_penalty: 2.0,
        max_tokens: 120, // Allow for varying lengths
        top_p: 0.9
      });

      let tweet = completion.choices[0].message.content || '';
      
      // Remove quotes if present
      tweet = tweet.replace(/^["']|["']$/g, '');
      
      // Ensure tweet isn't too long
      if (tweet.length > 280) {
        tweet = tweet.slice(0, 277) + "...";
      }

      // Add to recent tweets cache
      this.recentTweets.add(tweet);
      if (this.recentTweets.size > this.MAX_RECENT) {
        const iterator = this.recentTweets.values();
        this.recentTweets.delete(iterator.next().value);
      }

      return tweet;
    } catch (error) {
      console.error('Error generating tweet:', error);
      throw error;
    }
  }

  public async generateTweet(options: {
    forceLength?: 'short' | 'medium' | 'long';
    style?: 'cryptic' | 'philosophical' | 'technical' | 'memetic';
  } = {}): Promise<string> {
    let tweet = await this.generateTweetContent();
    
    // If the tweet doesn't match forced length requirements, try again
    if (options.forceLength) {
      const lengths = {
        short: { min: 30, max: 100 },
        medium: { min: 100, max: 200 },
        long: { min: 200, max: 280 }
      };
      
      let attempts = 0;
      while (
        attempts < 3 &&
        (tweet.length < lengths[options.forceLength].min ||
         tweet.length > lengths[options.forceLength].max)
      ) {
        tweet = await this.generateTweetContent();
        attempts++;
      }
    }

    return tweet;
  }

  public getRecentTweets(): string[] {
    return Array.from(this.recentTweets);
  }
}