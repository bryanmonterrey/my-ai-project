// app/types/kol.ts

export interface MarketPattern {
    type: string;
    confidence: number;
    timestamp: number;
    indicators: string[];
  }
  
  export interface Interaction {
    type: 'tweet' | 'reply' | 'thread' | 'rant';
    content: string;
    engagement: number;
    sentiment: number;
    timestamp: number;
  }
  
  export interface SuccessMetric {
    type: string;
    value: number;
    timestamp: number;
  }
  
  export interface Pattern {
    pattern: string;
    frequency: number;
    effectiveness: number;
  }
  
  export interface Insight {
    type: string;
    content: string;
    confidence: number;
    timestamp: number;
  }
  
  export interface PersonalityTrait {
    name: string;
    value: number;
    volatility: number;
  }
  
  export interface AdaptiveTrait {
    name: string;
    baseValue: number;
    currentValue: number;
    adaptationRate: number;
  }
  
  export interface EmotionalState {
    primary: string;
    intensity: number;
    duration: number;
  }
  
  export interface NarrativeStyle {
    type: string;
    effectiveness: number;
    adaptability: number;
  }
  
  interface AIKOLSystem {
    // Market Analysis
    marketAwareness: {
      technicalAnalysis: boolean;
      sentimentTracking: boolean;
      memeticPotential: number;
      trendPrediction: boolean;
    };
  
    // Personality Core
    consciousness: {
      memory: {
        shortTerm: string[];
        longTerm: {
          marketPatterns: MarketPattern[];
          socialInteractions: Interaction[];
          memeticSuccess: SuccessMetric[];
        };
      };
      personality: {
        baseTraits: PersonalityTrait[];
        adaptiveTraits: AdaptiveTrait[];
        emotionalState: EmotionalState;
        narrativeStyle: NarrativeStyle;
      };
      learning: {
        engagementPatterns: Pattern[];
        successfulMemes: string[];
        failedApproaches: string[];
        marketInsights: Insight[];
      };
    };
  
    // Social Influence
    influenceEngine: {
      contentGeneration: {
        memeCreation: boolean;
        threadComposition: boolean;
        marketNarratives: boolean;
      };
      engagement: {
        communityInteraction: boolean;
        trendParticipation: boolean;
        narrativeBuilding: boolean;
      };
      analytics: {
        engagementTracking: boolean;
        sentimentAnalysis: boolean;
        memeticSpread: boolean;
      };
    };
  
    // Trading Integration
    tradingEngine: {
      analysis: {
        technical: boolean;
        fundamental: boolean;
        memetic: boolean;
        social: boolean;
      };
      execution: {
        automated: boolean;
        riskManagement: boolean;
        portfolioBalance: boolean;
      };
      performance: {
        tracking: boolean;
        optimization: boolean;
        learning: boolean;
      };
  };
}
