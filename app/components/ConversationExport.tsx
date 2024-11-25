'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.js";
import { Button } from "@/components/ui/button.js";
import { Download, Share } from 'lucide-react';
import { useToast } from "@/hooks/use-toast.js";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

interface ConversationExportProps {
  messages: Message[];
}

export function ConversationExport({ messages }: ConversationExportProps) {
  const { toast } = useToast();

  const exportMarkdown = () => {
    const markdown = messages.map(msg => {
      const role = msg.role === 'user' ? '**User**' : `**Assistant** (${msg.model})`;
      return `${role}:\n${msg.content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareConversation = async () => {
    try {
      const markdown = messages.map(msg => {
        const role = msg.role === 'user' ? '**User**' : `**Assistant** (${msg.model})`;
        return `${role}:\n${msg.content}\n`;
      }).join('\n---\n\n');

      await navigator.clipboard.writeText(markdown);
      toast({
        title: "Success",
        description: "Conversation has been copied to your clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportMarkdown}>
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareConversation}>
          <Share className="h-4 w-4 mr-2" />
          Share (Copy to Clipboard)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}