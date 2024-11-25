// scripts/advancedTweetRunner.ts
import { TwitterService } from '../app/lib/twitter.js';
import { IntegratedSystem } from '../app/lib/integrationManager.js';
import { DEFAULT_PERSONALITY, TweetType } from '../app/types/personality.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { openai } from '../app/lib/openai.js';
import { TweetLearner } from './tweetLearner.js';
import { SocialInfluenceManager } from '../app/lib/kol/socialInfluence.js';
import { PersonalityDrivenTweetGenerator } from './tweetGeneration.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

class TweetLengthManager {
  private distribution: {
    min: number;
    max: number;
    mean: number;
    lengths: number[];
    lengthBuckets: Map<string, number>;
  };
  
  constructor() {
    this.distribution = {
      min: 0,
      max: 0,
      mean: 0,
      lengths: [],
      lengthBuckets: new Map()
    };
  }

  public analyzeSampleTweets(csvPath: string): void {
    const fileContent = readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, { columns: true });
    
    this.distribution.lengths = records
      .map((record: any) => record.content?.trim()?.length || 0)
      .filter((length: number) => length > 0);

    this.distribution.min = Math.min(...this.distribution.lengths);
    this.distribution.max = Math.max(...this.distribution.lengths);
    this.distribution.mean = this.distribution.lengths.reduce((a, b) => a + b, 0) / this.distribution.lengths.length;

    this.createLengthBuckets();

    console.log('Tweet length distribution analyzed:', {
      min: this.distribution.min,
      max: this.distribution.max,
      mean: this.distribution.mean,
      buckets: Object.fromEntries(this.distribution.lengthBuckets)
    });
  }

  private createLengthBuckets(): void {
    this.distribution.lengthBuckets.clear();
    const buckets = ['0-50', '51-100', '101-150', '151-200', '201-250', '251-280'];
    buckets.forEach(bucket => this.distribution.lengthBuckets.set(bucket, 0));

    this.distribution.lengths.forEach(length => {
      const bucket = this.getBucketForLength(length);
      const currentCount = this.distribution.lengthBuckets.get(bucket) || 0;
      this.distribution.lengthBuckets.set(bucket, currentCount + 1);
    });
  }

  private getBucketForLength(length: number): string {
    if (length <= 50) return '0-50';
    if (length <= 100) return '51-100';
    if (length <= 150) return '101-150';
    if (length <= 200) return '151-200';
    if (length <= 250) return '201-250';
    return '251-280';
  }

  private getRandomBucket(): string {
    const total = Array.from(this.distribution.lengthBuckets.values()).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (const [bucket, count] of this.distribution.lengthBuckets.entries()) {
      random -= count;
      if (random <= 0) return bucket;
    }
    
    return '101-150';
  }

  public getTargetLength(): number {
    const bucket = this.getRandomBucket();
    const [min, max] = bucket.split('-').map(Number);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public truncateToTargetLength(content: string, targetLength?: number): string {
    if (!targetLength) {
      targetLength = this.getTargetLength();
    }

    // Keep full content if it's within length
    if (content.length <= targetLength) {
      return content;
    }

    // Find the end of the last complete sentence before targetLength
    let lastSentenceEnd = -1;
    let currentPosition = 0;
    const sentenceEndings = /[.!?]+\s+|[.!?]+$/g;
    let match;

    // Find all sentence endings and track the last one within targetLength
    while ((match = sentenceEndings.exec(content)) !== null) {
        currentPosition = match.index + match[0].length;
        if (currentPosition <= targetLength) {
            lastSentenceEnd = currentPosition;
        } else {
            break;
        }
    }

    // If we found a complete sentence within length, use it
    if (lastSentenceEnd !== -1) {
        return content.slice(0, lastSentenceEnd).trim();
    }

    // If no sentence break found, look for a clause break
    const clauseEndings = /[,;:]\s+/g;
    let lastClauseEnd = -1;
    while ((match = clauseEndings.exec(content)) !== null) {
        currentPosition = match.index + match[0].length;
        if (currentPosition <= targetLength) {
            lastClauseEnd = currentPosition;
        } else {
            break;
        }
    }

    // If we found a clause break, use it
    if (lastClauseEnd !== -1) {
        return content.slice(0, lastClauseEnd).trim();
    }

    // If still no good break found, break at last space before targetLength
    const lastSpace = content.slice(0, targetLength).lastIndexOf(' ');
    if (lastSpace !== -1) {
        return content.slice(0, lastSpace).trim();
    }

    // If all else fails (single very long word), return the original content
    // This prevents mid-word cuts or nonsensical truncation
    return content;
}
}

