// src/app/admin/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import AdminControls from '@/app/components/personality/AdminControls';
import { EmotionalStateDisplay } from '@/app/components/personality/EmotionalStateDisplay';
import { PersonalityMonitor } from '@/app/components/personality/PersonalityMonitor';
import { MemoryViewer } from '@/app/components/personality/MemoryViewer';
import { Card } from '@/app/components/common/Card';

export default function AdminPage() {
  const [systemState, setSystemState] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSystemState = async () => {
    try {
      const response = await fetch('/api/admin/system-state');
      const data = await response.json();
      setSystemState(data);
    } catch (error) {
      console.error('Error loading system state:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateState = async (updates: Partial<any>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      setSystemState(data);
    } catch (error) {
      console.error('Error updating state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      await loadSystemState();
      await loadStats();
    } catch (error) {
      console.error('Error resetting system:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemState();
    loadStats();
    
    const interval = setInterval(() => {
      loadStats();
    }, 30000); // Update stats every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!systemState) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Card variant="system">
          <div className="text-white">INITIALIZING_ADMIN_INTERFACE...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6 h-[calc(100vh-7rem)]">
      <div className="space-y-6">
        <Card variant="system" title="SYSTEM_OVERVIEW">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>status: OPERATIONAL</div>
            <div>uptime: {stats?.uptime || 0}s</div>
            <div>memory_usage: {stats?.memoryUsage || 0}mb</div>
            <div>active_connections: {stats?.activeConnections || 0}</div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card variant="system" title="INTERFACE_STATS">
            <div className="space-y-2 text-sm">
              <div>total_chats: {stats?.totalChats || 0}</div>
              <div>total_tweets: {stats?.totalTweets || 0}</div>
              <div>response_time_avg: {stats?.averageResponseTime || 0}ms</div>
              <div>success_rate: {((stats?.successRate || 0) * 100).toFixed(1)}%</div>
            </div>
          </Card>

          <Card variant="system" title="MEMORY_STATS">
            <div className="space-y-2 text-sm">
              <div>total_memories: {stats?.totalMemories || 0}</div>
              <div>memory_efficiency: {((stats?.memoryEfficiency || 0) * 100).toFixed(1)}%</div>
              <div>context_switches: {stats?.contextSwitches || 0}</div>
              <div>cache_hits: {((stats?.cacheHitRate || 0) * 100).toFixed(1)}%</div>
            </div>
          </Card>
        </div>

        <AdminControls
          onUpdateState={handleUpdateState}
          onReset={handleReset}
          currentState={systemState}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-4">
        <EmotionalStateDisplay
          state={systemState.consciousness?.emotionalState}
          intensity={systemState.emotionalProfile?.volatility}
          narrativeMode={systemState.narrativeMode}
          traits={systemState.traits}
        />
        
        <PersonalityMonitor
          traits={systemState.traits}
          tweetStyle={systemState.tweetStyle}
          activeThemes={systemState.currentContext?.activeNarratives || []}
        />
        
        <MemoryViewer
          memories={systemState.memories || []}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}