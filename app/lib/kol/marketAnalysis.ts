// app/lib/kol/marketAnalysis.ts

import { openai } from '../openai.js';
import { supabase } from '../supabase.js';
import { TwitterService } from '../twitter.js';

interface MarketData {
  price: number;
  volume: number;
  sentiment: number;
  socialVolume: number;
  timestamp: number;
}

interface TradeSignal {
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  timestamp: number;
}

export class MarketAnalyzer {
  private historicalData: MarketData[] = [];
  private readonly ANALYSIS_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
  private twitter: TwitterService;

  constructor() {
    this.twitter = new TwitterService(
      process.env.TWITTER_API_KEY!,
      process.env.TWITTER_API_SECRET!,
      process.env.TWITTER_ACCESS_TOKEN!,
      process.env.TWITTER_ACCESS_TOKEN_SECRET!
    );
    this.initializeAnalyzer();
  }

  private async initializeAnalyzer() {
    // Load historical data from database
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(288); // Last 24 hours at 5-minute intervals

    if (data && !error) {
      this.historicalData = data;
    }
  }

  public async analyze(): Promise<MarketData> {
    // Fetch current market data
    const currentData = await this.fetchMarketData();
    
    // Store in historical data
    this.historicalData.push(currentData);
    this.historicalData = this.historicalData
      .filter(d => d.timestamp > Date.now() - this.MEMORY_WINDOW);

    // Store in database
    await supabase
      .from('market_data')
      .insert([currentData]);

    return currentData;
  }

  public async getTradeSignals(): Promise<TradeSignal[]> {
    const recentData = this.historicalData.slice(-12); // Last hour
    
    // Analyze patterns using GPT-4
    const analysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Analyze the following market data and provide trading signals:
            ${JSON.stringify(recentData)}
            
            Consider:
            1. Price trends
            2. Volume patterns
            3. Social sentiment
            4. Memetic factors
            
            Provide signals in JSON format with type, confidence, and reason.`
        }
      ],
      temperature: 0.7
    });

    try {
      const signals = JSON.parse(analysis.choices[0].message?.content || '[]');
      return signals;
    } catch (error) {
      console.error('Error parsing trade signals:', error);
      return [];
    }
  }

  public async getCurrentContext(): Promise<any> {
    const memeticTrends = await this.analyzeMemeticTrends();
    
    return {
        price: this.historicalData[this.historicalData.length - 1]?.price,
        priceChange24h: this.calculatePriceChange(),
        sentiment: await this.analyzeSentiment(),
        volume: this.calculateVolume(),
        patterns: await this.identifyPatterns(),
        memetic: memeticTrends,
        marketPhase: this.determineMarketPhase()
    };
}

  private async fetchMarketData(): Promise<MarketData> {
    try {
      // Fetch price data from Jupiter/Birdeye API
      const response = await fetch(`https://public-api.birdeye.so/public/price?address=9kG8CWxdNeZzg8PLHTaFYmH6ihD1JMegRE1y6G8Dpump`);
      const priceData = await response.json();

      // Fetch social data from Twitter
      const twitterService = new TwitterService(
        process.env.TWITTER_API_KEY!,
        process.env.TWITTER_API_SECRET!,
        process.env.TWITTER_ACCESS_TOKEN!,
        process.env.TWITTER_ACCESS_TOKEN_SECRET!
      );

      const timeline = await twitterService.getUserTimeline();
      const socialVolume = timeline.tweets.length;

      // Calculate sentiment from recent tweets
      const recentTweets = timeline.tweets.slice(0, 10).map(t => t.text).join(' ');
      const sentimentAnalysis = await this.analyzeSentimentFromText(recentTweets);

      return {
        price: priceData.value || 0,
        volume: priceData.volume24h || 0,
        sentiment: sentimentAnalysis,
        socialVolume: socialVolume,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {
        price: 0,
        volume: 0,
        sentiment: 0,
        socialVolume: 0,
        timestamp: Date.now()
      };
    }
  }

