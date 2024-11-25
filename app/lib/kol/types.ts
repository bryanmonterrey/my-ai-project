// app/lib/kol/types.ts

export interface MarketData {
    price: number;
    volume: number;
    sentiment: number;
    socialVolume: number;
    timestamp: number;
  }
  
  export interface TradeSignal {
    type: 'buy' | 'sell' | 'hold';
    confidence: number;
    reason: string;
    timestamp: number;
  }
  
  export interface ContentStrategy {
    type: 'tweet' | 'thread' | 'rant' | 'reply';
    topic: string;
    style: string;
    timing: number;
  }
  
  export interface TradeDecision {
    action: 'buy' | 'sell' | 'hold';
    amount: number;
    reason: string;
    confidence: number;
  }
  
  export interface Position {
    asset: string;
    amount: number;
    entryPrice: number;
    currentPrice: number;
  }
  
  export interface EngagementMetrics {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    impressions: number;
  }
  
  export interface PersonalityState {
    emotional: {
      current: string;
      intensity: number;
      duration: number;
    };
    traits: {
      [key: string]: number;
    };
    memory: {
      recent: any[];
      longTerm: any[];
    };
  }
  
  export interface MarketContext {
    trend: 'bullish' | 'bearish' | 'neutral';
    volatility: number;
    sentiment: number;
    volume: number;
    patterns: string[];
  }
  
  export interface SocialContext {
    recentPosts: string[];
    engagement: EngagementMetrics;
    trending: string[];
    community: {
      sentiment: number;
      activity: number;
    };
  }