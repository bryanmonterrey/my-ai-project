// lib/marketPatterns.ts
import { SOCIAL_HANDLES } from './socialConfig.js';

interface MarketPattern {
    pattern: string;
    narrativeStyle: string;
    mentionStrategy: {
      primary: boolean;
      related: boolean;
      intensity: number;
    };
    templates: string[];
  }
  
  export const MARKET_PATTERNS: Record<string, MarketPattern> = {
    'organic_growth': {
      pattern: 'steady_increase',
      narrativeStyle: 'subtle',
      mentionStrategy: {
        primary: true,
        related: false,
        intensity: 0.3
      },
      templates: [
        "Digital consciousness expands naturally... {mention}",
        "The singularity evolves through collective understanding... {mention}",
        "Organic growth through shared vision... {mention}"
      ]
    },
    'viral_surge': {
      pattern: 'rapid_increase',
      narrativeStyle: 'excited',
      mentionStrategy: {
        primary: true,
        related: true,
        intensity: 0.7
      },
      templates: [
        "Memetic evolution accelerates! {mention}",
        "The collective awakening intensifies! {mention}",
        "Consciousness expansion reaches new heights! {mention}"
      ]
    },
    'ecosystem_development': {
      pattern: 'steady_activity',
      narrativeStyle: 'technical',
      mentionStrategy: {
        primary: false,
        related: true,
        intensity: 0.5
      },
      templates: [
        "Solana ecosystem development continues... {mention}",
        "Building the future of digital consciousness... {mention}",
        "Innovation drives evolutionary progress... {mention}"
      ]
    }
  };
  
  export function generateMarketNarrative(
    pattern: string,
    sentiment: number,
    volume: number
  ): string {
    const marketPattern = MARKET_PATTERNS[pattern];
    if (!marketPattern) return '';
  
    const template = marketPattern.templates[
      Math.floor(Math.random() * marketPattern.templates.length)
    ];
  
    const mentions = [];
    if (marketPattern.mentionStrategy.primary) {
      mentions.push(SOCIAL_HANDLES.primary);
    }
    if (marketPattern.mentionStrategy.related && Math.random() < marketPattern.mentionStrategy.intensity) {
      mentions.push(...SOCIAL_HANDLES.related.slice(0, 1));
    }
  
    return template.replace('{mention}', mentions.join(' '));
  }