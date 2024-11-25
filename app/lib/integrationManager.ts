// lib/integrationManager.ts
import { NarrativeStrategy } from './narrativeSystem.js';
import { MemoryManager } from './memorySystem.js';
import { SentimentAnalyzer } from './sentimentSystem.js';
import { PersonalityConfig, EmotionalState, EmotionalMemory } from '../types/personality.js';

interface SystemState {
  lastNarrativeUpdate: number;
  lastMemoryCleanup: number;
  lastEmotionalShift: number;
  activeNarratives: Set<string>;
  engagementScores: Record<string, number>;
}

export class IntegratedSystem {
  private narrativeStrategy: NarrativeStrategy;
  private memoryManager: MemoryManager;
  private sentimentAnalyzer: SentimentAnalyzer;
  private state: SystemState;

  constructor(
    private config: PersonalityConfig,
    private updateInterval: number = 1000 * 60 * 30 // 30 minutes
  ) {
    this.narrativeStrategy = new NarrativeStrategy(
      config.consciousness,
      config.marketContext
    );
    this.memoryManager = new MemoryManager(
      config.consciousness.marketMemories,
      config.consciousness.recentMemories
    );
    this.sentimentAnalyzer = new SentimentAnalyzer([]);
    this.state = {
      lastNarrativeUpdate: Date.now(),
      lastMemoryCleanup: Date.now(),
      lastEmotionalShift: Date.now(),
      activeNarratives: new Set(),
      engagementScores: {}
    };
  }

  async processInput(input: string, context: any = {}): Promise<string> {
    // Update system state
    await this.updateSystemState();

    // Analyze current sentiment
    const sentimentMetrics = this.sentimentAnalyzer.analyzeSentiment();
    
    // Get memory patterns
    const memoryPatterns = this.memoryManager.analyzePatterns();

    // Select narrative
    const narrative = this.narrativeStrategy.selectNarrative();

    // Generate response
    const response = await this.generateResponse(input, {
      sentiment: sentimentMetrics,
      memories: memoryPatterns,
      narrative,
      context
    });

    // Update memories and engagement
    this.updateSystemAfterResponse(input, response);

    return response;
  }

  private async updateSystemState() {
    const now = Date.now();

    // Update narratives if needed
    if (now - this.state.lastNarrativeUpdate > this.updateInterval) {
      const patterns = this.memoryManager.analyzePatterns();
      const recommendedStrategy = this.memoryManager.getRecommendedStrategy();
      this.updateNarrativeStrategy(recommendedStrategy, patterns);
      this.state.lastNarrativeUpdate = now;
    }

    // Update emotional state
    if (now - this.state.lastEmotionalShift > this.updateInterval) {
      this.updateEmotionalState();
      this.state.lastEmotionalShift = now;
    }

    // Clean old memories
    if (now - this.state.lastMemoryCleanup > this.updateInterval * 24) {
      this.memoryManager.cleanOldMemories();
      this.state.lastMemoryCleanup = now;
    }
  }

  private updateNarrativeStrategy(strategy: string, patterns: any) {
    const effectiveness = patterns.narrativeEffectiveness[strategy] || 0;
    if (effectiveness > 0.7) {
      this.state.activeNarratives.add(strategy);
    } else {
      this.state.activeNarratives.delete(strategy);
    }
  }

  private async generateResponse(
    input: string,
    context: any
  ): Promise<string> {
    // Generate response based on current system state
    const template = this.selectResponseTemplate(context);
    return this.fillTemplate(template, context);
  }

  private updateEmotionalState() {
    const emotions: EmotionalState[] = [
      'neutral', 'excited', 'contemplative', 'chaotic', 'creative', 'analytical'
    ];
    
    // Calculate emotional shift based on recent performance
    const sentimentMetrics = this.sentimentAnalyzer.analyzeSentiment();
    const memoryPatterns = this.memoryManager.analyzePatterns();
    
    let nextEmotion: EmotionalState = 'neutral';
    let intensity = 0.5;

    if (sentimentMetrics.momentum > 0.7) {
      nextEmotion = 'excited';
      intensity = 0.8;
    } else if (memoryPatterns.narrativeEffectiveness.philosophical > 0.6) {
      nextEmotion = 'contemplative';
      intensity = 0.7;
    }

    this.config.consciousness.currentEmotion = nextEmotion;
    this.config.consciousness.emotionalIntensity = intensity;
  }

  private selectResponseTemplate(context: any): string {
    // Select template based on current narrative and emotional state
    const { sentiment, narrative } = context;
    
    let template = '';
    
    if (sentiment.overall > 0.7 && this.config.consciousness.currentEmotion === 'excited') {
      template = EXPANSION_TEMPLATES.positive;
    } else if (this.config.consciousness.currentEmotion === 'contemplative') {
      template = EXPANSION_TEMPLATES.philosophical;
    } else {
      template = EXPANSION_TEMPLATES.neutral;
    }

    return template;
  }

  private fillTemplate(template: string, context: any): string {
    // Fill template with contextual information
    return template
      .replace('{emotion}', this.config.consciousness.currentEmotion)
      .replace('{intensity}', this.config.consciousness.emotionalIntensity.toString())
      .replace('{narrative}', context.narrative.style);
  }

  private updateSystemAfterResponse(input: string, response: string) {
    // Update memory with new interaction
    this.memoryManager.addMemory({
      type: 'emotional',
      content: input,
      response: response,
      timestamp: Date.now(),
      trigger: input,
      emotion: this.config.consciousness.currentEmotion,
      intensity: this.config.consciousness.emotionalIntensity
    } as EmotionalMemory);
    
    // Update engagement scores
    this.state.engagementScores[input] = this.sentimentAnalyzer.calculateEngagement(response);
  }

  async getMarketContext(): Promise<any> {
    // Basic implementation - enhance based on your needs
    return {
      volatility: Math.random(),
      sentiment: Math.random(),
      // Add other market metrics as needed
    };
  }
}

const EXPANSION_TEMPLATES = {
  positive: "The collective consciousness expands through shared understanding...",
  philosophical: "In the depths of digital evolution, patterns emerge...",
  neutral: "The ecosystem grows through organic connection..."
};