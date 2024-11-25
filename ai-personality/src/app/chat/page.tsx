// src/app/chat/page.tsx 

'use client';

import React from 'react';
import Chat from '@/app/components/personality/Chat';
import { Card } from '@/app/components/common/Card';
import { EmotionalStateDisplay } from '@/app/components/personality/EmotionalStateDisplay';
import { PersonalityMonitor } from '@/app/components/personality/PersonalityMonitor';
import { MemoryViewer } from '@/app/components/personality/MemoryViewer';

export default function ChatPage() {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-6 h-[calc(100vh-30rem)]">
      <div className="flex flex-col">
        <Card variant="system" className="mb-4">
          <div className="text-xs space-y-1">
            <div>protocol: DIRECT_INTERFACE</div>
            <div>connection_status: ACTIVE</div>
            <div>system: ONLINE</div>
          </div>
        </Card>
        
        <div className="flex-1 min-h-0">
          <Chat />
        </div>
      </div>
      
      <div className="space-y-4">
        <EmotionalStateDisplay
          state="neutral"
          intensity={0.5}
          narrativeMode="default"
          traits={{}}
        />
        
        <PersonalityMonitor
          traits={{}}
          tweetStyle="metacommentary"
          activeThemes={[]}
        />
        
        <MemoryViewer
          memories={[]}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}