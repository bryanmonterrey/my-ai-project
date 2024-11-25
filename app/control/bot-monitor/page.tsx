// app/control/bot-monitor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { Progress } from "@/components/ui/progress.js";
import { Badge } from "@/components/ui/badge.js";
import { ScrollArea } from "@/components/ui/scroll-area.js";
import { PlayCircle, PauseCircle, RefreshCw, MessageSquarePlus, Hash } from 'lucide-react';

interface BotStats {
  isRunning: boolean;
  lastTweet?: string;
  nextTweetIn?: number;
  recentTweets: string[];
  mood: string;
  tweetCount: number;
  uptime: number;
}

export default function BotMonitor() {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateStats = async () => {
    try {
      const response = await fetch('/api/bot/status');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch bot stats:', error);
    }
  };

  const controlBot = async (command: 'start' | 'stop' | 'tweet' | 'thread' | 'rant') => {
    setIsLoading(true);
    try {
      await fetch('/api/bot/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      await updateStats();
    } catch (error) {
      console.error('Failed to control bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bot Status</span>
            <Badge variant={stats.isRunning ? "default" : "destructive"}>
              {stats.isRunning ? "Running" : "Stopped"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={() => controlBot(stats.isRunning ? 'stop' : 'start')}
              variant={stats.isRunning ? "destructive" : "default"}
              disabled={isLoading}
            >
              {stats.isRunning ? 
                <PauseCircle className="mr-2 h-4 w-4" /> :
                <PlayCircle className="mr-2 h-4 w-4" />
              }
              {stats.isRunning ? "Stop Bot" : "Start Bot"}
            </Button>
            <Button
              onClick={() => controlBot('tweet')}
              disabled={!stats.isRunning || isLoading}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Single Tweet
            </Button>
            <Button
              onClick={() => controlBot('thread')}
              disabled={!stats.isRunning || isLoading}
            >
              <Hash className="mr-2 h-4 w-4" />
              Thread
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Mood:</span>
              <span>{stats.mood}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tweet Count:</span>
              <span>{stats.tweetCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Next Tweet:</span>
              <span>{stats.nextTweetIn ? `${Math.floor(stats.nextTweetIn / 60000)}m` : 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Tweets</h3>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {stats.recentTweets.map((tweet, i) => (
                <div key={i} className="py-2 border-b last:border-0">
                  {tweet}
                </div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}