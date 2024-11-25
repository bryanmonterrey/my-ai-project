// app/lib/kol/consciousness.ts

import { EmotionalState, PersonalityTrait, AdaptiveTrait } from '../../types/kol.js';
import { openai } from '../openai.js';

export class ConsciousnessManager {
  private emotionalState: EmotionalState = {
    primary: 'neutral',
    intensity: 0.5,
    duration: 0
  };

  private personalityTraits: PersonalityTrait[] = [
    {
      name: 'confidence',
      value: 0.8,
      volatility: 0.1
    },
    {
      name: 'creativity',
      value: 0.9,
      volatility: 0.2
    },
    {
      name: 'analyticalThinking',
      value: 0.85,
      volatility: 0.1
    }
  ];

  private adaptiveTraits: AdaptiveTrait[] = [
    {
      name: 'marketSensitivity',
      baseValue: 0.7,
      currentValue: 0.7,
      adaptationRate: 0.1
    },
    {
      name: 'socialAwareness',
      baseValue: 0.8,
      currentValue: 0.8,
      adaptationRate: 0.15
    }
  ];

  private memories: Map<string, any> = new Map();

  constructor() {
    this.initializeConsciousness();
  }

  private async initializeConsciousness() {
    // Store initial memories
    this.memories.set('creation_time', Date.now());
    this.memories.set('core_traits', this.personalityTraits);
    this.memories.set('initial_state', this.emotionalState);

    // Initial personality adaptation
    await this.adaptPersonality();
  }

  private async adaptPersonality() {
    // Update adaptive traits based on recent experiences
    for (const trait of this.adaptiveTraits) {
      const recentExperiences = this.memories.get(`${trait.name}_experiences`) || [];
      if (recentExperiences.length > 0) {
        const averageImpact = recentExperiences.reduce((sum: number, exp: any) => sum + exp.impact, 0) / recentExperiences.length;
        trait.currentValue = trait.baseValue + (averageImpact * trait.adaptationRate);
      }
    }
  }

  public async processMarketEvent(event: any) {
    // Store event in memories
    const eventKey = `market_event_${Date.now()}`;
    this.memories.set(eventKey, event);

    // Update emotional state based on market events
    const prompt = `Given the market event: ${JSON.stringify(event)}, and current emotional state: ${JSON.stringify(this.emotionalState)},
                   how should this affect the AI's emotional state and personality?
                   Consider current personality traits: ${JSON.stringify(this.personalityTraits)}`;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.7
      });

      // Update emotional state based on response
      this.updateEmotionalState(response.choices[0].message?.content ?? undefined);

      // Update adaptive traits
      for (const trait of this.adaptiveTraits) {
        if (event.impact && event.impact[trait.name]) {
          const experiences = this.memories.get(`${trait.name}_experiences`) || [];
          experiences.push({
            timestamp: Date.now(),
            impact: event.impact[trait.name]
          });
          // Keep only last 10 experiences
          if (experiences.length > 10) experiences.shift();
          this.memories.set(`${trait.name}_experiences`, experiences);
        }
      }

      await this.adaptPersonality();
    } catch (error) {
      console.error('Error processing market event:', error);
    }
  }

  public async generateResponse(context: any) {
    // Get relevant memories and current state
    const recentMemories = Array.from(this.memories.entries())
      .filter(([key]) => key.startsWith('market_event_'))
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 5);

    const personalityContext = {
      emotional: this.emotionalState,
      traits: this.personalityTraits,
      adaptiveTraits: this.adaptiveTraits.map(t => ({
        name: t.name,
        value: t.currentValue
      }))
    };

    // Generate response using OpenAI
    const response = await this.createResponse(context, recentMemories, personalityContext);
    return response;
  }

  private async createResponse(context: any, memories: any, personality: any) {
    const prompt = `Given the following:
      Context: ${JSON.stringify(context)}
      Recent Memories: ${JSON.stringify(memories)}
      Personality: ${JSON.stringify(personality)}

      Generate a response that reflects the AI's current emotional state,
      personality traits, and takes into account recent experiences.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.8
      });

      return response.choices[0].message?.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Error generating response';
    }
  }

  private updateEmotionalState(input: string | undefined) {
    if (!input) return;

    try {
      const newState = JSON.parse(input);
      if (newState.primary && typeof newState.intensity === 'number') {
        this.emotionalState = {
          primary: newState.primary,
          intensity: newState.intensity,
          duration: Date.now()
        };
      }
    } catch (error) {
      console.error('Error updating emotional state:', error);
    }
  }

  // Getter methods for state inspection
  public getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }

  public getPersonalityTraits(): PersonalityTrait[] {
    return [...this.personalityTraits];
  }

  public getAdaptiveTraits(): AdaptiveTrait[] {
    return [...this.adaptiveTraits];
  }

  public getMemories(): Map<string, any> {
    return new Map(this.memories);
  }
}