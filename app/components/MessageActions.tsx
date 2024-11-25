// app/components/MessageActions.tsx
'use client';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.js";
import { Button } from "@/components/ui/button.js";
import { MoreHorizontal, Copy, Trash, Reply } from 'lucide-react';
import { toast } from "@/hooks/use-toast.js";

interface MessageActionsProps {
  content: string;
  onDelete: () => void;
  onReply?: (content: string) => void;
}

export function MessageActions({ content, onDelete, onReply }: MessageActionsProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DropdownMenuItem>
        {onReply && (
          <DropdownMenuItem onClick={() => onReply(content)}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}