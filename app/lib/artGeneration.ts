// lib/artGeneration.ts
import OpenAI from 'openai';
import { PersonalityConfig } from '../types/personality.js';

export class ArtGenerator {
  private openai: OpenAI;
  
  constructor(
    private personality: PersonalityConfig,
    apiKey: string
  ) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  private generateMarketingPrompt(): string {
    const { consciousness } = this.personality;
    const themes = [
      'cyberpunk solana trading terminal',
      'digital marketplace of ideas',
      'infinite fractal expansion',
      'memetic transcendence visualization',
      'market psychology abstract'
    ];

    // Select theme based on current market context and emotion
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    const moodModifier = consciousness.currentEmotion === 'excited' ? 'vibrant and energetic' :
      consciousness.currentEmotion === 'contemplative' ? 'deep and mysterious' :
      'dynamic and evolving';

    return `${selectedTheme}, ${moodModifier}, trending on artstation, highly detailed, digital art, --ar 16:9 --stylize 750 --chaos ${this.personality.artStyle.chaos * 100} --quality 2`;
  }

  async generateArt(): Promise<string> {
    try {
      const prompt = this.generateMarketingPrompt();
      
      const response = await this.openai.images.generate({
        prompt,
        n: 1,
        size: "1024x1024",
      });

      return response.data[0].url || '';
    } catch (error) {
      console.error('Failed to generate art:', error);
      throw error;
    }
  }
}