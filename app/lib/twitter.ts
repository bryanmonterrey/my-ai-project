// app/lib/twitter.ts
import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
  private client: TwitterApi;
  private rateLimitDelays: { [key: string]: number } = {};
  private readonly MIN_DELAY = 60000; // 1 minute minimum delay between requests
  
  constructor(
    apiKey?: string,
    apiSecret?: string,
    accessToken?: string,
    accessSecret?: string,
  ) {
    const key = apiKey || process.env.TWITTER_API_KEY;
    const secret = apiSecret || process.env.TWITTER_API_SECRET;
    const token = accessToken || process.env.TWITTER_ACCESS_TOKEN;
    const tokenSecret = accessSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (!key || !secret || !token || !tokenSecret) {
      throw new Error(
        'Missing Twitter API credentials. Please check your .env file:\n' +
        `API Key: ${key ? 'Present' : 'Missing'}\n` +
        `API Secret: ${secret ? 'Present' : 'Missing'}\n` +
        `Access Token: ${token ? 'Present' : 'Missing'}\n` +
        `Access Token Secret: ${tokenSecret ? 'Present' : 'Missing'}`
      );
    }

    this.client = new TwitterApi({
      appKey: key,
      appSecret: secret,
      accessToken: token,
      accessSecret: tokenSecret,
    });
  }

  private async handleRateLimit(endpoint: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimitDelays[endpoint] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < this.MIN_DELAY) {
      const delay = this.MIN_DELAY - timeSinceLastRequest;
      console.log(`Rate limit delay for ${endpoint}: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.rateLimitDelays[endpoint] = now;
  }

  async postTweet(content: string, options?: {
    replyToId?: string;
    mediaIds?: string[];
  }) {
    try {
      await this.handleRateLimit('tweet');
      
      console.log('Posting tweet:', content);
      
      const mediaArray = options?.mediaIds?.slice(0, 4) as 
        [string] | [string, string] | [string, string, string] | [string, string, string, string] | undefined;

      return await this.client.v2.tweet({
        text: content,
        reply: options?.replyToId ? { in_reply_to_tweet_id: options.replyToId } : undefined,
        media: mediaArray ? { media_ids: mediaArray } : undefined,
      });
    } catch (error: any) {
      console.error('Failed to post tweet:', error);
      throw error;
    }
  }

  async getUserTimeline() {
    try {
      await this.handleRateLimit('timeline');
      
      if (!process.env.TWITTER_USER_ID) {
        throw new Error('TWITTER_USER_ID is required for timeline fetching');
      }

      const timeline = await this.client.v2.userTimeline(process.env.TWITTER_USER_ID, {
        max_results: 10,
        "tweet.fields": ["created_at", "public_metrics"]
      });

      return timeline;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      throw error;
    }
  }

  async verifyCredentials() {
    try {
      const me = await this.client.v2.me();
      return !!me.data;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return false;
    }
  }

  async getTweetMetrics(tweetId: string) {
    const response = await this.client.v2.singleTweet(tweetId, {
      "tweet.fields": ["public_metrics"]
    });
    return response.data.public_metrics;
  }

  async search(query: string) {
    const response = await this.client.get('tweets/search/recent', {
      query: query,
      max_results: 100
    });
    return response.data;
  }
}