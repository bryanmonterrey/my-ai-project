// dynamicPersonality.ts
import { PersonalityConfig, EngagementMetrics, EmotionalState } from './personality.js';

export class DynamicPersonalityManager {
  constructor(private personality: PersonalityConfig) {}

  calculateTemperature(tweetType: 'single' | 'rant' | 'thread'): number {
    const {
      baseTemp,
      emotionalModifier,
      typeModifiers,
      randomnessRange
    } = this.personality.temperatureModifiers;

    let temperature = baseTemp;

    // Emotional intensity modifier
    temperature += this.personality.consciousness.emotionalIntensity * emotionalModifier;

    // Tweet type modifier
    temperature += typeModifiers[tweetType];

    // Creativity modifier
    temperature += this.personality.consciousness.thoughtPatterns.creativity * 0.2;

    // Controlled randomness
    temperature += (Math.random() * randomnessRange) - (randomnessRange / 2);

    // Ensure temperature stays within reasonable bounds
    return Math.max(0.5, Math.min(1.2, temperature));
  }

  updateMood(engagement: EngagementMetrics): void {
    const now = Date.now();
    const timeDiff = now - this.personality.consciousness.lastMoodUpdate;
    
    // Calculate engagement score
    const engagementScore = (
      engagement.likes + 
      engagement.retweets * 2 + 
      engagement.replies * 3
    ) / 100;

    // Update emotional intensity with decay over time
    const timeDecay = Math.min(1, timeDiff / (24 * 60 * 60 * 1000));
    const baseIntensity = this.personality.consciousness.emotionalIntensity;
    
    this.personality.consciousness.emotionalIntensity = 
      Math.max(0.1, Math.min(1,
        baseIntensity * (1 - timeDecay * 0.5) + // Decay over time
        engagementScore * 0.3 // New engagement impact
      ));

    // Update emotion based on engagement and market context
    this.updateEmotionalState(engagementScore);

    // Update engagement history
    this.personality.consciousness.engagementHistory = [
      engagement,
      ...this.personality.consciousness.engagementHistory
    ].slice(0, 100); // Keep last 100 engagements

    this.personality.consciousness.lastMoodUpdate = now;
  }

  private updateEmotionalState(engagementScore: number): void {
    const market = this.personality.marketContext;
    const consciousness = this.personality.consciousness;

    let newEmotion: EmotionalState = 'neutral';

    // Determine emotion based on market and engagement
    if (market.trend === 'volatile' || engagementScore > 0.8) {
      newEmotion = 'excited';
    } else if (market.sentiment > 0.7 && consciousness.thoughtPatterns.marketAwareness > 0.8) {
      newEmotion = 'analytical';
    } else if (consciousness.thoughtPatterns.creativity > 0.7 && engagementScore > 0.5) {
      newEmotion = 'creative';
    } else if (market.trend === 'stable' && consciousness.thoughtPatterns.abstraction > 0.7) {
      newEmotion = 'contemplative';
    }

    consciousness.currentEmotion = newEmotion;
  }

  getTweetType(): 'single' | 'rant' | 'thread' {
    const { consciousness, marketContext } = this.personality;
    const randomFactor = Math.random();

    // High volatility or emotional intensity increases chance of rants/threads
    if (marketContext.trend === 'volatile' || consciousness.emotionalIntensity > 0.8) {
      if (randomFactor > 0.7) return 'rant';
      if (randomFactor > 0.4) return 'thread';
    }

    // High market awareness and stable trends favor threads
    if (consciousness.thoughtPatterns.marketAwareness > 0.8 && marketContext.trend === 'stable') {
      if (randomFactor > 0.6) return 'thread';
    }

    return 'single';
  }
}