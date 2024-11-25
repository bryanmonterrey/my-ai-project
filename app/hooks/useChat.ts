'use client';

import { useChat as useAIChat } from 'ai/react';
import { nanoid } from 'nanoid';
import { Message, SystemConfig } from '@/app/types/index.js';
import { toast } from "@/hooks/use-toast.js";
import { useEffect } from 'react';

export function useChat() {
  const {
    messages: aiMessages,
    append,
    isLoading: isStreaming,
    stop: stopStreaming,
    setMessages: setAIMessages,
  } = useAIChat({
    api: '/api/chat/streaming',
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to send message',
        variant: "destructive",
      });
    },
    initialMessages: (() => {
      if (typeof window === 'undefined') return [];
      const saved = localStorage.getItem('chat-messages');
      return saved ? JSON.parse(saved) : [];
    })(),
  });

  // Convert AI messages to our Message type
  const messages = aiMessages.map((msg): Message => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: Date.now(),
    model: msg.role === 'assistant' ? 'gpt-4o' : undefined
  }));

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (content: string, config: SystemConfig) => {
    try {
      await append({
        content,
        role: 'user',
      }, {
        data: {
          config: JSON.parse(JSON.stringify(config))
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = (messageId: string) => {
    setAIMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const processFile = async (content: string, type: string) => {
    try {
      const response = await fetch('/api/process-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type })
      });

      if (!response.ok) throw new Error('Failed to process file');
      return await response.json();
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  return {
    messages,
    isStreaming,
    sendMessage,
    processFile,
    stopStreaming,
    deleteMessage,
  };
}