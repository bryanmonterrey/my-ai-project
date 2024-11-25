// scripts/run.ts
import { AdvancedTweetRunner } from './advancedTweetRunner.js';
import { resolve } from 'path';
import { config } from 'dotenv';

async function main() {
  try {
    // Load environment variables
    config();
    
    console.log('Starting tweet runner...');
    const runner = new AdvancedTweetRunner();
    
    // Initialize with CSV file from data directory
    const csvPath = resolve(process.cwd(), 'data', 'exampletweets.csv');
    console.log('Loading tweets from:', csvPath);
    
    await runner.initialize(csvPath);
    
    // Start the runner
    await runner.start();
  } catch (error) {
    console.error('Error running tweet bot:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});