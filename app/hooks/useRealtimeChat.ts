'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import { supabase } from '@/app/lib/supabase.js';
import { Message } from '@/app/types/index.js';
import { nanoid } from 'nanoid';

interface RealtimeChatOptions {
  roomId?: string;
  userId?: string;
}

export function useRealtimeChat({ roomId = 'default', userId = nanoid() }: RealtimeChatOptions = {}) {
  const [messages, setMessages] = useLocalStorage<Message[]>(`chat-messages-${roomId}`, []);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize realtime presence
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = new Set(Object.keys(state));
      setActiveUsers(users);
    });

    // Handle new messages
    channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      if (payload.userId !== userId) { // Don't double-add our own messages
        setMessages(prev => [...prev, payload.message]);
      }
    });

    // Subscribe to the channel
    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, online_at: new Date().toISOString() });
          setIsConnected(true);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, userId]);

  // Function to send a message
  const sendMessage = async (newMessage: Message) => {
    try {
      // Add message locally
      setMessages(prev => [...prev, newMessage]);

      // Broadcast to other users
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'message',
        payload: {
          message: newMessage,
          userId,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Function to clear messages from localStorage and notify others
  const clearMessages = async () => {
    setMessages([]);
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'clear',
      payload: {
        userId,
      },
    });
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    activeUsers: Array.from(activeUsers),
    isConnected,
    userId,
  };
}