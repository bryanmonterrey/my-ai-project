'use client';

import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.js";
import { Badge } from "@/components/ui/badge.js";
import { Users } from 'lucide-react';

interface CollaborationInfoProps {
  activeUsers: string[];
  isConnected: boolean;
  roomId: string;
}

export function CollaborationInfo({ activeUsers, isConnected, roomId }: CollaborationInfoProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer" onClick={copyRoomId}>
              <Badge variant={isConnected ? "default" : "destructive"}>
                <Users className="w-4 h-4 mr-1" />
                {activeUsers.length} online
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Room ID copied!' : `Click to copy room ID: ${roomId}`}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}