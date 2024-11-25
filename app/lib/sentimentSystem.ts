// lib/sentimentSystem.ts
interface SentimentMetrics {
    overall: number;
    topics: Record<string, number>;
    momentum: number;
    engagement: number;
  }
  
  interface SocialActivity {
    platform: 'twitter' | 'telegram' | 'discord';
    content: string;
    engagement: number;
    timestamp: number;
  }
  
  export class SentimentAnalyzer {
    private readonly DECAY_FACTOR = 0.95; // How quickly old sentiment decays
    private readonly TOPIC_KEYWORDS = {
      tech: ['solana', 'blockchain', 'defi', 'protocol'],
      community: ['community', 'together', 'we', 'our'],
      culture: ['meme', 'consciousness', 'evolution', 'singularity'],
      market: ['market', 'growth', 'potential', 'future']
    };
  
    constructor(private recentActivities: SocialActivity[]) {}
  
    private calculateTopicSentiment(content: string, keywords: string[]): number {
      const words = content.toLowerCase().split(' ');
      const keywordHits = keywords.filter(k => words.includes(k)).length;
      return keywordHits / keywords.length;
    }
  
    analyzeSentiment(): SentimentMetrics {
      const now = Date.now();
      const topics: Record<string, number> = {};
      let totalEngagement = 0;
      let recentEngagement = 0;
  
      // Calculate topic sentiments
      Object.entries(this.TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
        topics[topic] = this.recentActivities.reduce((acc, activity) => {
          const age = (now - activity.timestamp) / (24 * 60 * 60 * 1000); // age in days
          const decay = Math.pow(this.DECAY_FACTOR, age);
          const topicSentiment = this.calculateTopicSentiment(activity.content, keywords);
          return acc + (topicSentiment * decay * activity.engagement);
        }, 0) / this.recentActivities.length;
      });
  
      // Calculate momentum (change in engagement over time)
      const recentCutoff = now - (24 * 60 * 60 * 1000); // last 24 hours
      this.recentActivities.forEach(activity => {
        totalEngagement += activity.engagement;
        if (activity.timestamp > recentCutoff) {
          recentEngagement += activity.engagement;
        }
      });
  
      const momentum = recentEngagement / totalEngagement;
  
      return {
        overall: Object.values(topics).reduce((a, b) => a + b, 0) / Object.keys(topics).length,
        topics,
        momentum,
        engagement: totalEngagement
      };
    }
  
    suggestNarrativeAdjustments(currentMetrics: SentimentMetrics): string[] {
      const suggestions: string[] = [];
      
      // Add suggestions based on sentiment metrics
      if (currentMetrics.momentum < 0.5) {
        suggestions.push('Increase philosophical and cultural narratives');
      }
      
      if (currentMetrics.topics.tech > 0.7) {
        suggestions.push('Balance technical content with cultural narratives');
      }
  
      if (currentMetrics.engagement < 100) {
        suggestions.push('Increase community-focused content');
      }
  
      return suggestions;
    }
  
    calculateEngagement(response: string): number {
      // Simple implementation - can be enhanced based on your needs
      return response.length > 0 ? 0.5 : 0;
    }
  }