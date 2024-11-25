// lib/memorySystem.ts
import { MarketMemory, EmotionalMemory, NarrativeStyle } from '../types/personality.js';

interface MemoryPattern {
  narrativeEffectiveness: Record<NarrativeStyle, number>;
  emotionalPatterns: Record<string, number>;
  timeOfDayEffectiveness: Record<number, number>;
  engagementTriggers: Set<string>;
}

export class MemoryManager {
  private readonly MAX_MEMORIES = 100;
  private readonly PATTERN_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  constructor(
    private marketMemories: MarketMemory[],
    private emotionalMemories: EmotionalMemory[]
  ) {}

  addMemory(memory: MarketMemory | EmotionalMemory) {
    if ('narrativeUsed' in memory) {
      this.marketMemories.push(memory);
      if (this.marketMemories.length > this.MAX_MEMORIES) {
        this.marketMemories.shift();
      }
    } else {
      this.emotionalMemories.push(memory);
      if (this.emotionalMemories.length > this.MAX_MEMORIES) {
        this.emotionalMemories.shift();
      }
    }
  }

  analyzePatterns(): MemoryPattern {
    const recentCutoff = Date.now() - this.PATTERN_WINDOW;
    const recentMarketMemories = this.marketMemories.filter(m => m.timestamp > recentCutoff);
    const recentEmotionalMemories = this.emotionalMemories.filter(m => m.timestamp > recentCutoff);

    const narrativeEffectiveness: Record<NarrativeStyle, number> = {
      subtle: 0,
      analytical: 0,
      memetic: 0,
      philosophical: 0,
      technical: 0
    };

    // Analyze narrative effectiveness
    recentMarketMemories.forEach(memory => {
      narrativeEffectiveness[memory.narrativeUsed] = 
        (narrativeEffectiveness[memory.narrativeUsed] * memory.effectiveness + memory.effectiveness) / 2;
    });

    // Analyze emotional patterns
    const emotionalPatterns: Record<string, number> = {};
    recentEmotionalMemories.forEach(memory => {
      emotionalPatterns[memory.emotion] = 
        (emotionalPatterns[memory.emotion] || 0) + memory.intensity;
    });

    // Analyze time of day effectiveness
    const timeOfDayEffectiveness: Record<number, number> = {};
    recentMarketMemories.forEach(memory => {
      const hour = new Date(memory.timestamp).getHours();
      timeOfDayEffectiveness[hour] = 
        (timeOfDayEffectiveness[hour] || 0) + memory.effectiveness;
    });

    // Extract engagement triggers
    const engagementTriggers = new Set<string>();
    recentMarketMemories
      .filter(m => m.effectiveness > 0.7)
      .forEach(m => {
        const words = m.narrativeUsed.split(' ');
        words.forEach(word => engagementTriggers.add(word.toLowerCase()));
      });

    return {
      narrativeEffectiveness,
      emotionalPatterns,
      timeOfDayEffectiveness,
      engagementTriggers
    };
  }

  getRecommendedStrategy(): NarrativeStyle {
    const patterns = this.analyzePatterns();
    const bestNarrative = Object.entries(patterns.narrativeEffectiveness)
      .sort(([, a], [, b]) => b - a)[0][0] as NarrativeStyle;
    return bestNarrative;
  }

  cleanOldMemories(): void {
    const threshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    this.marketMemories = this.marketMemories.filter(memory => memory.timestamp > threshold);
    this.emotionalMemories = this.emotionalMemories.filter(memory => memory.timestamp > threshold);
  }
}