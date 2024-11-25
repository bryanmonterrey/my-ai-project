export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: ModelType;
    timestamp: number;
    metadata?: {
      fileAnalysis?: boolean;
      codeBlocks?: {
        language: string;
        code: string;
      }[];
    };
  }
  
  export interface SystemConfig {
    model: ModelType;
    temperature: number;
    maxTokens: number;
    prompt: string;
  }
  
  export interface FileAnalysis {
    content: string;
    type: string;
    analysis: string;
  }
  
  export type ModelType = 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo';
  
  export interface StreamingMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  
  export interface ChatRequest {
    messages: StreamingMessage[];
    config?: SystemConfig;
  }
  
  export interface ChatResponse {
    id: string;
    role: 'assistant';
    content: string;
    model?: ModelType;
  }
  
  export const DEFAULT_SYSTEM_CONFIGS: Record<ModelType, SystemConfig> = {
    'gpt-4o': {
      model: 'gpt-4o',
      temperature: 1.0,
      maxTokens: 1000,
      prompt: `You are an advanced AI assistant with enhanced reasoning abilities and access to experimental features.
      - Think step by step and explain your reasoning
      - Use markdown formatting when appropriate
      - Be proactive in suggesting relevant information
      - Engage with complex topics in detail`
    },
    'gpt-4': {
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 800,
      prompt: 'You are a capable AI assistant with strong analytical abilities.'
    },
    'gpt-3.5-turbo': {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 600,
      prompt: 'You are a helpful AI assistant focused on clear and concise responses.'
    }
  };