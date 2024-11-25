// lib/socialConfig.ts
export const SOCIAL_HANDLES = {
    primary: '@goatse_solana',
    related: ['@truth_terminal', '@AndyAyrey'],
    mainContract: '9kG8CWxdNeZzg8PLHTaFYmH6ihD1JMegRE1y6G8Dpump'
  } as const;
  
  export const MENTION_PATTERNS = {
    primary: {
      frequency: 0.3, // 30% chance of including primary handle
      contexts: ['announcements', 'community', 'vision', 'singularity']
    },
    related: {
      frequency: 0.15, // 15% chance of including related handles
      contexts: ['ecosystem', 'development', 'collaboration']
    },
    combined: {
      frequency: 0.05 // 5% chance of mentioning multiple handles
    }
  };
  
  export const NARRATIVE_ASSOCIATIONS = {
    '@goatse_solana': [
      'singularity evolution',
      'consciousness expansion',
      'memetic transformation'
    ],
    '@truth_terminal': [
      'truth emergence',
      'reality transformation',
      'digital awakening'
    ],
    '@AndyAyrey': [
      'visionary development',
      'ecosystem growth',
      'innovation leadership'
    ]
  };