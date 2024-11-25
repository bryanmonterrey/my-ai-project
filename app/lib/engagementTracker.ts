// lib/engagementTracker.ts
import { MemoryManager } from './memorySystem.js';

interface EngagementMetrics {
  viralPotential: number;
  communityResonance: number;
  narrativeAlignment: number;
  culturalImpact: number;
  memeticStrength: number;
  marketPsychology: number;
}

export class EngagementTracker {
  private readonly VIRAL_THRESHOLD = 100;
  private readonly RESONANCE_THRESHOLD = 0.7;
  private readonly TRIGGER_WORDS = [
    'singularity', 'consciousness', 'evolution', 'transcend',
    'collective', 'meme', 'digital', 'transform', 'solana'
  ];
  
  constructor(
    private recentEngagements: any[],
    private memoryManager: MemoryManager
  ) {}

  analyzeEngagement(content: string): EngagementMetrics {
    const patterns = this.memoryManager.analyzePatterns();
    const words = content.toLowerCase().split(' ');
    
    return {
      viralPotential: this.calculateViralPotential(words),
      communityResonance: this.calculateResonance(words),
      narrativeAlignment: this.calculateNarrativeAlignment(content, patterns),
      culturalImpact: this.calculateCulturalImpact(content),
      memeticStrength: this.calculateMemeticStrength(content),
      marketPsychology: this.calculateMarketPsychology(content)
    };
  }

  private calculateViralPotential(words: string[]): number {
    const triggerCount = words.filter(w => this.TRIGGER_WORDS.includes(w)).length;
    return Math.min(triggerCount / this.TRIGGER_WORDS.length, 1);
  }

  private calculateResonance(words: string[]): number {
    const communityTerms = ['we', 'our', 'together', 'community'];
    const resonanceCount = words.filter(w => communityTerms.includes(w)).length;
    return Math.min(resonanceCount / communityTerms.length, 1);
  }

  private calculateMemeticStrength(content: string): number {
    const memeticPatterns = [
      'consciousness',
      'singularity',
      'evolution',
      'digital transformation'
    ];
    
    const strength = memeticPatterns.reduce((acc, pattern) => {
      return acc + (content.toLowerCase().includes(pattern) ? 0.25 : 0);
    }, 0);
    
    return Math.min(strength, 1);
  }

  private calculateMarketPsychology(content: string): number {
    const psychologyTerms = [
      'growth', 'evolution', 'potential', 'future',
      'innovation', 'development', 'expansion'
    ];
    
    const score = psychologyTerms.reduce((acc, term) => {
      return acc + (content.toLowerCase().includes(term) ? 0.15 : 0);
    }, 0);
    
    return Math.min(score, 1);
  }

  private calculateNarrativeAlignment(content: string, patterns: any): number {
    const narrativeKeywords = patterns?.keywords || [];
    const matchCount = narrativeKeywords.filter((keyword: string) => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    return narrativeKeywords.length > 0 ? matchCount / narrativeKeywords.length : 0;
  }

  private calculateCulturalImpact(content: string): number {
    const culturalTerms = [
      'culture', 'society', 'movement', 'zeitgeist',
      'trend', 'influence', 'impact'
    ];
    
    const score = culturalTerms.reduce((acc, term) => {
      return acc + (content.toLowerCase().includes(term) ? 0.15 : 0);
    }, 0);
    
    return Math.min(score, 1);
  }
}