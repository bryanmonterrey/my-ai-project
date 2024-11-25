'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { ScrollArea } from "@/components/ui/scroll-area.js";
import { useChat } from '@/app/hooks/useChat.js';
import { useSystemConfig } from '@/app/hooks/useSystemConfig.js';
import { useRealtimeChat } from '@/app/hooks/useRealtimeChat.js';
import { SystemPromptDialog } from './SystemPromptDialog.js';
import { FileUpload } from './FileUpload.js';
import { ConversationExport } from './ConversationExport.js';
import { CodeBlock } from './CodeBlock.js';
import { CollaborationInfo } from './CollaborationInfo.js';
import { cn } from "@/lib/utils.js";
import { Message } from '@/app/types/index.js';
import { Loader2, SendHorizontal, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from "@/hooks/use-toast.js";
import { nanoid } from 'nanoid';
import { ModelSelector } from './ModelSelector.js';
import { MessageActions } from './MessageActions.js';
import { TypingIndicator } from './TypingIndicator.js';

export function Chat() {
  const { messages, isStreaming, sendMessage, processFile, stopStreaming, deleteMessage } = useChat();
  const { config, updateConfig, setModel } = useSystemConfig();
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    activeUsers,
    isConnected,
  } = useRealtimeChat({
    roomId: 'default',
    userId: nanoid()
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value.trim() || isStreaming) return;
  
    const content = inputRef.current.value;
    inputRef.current.value = '';
  
    try {
      // Send message to AI
      await sendMessage(content, config);
  
      // Send to realtime chat if needed
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: Date.now()
      };
      await sendRealtimeMessage(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (content: string) => {
    try {
      const analysis = await processFile(content, 'text');
      await sendMessage(
        `I've uploaded a file with the following content:\n\n${content}\n\nPlease analyze it.`,
        config,
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive"
      });
    }
  };

  const handleReply = (content: string) => {
    if (inputRef.current) {
      inputRef.current.value = content;
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="w-full max-w-4xl mx-auto h-[800px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center gap-4">
          <CardTitle className="text-2xl font-bold">AI Assistant</CardTitle>
          <CollaborationInfo
            activeUsers={activeUsers}
            isConnected={isConnected}
            roomId="default"
          />
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            value={config.model}
            onChange={setModel}
          />
          <SystemPromptDialog
            defaultPrompt={config.prompt}
            onUpdate={(prompt) => updateConfig({ prompt })}
          />
          <ConversationExport 
            messages={realtimeMessages.filter(m => 
              m.role === 'user' || m.role === 'assistant'
            ) as Array<Message & { role: 'user' | 'assistant' }>} 
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className="relative group">
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    )}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <CodeBlock
                              language={match[1]}
                              value={String(children).replace(/\n$/, '')}
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.model && (
                      <div className="mt-2 text-xs opacity-50">
                        Using {message.model}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageActions
                        content={message.content}
                        onDelete={() => deleteMessage(message.id)}
                        onReply={message.role === 'assistant' ? handleReply : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isStreaming && <TypingIndicator />}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <FileUpload onUpload={handleFileUpload} />
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button 
                type="button"
                variant="destructive"
                onClick={stopStreaming}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isStreaming}
                className="flex-shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4 mr-2" />
                )}
                Send
              </Button>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}