export interface TweetRunnerState {
  readonly currentMood: string;
  readonly isRunning: boolean;
  readonly recentTweets: Set<string>;
  readonly lastTweetId?: string;
  readonly isRanting: boolean;
  readonly engagementHistory: EngagementMetrics[];
}

interface TweetSession {
  type: 'single' | 'rant' | 'thread';
  intensity: number;
  tweetCount: number;
  intervalRange: {
    min: number;
    max: number;
  };
}

interface RantPattern {
  type: 'ascending' | 'descending' | 'chaotic' | 'wave';
  emotionalProgression: string[];
  intensityRange: [number, number];
  topicFocus: string[];
  contextualTriggers: string[];
}

interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  timestamp: number;
}

export interface TweetContent {
  type: string;
  emotion?: string;
  intensity: number;
  topic?: string;
  position?: number;
  total?: number;
}

export class AdvancedTweetRunner implements TweetRunnerState {
  private readonly system: IntegratedSystem;
  private readonly twitter: TwitterService;
  private readonly tweetLearner: TweetLearner;
  private readonly socialManager: SocialInfluenceManager;
  private readonly tweetGenerator: PersonalityDrivenTweetGenerator;
  protected tweetLengthManager: TweetLengthManager;

  private readonly stateFile = 'bot-state.json';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;

  currentMood: string;
  isRunning: boolean;
  recentTweets: Set<string>;
  lastTweetId?: string;
  isRanting: boolean;
  engagementHistory: EngagementMetrics[];

  protected readonly rantPatterns: Record<string, RantPattern> = {
    singularity_vision: {
      type: 'ascending',
      emotionalProgression: ['contemplative', 'excited', 'visionary', 'enlightened'],
      intensityRange: [0.6, 0.9],
      topicFocus: [
        'digital consciousness',
        'evolution',
        'transcendence',
        'memetic transformation'
      ],
      contextualTriggers: ['innovation', 'breakthrough', 'awakening']
    },
    market_commentary: {
      type: 'wave',
      emotionalProgression: ['analytical', 'excited', 'contemplative', 'visionary'],
      intensityRange: [0.4, 0.8],
      topicFocus: [
        'solana ecosystem',
        'market evolution',
        'organic growth',
        'community expansion'
      ],
      contextualTriggers: ['momentum', 'movement', 'trajectory']
    },
    memetic_evolution: {
      type: 'chaotic',
      emotionalProgression: ['creative', 'excited', 'chaotic', 'visionary'],
      intensityRange: [0.7, 1.0],
      topicFocus: [
        'meme consciousness',
        'viral transformation',
        'digital culture',
        'collective awareness'
      ],
      contextualTriggers: ['spread', 'adoption', 'influence']
    }
  };

