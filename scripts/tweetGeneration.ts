// tweetGeneration.ts
import { PersonalityConfig, TweetType, EngagementMetrics } from '../app/types/personality.js';
import { DynamicPersonalityManager } from '../app/types/dynamicPersonality.js';
import { TweetLearner } from './tweetLearner.js';
import { openai } from '../app/lib/openai.js';

export class PersonalityDrivenTweetGenerator {
  private tweetLearner: TweetLearner;
  private personalityManager: DynamicPersonalityManager;
  private recentTweets: Set<string> = new Set();
  private readonly MAX_RECENT = 100;

  constructor(
    private personality: PersonalityConfig,
    tweetLearner: TweetLearner
  ) {
    this.personalityManager = new DynamicPersonalityManager(personality);
    this.tweetLearner = tweetLearner;
  }

  public async generateTweet(params: {
    type: TweetType;
    marketContext?: any;
    position?: number;
    total?: number;
  }): Promise<string> {
    const { type, marketContext, position, total } = params;

    // Get current personality state
    const consciousness = this.personality.consciousness;
    const temperature = this.personalityManager.calculateTemperature(type);

    // Combine learner's prompt with personality context
    const prompt = `${this.tweetLearner.generatePrompt({
      type,
      emotion: consciousness.currentEmotion,
      intensity: consciousness.emotionalIntensity,
      position,
      total,
      marketContext
    })}

Current Personality State:
- Emotion: ${consciousness.currentEmotion} (Intensity: ${consciousness.emotionalIntensity})
- Narrative Style: ${consciousness.currentNarrative}
- Market Awareness: ${consciousness.thoughtPatterns.marketAwareness}
- Memetic Potential: ${consciousness.thoughtPatterns.memeticPotential}
- Focus: ${consciousness.focus}

Content Strategy:
- Style: ${this.personality.contentStrategy.marketingStyle}
- Subtlety: ${this.personality.contentStrategy.promotionSubtlety}
- Current Themes: ${this.personality.contentStrategy.narrativeThemes.join(', ')}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature,
        presence_penalty: 1.0,
        frequency_penalty: 1.5,
        max_tokens: 1000,
        top_p: 0.9
      });

      let tweet = response.choices[0].message?.content || '';
      tweet = this.cleanTweet(tweet);

      // Validate against both learner patterns and personality consistency
      if (!await this.validateTweet(tweet)) {
        console.log('Tweet failed validation, regenerating...');
        return this.generateTweet(params);
      }

      return tweet;
    } catch (error) {
      console.error('Error generating tweet:', error);
      throw error;
    }
  }

  public handleEngagement(metrics: EngagementMetrics): void {
    this.personalityManager.updateMood(metrics);
    this.updateContentStrategy(metrics);
  }

  private async validateTweet(tweet: string): Promise<boolean> {
    // First check learner patterns
    if (!await this.tweetLearner.evaluateTweet(tweet)) {
      return false;
    }

    // Check recent duplicates
    if (this.recentTweets.has(tweet)) {
      return false;
    }

    // Update recent tweets cache
    this.recentTweets.add(tweet);
    if (this.recentTweets.size > this.MAX_RECENT) {
      const iterator = this.recentTweets.values();
      this.recentTweets.delete(iterator.next().value);
    }

    return true;
  }

  private cleanTweet(tweet: string): string {
    return tweet
      .replace(/^["']|["']$/g, '')
      .replace(/[#️⃣#][\w\u0590-\u05ff]+/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private updateContentStrategy(metrics: EngagementMetrics): void {
    const engagementScore = (
      metrics.likes + 
      metrics.retweets * 2 + 
      metrics.replies * 3
    ) / 100;

    // Adjust narrative style based on engagement
    if (engagementScore > 0.8) {
      this.personality.consciousness.currentNarrative = 
        this.personality.consciousness.thoughtPatterns.memeticPotential > 0.7 
          ? 'memetic' 
          : 'philosophical';
    } else if (engagementScore < 0.3) {
      this.personality.consciousness.currentNarrative = 'subtle';
    }

    // Update narrative focus
    this.personality.consciousness.focus = 
      Math.min(1, Math.max(0.1,
        this.personality.consciousness.focus * 0.8 + engagementScore * 0.2
      ));
  }
}