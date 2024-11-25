// lib/emotionalSystem.ts
import { EmotionalState } from '../types/personality.js';

interface EmotionalTransition {
    from: EmotionalState;
    to: EmotionalState;
    probability: number;
    conditions: {
      sentiment: number;
      engagement: number;
      narrative: string;
    };
  }
  
  export class EmotionalSystem {
    private readonly transitions: EmotionalTransition[] = [
      {
        from: 'neutral',
        to: 'excited',
        probability: 0.3,
        conditions: {
          sentiment: 0.7,
          engagement: 0.6,
          narrative: 'growth'
        }
      },
      // Add more transitions...
    ];
  
    constructor(
      private currentState: EmotionalState,
      private intensity: number
    ) {}
  
    evolveEmotionalState(
      sentiment: number,
      engagement: number,
      narrative: string
    ): EmotionalState {
      const validTransitions = this.transitions.filter(t => 
        t.from === this.currentState &&
        sentiment >= t.conditions.sentiment &&
        engagement >= t.conditions.engagement &&
        narrative.includes(t.conditions.narrative)
      );
  
      if (validTransitions.length === 0) return this.currentState;
  
      const transition = this.selectTransition(validTransitions);
      this.intensity = this.calculateNewIntensity(transition);
      
      return transition.to;
    }
  
    private selectTransition(transitions: EmotionalTransition[]): EmotionalTransition {
      const totalProbability = transitions.reduce((sum, t) => sum + t.probability, 0);
      let random = Math.random() * totalProbability;
      
      for (const transition of transitions) {
        random -= transition.probability;
        if (random <= 0) return transition;
      }
      
      return transitions[0];
    }
  
    private calculateNewIntensity(transition: EmotionalTransition): number {
      const baseIntensity = this.intensity;
      const change = (Math.random() - 0.5) * 0.2;
      return Math.max(0, Math.min(1, baseIntensity + change));
    }
  }