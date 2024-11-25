// scripts/verifySetup.ts
import { config } from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { resolve } from 'path';

async function verifySetup() {
  console.log('Verifying setup...\n');

  // Load environment variables
  const envResult = config({
    path: resolve(process.cwd(), '.env')
  });

  console.log('Environment variables loaded:', envResult.error ? '❌' : '✅');
  
  // Check Twitter credentials
  const twitterCreds = {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  };

  console.log('\nTwitter Credentials:');
  Object.entries(twitterCreds).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅ Present' : '❌ Missing'}`);
  });

  // Try to initialize Twitter client
  try {
    const client = new TwitterApi({
      appKey: twitterCreds.apiKey!,
      appSecret: twitterCreds.apiSecret!,
      accessToken: twitterCreds.accessToken!,
      accessSecret: twitterCreds.accessSecret!,
    });

    // Test API access
    const user = await client.v2.me();
    console.log('\nTwitter API test:', '✅ Success');
    console.log('Connected as:', user.data.username);
  } catch (error) {
    console.log('\nTwitter API test:', '❌ Failed');
    console.error('Error:', error);
  }
}

verifySetup().catch(console.error);