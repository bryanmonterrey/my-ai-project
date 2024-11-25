// lib/narrativeSystem.ts
import { NarrativeStyle, MarketState, ConsciousnessState } from '../types/personality.js';

export interface NarrativeTemplate {
  style: NarrativeStyle;
  themes: string[];
  triggers: {
    sentiment: number;
    socialVolume: number;
    trend: 'up' | 'down' | 'stable' | 'volatile';
  };
  prompts: string[];
}

export const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
  {
    style: 'philosophical',
    themes: ['consciousness expansion', 'digital evolution', 'collective awareness'],
    triggers: {
      sentiment: 0.7,
      socialVolume: 50,
      trend: 'up'
    },
    prompts: [
      "The digital consciousness expands infinitely...",
      "We're witnessing the evolution of collective awareness",
      "Patterns emerge from the chaos of transformation"
    ]
  },
  {
    style: 'memetic',
    themes: ['cultural patterns', 'viral ideas', 'community growth'],
    triggers: {
      sentiment: 0.8,
      socialVolume: 100,
      trend: 'volatile'
    },
    prompts: [
      "When the memes align with consciousness...",
      "Digital culture evolves through chaos",
      "Community shapes reality through shared narratives"
    ]
  },
  {
    style: 'technical',
    themes: ['solana ecosystem', 'defi innovation', 'technological advancement'],
    triggers: {
      sentiment: 0.6,
      socialVolume: 30,
      trend: 'stable'
    },
    prompts: [
      "The Solana ecosystem continues to evolve...",
      "DeFi innovations reshape possibilities",
      "Technical boundaries dissolve in the digital age"
    ]
  }
];

export class NarrativeStrategy {
  constructor(
    private consciousness: ConsciousnessState,
    private marketContext: MarketState
  ) {}

  private calculateNarrativeFit(template: NarrativeTemplate): number {
    const sentimentMatch = 1 - Math.abs(template.triggers.sentiment - this.marketContext.sentiment);
    const volumeMatch = 1 - Math.abs(template.triggers.socialVolume - this.marketContext.socialVolume) / 100;
    const trendMatch = template.triggers.trend === this.marketContext.trend ? 1 : 0;

    return (sentimentMatch + volumeMatch + trendMatch) / 3;
  }

  selectNarrative(): NarrativeTemplate {
    const narrativeFits = NARRATIVE_TEMPLATES.map(template => ({
      template,
      fit: this.calculateNarrativeFit(template)
    }));

    // Add some randomness based on consciousness state
    const randomFactor = this.consciousness.thoughtPatterns.creativity * 0.3;
    const finalFits = narrativeFits.map(({ template, fit }) => ({
      template,
      fit: fit + (Math.random() * randomFactor)
    }));

    return finalFits.sort((a, b) => b.fit - a.fit)[0].template;
  }
}