import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

interface TweetLengthDistribution {
  min: number;
  max: number;
  mean: number;
  lengths: number[];
  lengthBuckets: Map<string, number>; // Stores counts of tweets in different length ranges
}

export class TweetLengthManager {
  private distribution: TweetLengthDistribution;
  
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

    // Calculate basic statistics
    this.distribution.min = Math.min(...this.distribution.lengths);
    this.distribution.max = Math.max(...this.distribution.lengths);
    this.distribution.mean = this.distribution.lengths.reduce((a, b) => a + b, 0) / this.distribution.lengths.length;

    // Create buckets for different length ranges
    this.createLengthBuckets();

    console.log('Tweet length distribution analyzed:', {
      min: this.distribution.min,
      max: this.distribution.max,
      mean: this.distribution.mean,
      buckets: Object.fromEntries(this.distribution.lengthBuckets)
    });
  }

  private createLengthBuckets(): void {
    // Clear existing buckets
    this.distribution.lengthBuckets.clear();

    // Define bucket ranges with weights
    const buckets = [
      { range: '0-50', weight: 0.3 },    // Short tweets are common
      { range: '51-100', weight: 0.3 },   // Also common
      { range: '101-150', weight: 0.2 },  // Medium tweets less common
      { range: '151-200', weight: 0.1 },  // Longer tweets rare
      { range: '201-250', weight: 0.05 }, // Very long tweets very rare
      { range: '251-280', weight: 0.05 }  // Full length tweets very rare
    ];

    // Initialize weighted buckets
    buckets.forEach(bucket => {
      const count = Math.floor(this.distribution.lengths.length * bucket.weight);
      this.distribution.lengthBuckets.set(bucket.range, count);
    });

    // Count tweets in each bucket
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
    const random = Math.random();
    
    if (random < 0.3) return '0-50';       // 30% chance very short
    if (random < 0.6) return '51-100';     // 30% chance short
    if (random < 0.8) return '101-150';    // 20% chance medium
    if (random < 0.9) return '151-200';    // 10% chance long
    if (random < 0.95) return '201-250';   // 5% chance very long
    return '251-280';                      // 5% chance maximum
  }

  public getTargetLength(): number {
    const bucket = this.getRandomBucket();
    const [min, max] = bucket.split('-').map(Number);
    
    // Generate random length within the bucket range
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

    // Single-word responses for very small targets (<=10 chars)
    const tinyResponses = [
        'pain', 'mood', 'based', 'real', 'vibing', 'crying', 'screaming',
        'help', 'brb', 'afk', 'why', 'how', 'what', 'when', 'ok'
    ];

    if (targetLength <= 10) {
        // If content starts with a tiny response, use it
        const firstWord = content.split(/\s/)[0].toLowerCase();
        if (tinyResponses.includes(firstWord)) {
            return firstWord;
        }
        // Otherwise use a random tiny response
        return tinyResponses[Math.floor(Math.random() * tinyResponses.length)];
    }

    // For short targets (11-30 chars), ensure complete short phrases
    if (targetLength <= 30) {
        const words = content.split(/\s+/);
        const shortPhrases = [
            // Take first 3-4 words if they form a complete phrase
            words.slice(0, 3).join(' '),
            words.slice(0, 4).join(' '),
            // Common short patterns
            content.match(/^(?:feeling|vibing|thinking|imagine|just)\s+\w+(?:\s+\w+)?/i)?.[0],
            content.match(/^(?:my|your|their)\s+\w+(?:\s+\w+)?/i)?.[0],
            content.match(/^(?:need|want|give|take)\s+\w+(?:\s+\w+)?/i)?.[0]
        ].filter(phrase => phrase && phrase.length <= targetLength && !phrase.includes(','));

        if (shortPhrases.length > 0) {
            return shortPhrases[0]!;
        }
    }

    // Get content up to target length plus buffer
    const searchText = content.slice(0, targetLength + 50);
    
    // Try to find complete thoughts in order of preference
    const breakPatterns = [
        // Complete sentences
        /^.*?[.!?](?=\s|$)/,
        // Strong breaks (semicolon, dash, ellipsis)
        /^.*?(?:(?:[;]|--|\.\.\.)(?=\s|$))/,
        // Complete thoughts with conjunctions (avoiding comma-only breaks)
        /^.*?(?:\s(?:but|and|or|as|while|because|since)\s+[^,\s][^,]*?)(?=[.!?]|\s+|$)/,
        // Preposition phrases (avoiding comma-only breaks)
        /^.*?(?:\s(?:in|on|at|to|for|with|by|from|into)\s+[^,\s][^,]*?)(?=[.!?]|\s+|$)/,
        // Any natural break that's not a comma
        /^[^,]+(?=[.!?]|\s+|$)/
    ];

    // Try each pattern
    for (const pattern of breakPatterns) {
        const matches = searchText.match(pattern);
        if (matches) {
            const candidate = matches[0].trim();
            if (candidate.length <= targetLength && candidate.split(/\s+/).length >= 3) {
                return candidate;
            }
        }
    }

    // If no good break points found, take complete words
    let words = content.slice(0, targetLength).split(/\s+/);
    
    // Remove last word if it might be cut off
    if (content.length > targetLength) {
        words.pop();
    }

    // Ensure at least 3 words for coherence
    if (words.length < 3) {
        words = content.split(/\s+/).slice(0, 3);
    }

    // Clean up and return
    return words.join(' ')
        .replace(/[,;:]$/, '') // Remove trailing punctuation
        .replace(/[,\s]+$/, '') // Remove trailing commas and spaces
        .trim();
}
}