// app/api/twitter/status/route.ts
import { NextResponse } from 'next/server.js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface OAuthParameters {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_token: string;
  oauth_version: string;
}

function generateAuthHeader(method: string, url: string, params: OAuthParameters, consumerSecret: string, tokenSecret: string): string {
  // Sort parameters alphabetically
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // Create parameter string
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString)
  ].join('&');

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  // Create authorization header
  return 'OAuth ' + [
    ...Object.entries(sortedParams),
    ['oauth_signature', signature]
  ]
    .map(([key, value]) => `${key}="${encodeURIComponent(value as string)}"`)
    .join(', ');
}

async function verifyCredentials(): Promise<any> {
  const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(32).toString('base64');

  const oauthParams: OAuthParameters = {
    oauth_consumer_key: process.env.TWITTER_API_KEY!,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: process.env.TWITTER_ACCESS_TOKEN!,
    oauth_version: '1.0'
  };

  const authHeader = generateAuthHeader(
    'GET',
    url,
    oauthParams,
    process.env.TWITTER_API_SECRET!,
    process.env.TWITTER_ACCESS_TOKEN_SECRET!
  );

  const response = await fetch(url, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Credential verification failed:', error);
    throw new Error(`Authentication failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
  }

  return await response.json();
}

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };

  try {
    // Check for required environment variables
    const requiredEnvVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_TOKEN_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      return NextResponse.json({
        rateLimits: [{
          endpoint: 'API',
          remaining: 180,
          limit: 200,
          resetTime: new Date(Date.now() + 3600000) // 1 hour from now
        }],
        status: 'unconfigured',
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date().toISOString(),
        credentials: {
          apiKey: !!process.env.TWITTER_API_KEY,
          apiSecret: !!process.env.TWITTER_API_SECRET,
          accessToken: !!process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET
        }
      }, { headers });
    }

    // Verify credentials
    console.log('Verifying Twitter credentials...');
    const userInfo = await verifyCredentials();
    console.log('Credentials verified:', userInfo.screen_name);

    // Return successful response
    return NextResponse.json({
      rateLimits: [{
        endpoint: 'API',
        remaining: 180,
        limit: 200,
        resetTime: new Date(Date.now() + 3600000) // 1 hour from now
      }],
      status: 'connected',
      user: {
        id: userInfo.id_str,
        username: userInfo.screen_name,
        name: userInfo.name
      },
      timestamp: new Date().toISOString()
    }, { headers });

  } catch (error: any) {
    console.error('Error in status endpoint:', error);
    
    return NextResponse.json({
      rateLimits: [{
        endpoint: 'API',
        remaining: 180,
        limit: 200,
        resetTime: new Date(Date.now() + 3600000)
      }],
      status: 'error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      credentials: {
        apiKey: !!process.env.TWITTER_API_KEY,
        apiSecret: !!process.env.TWITTER_API_SECRET,
        accessToken: !!process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: !!process.env.TWITTER_ACCESS_TOKEN_SECRET
      }
    }, { headers });
  }
}