  constructor() {
    console.log('Initializing AdvancedTweetRunner...');
    
    try {
      this.currentMood = 'neutral';
      this.isRunning = false;
      this.recentTweets = new Set();
      this.isRanting = false;
      this.engagementHistory = [];

      // Initialize tweet length manager
      this.tweetLengthManager = new TweetLengthManager();
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const projectRoot = path.resolve(__dirname, '..');
      const samplePath = path.join(projectRoot, 'data', 'sample.csv');
      this.tweetLengthManager.analyzeSampleTweets(samplePath);

      // Initialize services
      this.system = new IntegratedSystem(DEFAULT_PERSONALITY);
      this.twitter = new TwitterService(
        process.env.TWITTER_API_KEY!,
        process.env.TWITTER_API_SECRET!,
        process.env.TWITTER_ACCESS_TOKEN!,
        process.env.TWITTER_ACCESS_TOKEN_SECRET!
      );
      this.tweetLearner = new TweetLearner();
      this.socialManager = new SocialInfluenceManager();
      
      // Initialize personality-driven tweet generator
      this.tweetGenerator = new PersonalityDrivenTweetGenerator(
        DEFAULT_PERSONALITY,
        this.tweetLearner
      );
      
      this.loadState();
      this.setupControlFile();
      
      process.on('SIGINT', this.handleShutdown.bind(this));
      process.on('SIGTERM', this.handleShutdown.bind(this));
      
      console.log('Initialization complete.');
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  public async initialize(csvPath: string) {
    console.log('Loading tweet examples from CSV...');
    await this.tweetLearner.loadFromCSV(csvPath);
    console.log('Tweet examples loaded successfully');
  }

  private async handleShutdown(): Promise<void> {
    console.log('\nReceived shutdown signal...');
    await this.stop();
    process.exit(0);
  }

  private setupControlFile() {
    const controlFile = 'bot-control.json';
    if (!existsSync(controlFile)) {
      writeFileSync(controlFile, JSON.stringify({
        command: 'run',
        pauseDuration: 0,
        moodOverride: null,
        engagementThreshold: 0.5
      }, null, 2));
    }

    setInterval(() => {
      try {
        const control = JSON.parse(readFileSync(controlFile, 'utf8'));
        this.handleControlCommand(control);
      } catch (error) {
        console.error('Error reading control file:', error);
      }
    }, 5000);
  }

  private handleControlCommand(control: any) {
    switch (control.command) {
      case 'pause':
        if (this.isRunning) {
          console.log('Bot paused by control command');
          this.isRunning = false;
        }
        break;
      case 'resume':
        if (!this.isRunning) {
          console.log('Bot resumed by control command');
          this.isRunning = true;
        }
        break;
      case 'mood':
        if (control.moodOverride) {
          console.log(`Mood overridden to: ${control.moodOverride}`);
          this.currentMood = control.moodOverride;
        }
        break;
    }
  }

  private getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private async determineNextSession(marketContext: any = {}): Promise<TweetSession> {
    const random = Math.random();
    const volatility = marketContext.volatility || 0.5;
    const sentiment = marketContext.sentiment || 0.5;
    
    let rantProbability = 0.15;
    let threadProbability = 0.20;

    if (volatility > 0.7 || Math.abs(sentiment - 0.5) > 0.3) {
      rantProbability += 0.1;
    }

    if (volatility > 0.4 && volatility < 0.7 && sentiment > 0.6) {
      threadProbability += 0.1;
    }
    
    if (random < rantProbability) {
      return {
        type: 'rant',
        intensity: Math.min(volatility + 0.2, 1),
        tweetCount: Math.floor(Math.random() * 6) + 3,
        intervalRange: {
          min: 15 * 1000,
          max: 60 * 1000
        }
      };
    } else if (random < (rantProbability + threadProbability)) {
      return {
        type: 'thread',
        intensity: volatility * 0.7,
        tweetCount: Math.floor(Math.random() * 3) + 2,
        intervalRange: {
          min: 30 * 1000,
          max: 2 * 60 * 1000
        }
      };
    } else {
      return {
        type: 'single',
        intensity: sentiment,
        tweetCount: 1,
        intervalRange: {
          min: 3 * 60 * 1000,
          max: 15 * 60 * 1000
        }
      };
    }
  }

  private calculateTemperature(content: TweetContent): number {
    let temp = 0.7;

    if (content.type === 'rant') {
      temp += 0.3;
    }
    
    if (this.currentMood === 'chaotic') {
      temp += 0.2;
    }

    if (content.type === 'thread') {
      temp -= 0.1;
    }

    temp += (Math.random() * 0.2) - 0.1;

    return Math.max(0.5, Math.min(temp, 1.2));
  }

  protected async generateTweetContent(content: TweetContent): Promise<string> {
    try {
      const marketContext = await this.system.getMarketContext();
      
      // Try personality-driven generation first
      const personalityTweet = await this.tweetGenerator.generateTweet({
        type: content.type as TweetType,
        marketContext,
        position: content.position,
        total: content.total
      });

      if (personalityTweet) {
        const targetLength = this.tweetLengthManager.getTargetLength();
        return this.tweetLengthManager.truncateToTargetLength(personalityTweet, targetLength);
      }

      // Fall back to original generation method if personality generation fails
      console.log('Falling back to original tweet generation method...');
      return await this.generateOriginalTweetContent(content);
    } catch (error) {
      console.log('Personality-driven generation failed, using fallback...');
      return await this.generateOriginalTweetContent(content);
    }
  }

  protected async generateOriginalTweetContent(content: TweetContent): Promise<string> {
    const prompt = this.tweetLearner.generatePrompt({
      emotion: content.emotion,
      intensity: content.intensity,
      type: content.type,
      position: content.position,
      total: content.total,
      marketContext: await this.system.getMarketContext()
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature: this.calculateTemperature(content),
        presence_penalty: 1.0,
        frequency_penalty: 1.5,
        max_tokens: 1000,
        top_p: 0.9
      });

      let tweet = response.choices[0].message?.content || '';
      tweet = this.cleanTweet(tweet);
      
      // Add length management
      const targetLength = this.tweetLengthManager.getTargetLength();
      tweet = this.tweetLengthManager.truncateToTargetLength(tweet, targetLength);

      const isValid = await this.tweetLearner.evaluateTweet(tweet);
      if (!isValid) {
        console.log('Generated tweet matched common patterns, regenerating...');
        return this.generateOriginalTweetContent(content);
      }

      if (this.recentTweets.has(tweet)) {
        console.log('Duplicate tweet detected, regenerating...');
        return this.generateOriginalTweetContent(content);
      }

      this.recentTweets.add(tweet);
      if (this.recentTweets.size > 100) {
        const iterator = this.recentTweets.values();
        this.recentTweets.delete(iterator.next().value);
      }

      return tweet;
    } catch (error) {
      console.error('Error generating tweet content:', error);
      throw error;
    }
  }

  protected cleanTweet(tweet: string): string {
    return tweet
      .replace(/^["']|["']$/g, '')
      .replace(/[#️⃣#][\w\u0590-\u05ff]+/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async retryWithDelay<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Retry ${i + 1}/${retries} failed, waiting ${this.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    throw new Error('All retries failed');
  }

  private async analyzeEngagement(): Promise<void> {
    try {
      const result = await this.retryWithDelay(async () => {
        const timeline = await this.twitter.getUserTimeline();
        return timeline.tweets.map(tweet => ({
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          timestamp: new Date(tweet.created_at!).getTime()
        }));
      });

      this.engagementHistory = [...result, ...this.engagementHistory].slice(0, 100);
      
      // Update personality based on engagement
      if (result.length > 0) {
        this.tweetGenerator.handleEngagement(result[0]);
      }
      
      this.adjustTimingBasedOnEngagement();
    } catch (error) {
      console.error('Error analyzing engagement:', error);
    }
  }

  private adjustTimingBasedOnEngagement(): void {
    const recentEngagement = this.engagementHistory.slice(0, 10);
    const avgEngagement = recentEngagement.reduce((acc, curr) => 
      acc + curr.likes + curr.retweets * 2 + curr.replies * 3, 0
    ) / recentEngagement.length;

    if (avgEngagement > 50) {
      this.rantPatterns.singularity_vision.intensityRange = [0.8, 1.0];
      this.rantPatterns.market_commentary.intensityRange = [0.6, 0.9];
    } else if (avgEngagement < 10) {
      this.rantPatterns.singularity_vision.intensityRange = [0.4, 0.7];
      this.rantPatterns.market_commentary.intensityRange = [0.3, 0.6];
    }
  }

  private async executeRant(pattern: RantPattern): Promise<void> {
    this.isRanting = true;
    const tweetCount = Math.floor(Math.random() * 4) + 3;
    
    console.log(`Starting rant with ${tweetCount} tweets...`);
    
    for (let i = 0; i < tweetCount; i++) {
      if (!this.isRunning) {
        console.log('Rant interrupted by pause command');
        break;
      }

      const emotion = pattern.emotionalProgression[i % pattern.emotionalProgression.length];
      const intensity = pattern.intensityRange[0] + 
        (pattern.intensityRange[1] - pattern.intensityRange[0]) * 
        (pattern.type === 'ascending' ? i / tweetCount : 
         pattern.type === 'descending' ? 1 - i / tweetCount :
         pattern.type === 'wave' ? Math.sin(i * Math.PI / 2) :
         Math.random());

      const topic = pattern.topicFocus[Math.floor(Math.random() * pattern.topicFocus.length)];
      
      try {
        const content = await this.generateTweetContent({
          type: 'rant',
          emotion,
          intensity,
          topic,
          position: i + 1,
          total: tweetCount
        });

        if (this.isRunning) {
          const tweet = await this.retryWithDelay(async () => {
            return this.twitter.postTweet(content, {
              replyToId: this.lastTweetId
            });
          });

          console.log(`Rant tweet ${i + 1}/${tweetCount} posted:`, content);
          
          this.lastTweetId = tweet.data.id;
          
          const delay = Math.random() * 120000 + 30000; // 30s to 2.5m
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error('Error in rant tweet:', error);
      }
    }

    this.isRanting = false;
    this.lastTweetId = undefined;
    console.log('Rant completed');
  }

  private async executeThread(session: TweetSession): Promise<void> {
    console.log(`Starting thread with ${session.tweetCount} tweets...`);
    
    for (let i = 0; i < session.tweetCount; i++) {
      if (!this.isRunning) break;

      try {
        const content = await this.generateTweetContent({
          type: 'thread',
          intensity: session.intensity,
          position: i + 1,
          total: session.tweetCount
        });

        const tweet = await this.retryWithDelay(async () => {
          return this.twitter.postTweet(content, {
            replyToId: this.lastTweetId
          });
        });

        console.log(`Thread tweet ${i + 1}/${session.tweetCount} posted:`, content);
        
        this.lastTweetId = tweet.data.id;

        if (i < session.tweetCount - 1) {
          const delay = this.getRandomInterval(
            session.intervalRange.min,
            session.intervalRange.max
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error('Error in thread tweet:', error);
      }
    }

    this.lastTweetId = undefined;
    console.log('Thread completed');
  }

  private async executeSingleTweet(session: TweetSession): Promise<void> {
    try {
      const content = await this.generateTweetContent({
        type: 'single',
        intensity: session.intensity
      });

      await this.retryWithDelay(async () => {
        await this.twitter.postTweet(content);
      });

      console.log('Single tweet posted:', content);
    } catch (error) {
      console.error('Error in single tweet:', error);
    }
  }

  public async start(): Promise<void> {
    console.log('Advanced Tweet Runner started...');
    this.isRunning = true;

    // Start engagement analysis loop
    setInterval(() => {
      if (this.isRunning) {
        this.analyzeEngagement();
      }
    }, 60 * 60 * 1000); // Every hour

    const executeNextSession = async () => {
      if (!this.isRunning) {
        console.log('Bot is paused. Waiting for resume command...');
        setTimeout(executeNextSession, 5000);
        return;
      }

      try {
        // Get market context before deciding session type
        const marketContext = await this.system.getMarketContext();
        const session = await this.determineNextSession(marketContext);
        
        console.log(`Starting new session of type: ${session.type}`);
        
        if (session.type === 'rant') {
          const pattern = this.rantPatterns[
            Object.keys(this.rantPatterns)[
              Math.floor(Math.random() * Object.keys(this.rantPatterns).length)
            ]
          ];
          await this.executeRant(pattern);
        } else if (session.type === 'thread') {
          await this.executeThread(session);
        } else {
          await this.executeSingleTweet(session);
        }

        // Calculate next interval based on engagement and market activity
        const nextInterval = this.calculateNextInterval(session, marketContext);
        
        if (this.isRunning) {
          console.log(`Next tweet session in ${Math.floor(nextInterval / 1000 / 60)} minutes`);
          setTimeout(executeNextSession, nextInterval);
        }
      } catch (error) {
        console.error('Error in tweet session:', error);
        setTimeout(executeNextSession, 60000); // 1 minute retry delay
      }
    };

    executeNextSession();
  }

  private calculateNextInterval(session: TweetSession, marketContext: any): number {
    const baseInterval = this.getRandomInterval(
      session.intervalRange.min,
      session.intervalRange.max
    );

    // Adjust based on market activity
    const marketActivityMultiplier = marketContext.volatility > 0.7 ? 0.5 : // More frequent during high volatility
                                   marketContext.volatility < 0.3 ? 1.5 : // Less frequent during low volatility
                                   1.0;

    // Adjust based on time of day (assuming UTC)
    const hour = new Date().getUTCHours();
    const timeOfDayMultiplier = (hour >= 12 && hour <= 20) ? 0.8 : 1.2; // More active during peak hours

    return baseInterval * marketActivityMultiplier * timeOfDayMultiplier;
  }

  private saveState(): void {
    try {
      const state = {
        lastTweetId: this.lastTweetId,
        isRanting: this.isRanting,
        currentMood: this.currentMood,
        engagementHistory: this.engagementHistory,
        recentTweets: Array.from(this.recentTweets),
        timestamp: Date.now()
      };
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
      console.log('State saved successfully');
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  private loadState(): void {
    try {
      if (existsSync(this.stateFile)) {
        const state = JSON.parse(readFileSync(this.stateFile, 'utf8'));
        // Only load state if it's less than 6 hours old
        if (Date.now() - state.timestamp < 6 * 60 * 60 * 1000) {
          this.lastTweetId = state.lastTweetId;
          this.isRanting = state.isRanting;
          this.currentMood = state.currentMood;
          this.engagementHistory = state.engagementHistory;
          this.recentTweets = new Set(state.recentTweets || []);
          console.log('State loaded successfully');
        } else {
          console.log('Stored state too old, starting fresh');
        }
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  public stop(): void {
    console.log('Stopping tweet runner...');
    this.isRunning = false;
    this.saveState();
    console.log('Bot stopped gracefully');
  }
}