  private calculatePriceChange(): number {
    if (this.historicalData.length < 2) return 0;

    const latest = this.historicalData[this.historicalData.length - 1];
    const twentyFourHoursAgo = this.historicalData.find(
      data => data.timestamp < Date.now() - 24 * 60 * 60 * 1000
    );

    if (!twentyFourHoursAgo) return 0;

    return ((latest.price - twentyFourHoursAgo.price) / twentyFourHoursAgo.price) * 100;
  }

  private async analyzeSentiment(): Promise<number> {
    try {
      const recentData = this.historicalData.slice(-12); // Last hour of data
      const sentimentAnalysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `Analyze this market data and return a sentiment score between 0 and 1:
            ${JSON.stringify(recentData)}
            Consider: price movement, volume changes, and social activity.
            Return only the number.`
        }]
      });

      const sentiment = parseFloat(sentimentAnalysis.choices[0].message?.content || "0.5");
      return isNaN(sentiment) ? 0.5 : sentiment;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 0.5;
    }
  }

  private calculateVolume(): number {
    if (this.historicalData.length === 0) return 0;
    return this.historicalData[this.historicalData.length - 1].volume;
  }

  private async identifyPatterns(): Promise<string[]> {
    try {
      const recentData = this.historicalData.slice(-24); // Last 2 hours
      
      const patternAnalysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `Analyze this market data and identify any technical or social patterns:
            ${JSON.stringify(recentData)}
            Consider: price patterns, volume patterns, sentiment shifts, and social trends.
            Return an array of pattern names in JSON format.`
        }]
      });

      return JSON.parse(patternAnalysis.choices[0].message?.content || "[]");
    } catch (error) {
      console.error('Error identifying patterns:', error);
      return [];
    }
  }

  private async analyzeMemeticTrends(): Promise<{
    trending: string[];
    strength: number;
    narratives: string[];
}> {
    try {
        const recentMentions = await this.twitter.search('@goatse_solana OR @truth_terminal');
        const conversations = recentMentions.slice(0, 50).map((t: { text: string }) => t.text).join('\n');

        const analysis = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: `Analyze these recent conversations for memetic patterns and narratives:
                    ${conversations}
                    
                    Identify:
                    1. Key recurring themes
                    2. Narrative strength (0-1)
                    3. Emerging thought patterns
                    
                    Return as JSON with trending[], strength, narratives[]`
            }],
            temperature: 0.7
        });

        return JSON.parse(analysis.choices[0].message?.content || '{"trending":[],"strength":0,"narratives":[]}');
    } catch (error) {
        console.error('Error analyzing memetic trends:', error);
        return {
            trending: [],
            strength: 0,
            narratives: []
        };
    }
}

  private async analyzeSentimentFromText(text: string): Promise<number> {
    try {
      const analysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `Analyze the sentiment of this text and return a score between 0 and 1:
            "${text}"
            Return only the number.`
        }]
      });

      const sentiment = parseFloat(analysis.choices[0].message?.content || "0.5");
      return isNaN(sentiment) ? 0.5 : sentiment;
    } catch (error) {
      console.error('Error analyzing text sentiment:', error);
      return 0.5;
    }
  }

  private determineMarketPhase(): string {
    // Analyze recent price and volume patterns to determine market phase
    const recentData = this.historicalData.slice(-24); // Last 2 hours
    if (recentData.length < 2) return 'unknown';

    const priceChanges = recentData.map((d, i) => 
        i > 0 ? (d.price - recentData[i-1].price) / recentData[i-1].price : 0
    ).slice(1);

    const volumeChanges = recentData.map((d, i) =>
        i > 0 ? (d.volume - recentData[i-1].volume) / recentData[i-1].volume : 0
    ).slice(1);

    // Determine market phase based on price and volume patterns
    const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const avgVolumeChange = volumeChanges.reduce((a, b) => a + b, 0) / volumeChanges.length;

    if (avgPriceChange > 0.05 && avgVolumeChange > 0.1) return 'expansion';
    if (avgPriceChange < -0.05 && avgVolumeChange > 0.1) return 'distribution';
    if (avgPriceChange < -0.03 && avgVolumeChange < -0.05) return 'contraction';
    if (Math.abs(avgPriceChange) < 0.02 && Math.abs(avgVolumeChange) < 0.05) return 'accumulation';
    
    return 'transition';
}
}