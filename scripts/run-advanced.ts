// scripts/run-advanced.ts
import { AdvancedTweetRunner } from './advancedTweetRunner.js';

async function main() {
  try {
    console.log('Starting tweet runner...');
    const runner = new AdvancedTweetRunner();
    await runner.start();
  } catch (error) {
    console.error('Error running tweet bot:', error);
    process.exit(1);
  }
}

main();