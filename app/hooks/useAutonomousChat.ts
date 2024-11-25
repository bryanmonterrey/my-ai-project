// hooks/useAutonomousChat.ts
import { useChat } from './useChat.js';
import { useSystemConfig } from './useSystemConfig.js';
import { DEFAULT_PERSONALITY, PersonalityConfig, generatePersonalityPrompt } from '@/app/types/personality.js';
import { TwitterService } from '@/app/lib/twitter.js';
import { useCallback, useEffect, useState } from 'react';

export function useAutonomousChat(
  twitterConfig?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  }
) {
  const baseChat = useChat();
  const { config } = useSystemConfig();
  const [personality, setPersonality] = useState<PersonalityConfig>(DEFAULT_PERSONALITY);
  const [twitterService, setTwitterService] = useState<TwitterService | null>(null);

  // Initialize Twitter service if config is provided
  useEffect(() => {
    if (twitterConfig) {
      const service = new TwitterService(
        twitterConfig.apiKey,
        twitterConfig.apiSecret,
        twitterConfig.accessToken,
        twitterConfig.accessSecret
      );
      setTwitterService(service);
    }
  }, [twitterConfig]);

  // Autonomous thinking and posting
  const think = useCallback(async () => {
    if (baseChat.messages.length === 0) return;

    const recentMessages = baseChat.messages.slice(-5);
    const context = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const thoughtPrompt = generatePersonalityPrompt(personality, context);
    const response = await baseChat.sendMessage(thoughtPrompt, config);
    
    // Type the thought variable explicitly as string | null
    const thought: string | null = typeof response === 'string' ? response : null;

    // Potentially post to Twitter if thought is interesting enough
    if (
      twitterService && 
      thought && 
      Math.random() < personality.autonomyLevel
    ) {
      try {
        const tweetContent = String(thought).slice(0, 280); // Twitter length limit
        await twitterService.postTweet(tweetContent);
      } catch (error) {
        console.error('Failed to post autonomous tweet:', error);
      }
    }

    return thought;
  }, [baseChat.messages, personality, config, twitterService]);

  // Autonomous periodic thinking
  useEffect(() => {
    if (personality.autonomyLevel > 0.5) {
      const interval = setInterval(() => {
        think();
      }, 1000 * 60 * 30); // Think every 30 minutes

      return () => clearInterval(interval);
    }
  }, [personality.autonomyLevel, think]);

  return {
    ...baseChat,
    personality,
    setPersonality,
    think,
    twitterService
  };
}