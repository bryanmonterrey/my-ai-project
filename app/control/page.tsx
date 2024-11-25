// app/control/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Switch } from "@/components/ui/switch.js";
import { toast } from "@/hooks/use-toast.js";
import { TwitterStatusMonitor } from './_components/TwitterStatusMonitor.js';

export default function BotControl() {
  const [botStatus, setBotStatus] = useState<'running' | 'paused'>('running');
  const [currentMood, setCurrentMood] = useState('neutral');
  const [tweetType, setTweetType] = useState('single');
  const [tweetContent, setTweetContent] = useState('');
  const [tweetCount, setTweetCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const moods = [
    'neutral',
    'excited',
    'contemplative',
    'chaotic',
    'visionary',
    'analytical'
  ];

  const updateBotControl = async (config: any) => {
    try {
      const response = await fetch('/api/bot-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to update bot control');

      toast({
        title: "Success",
        description: "Bot control updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bot control",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Goatse Singularity Bot Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bot Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Bot Status</h3>
            <div className="flex items-center gap-2">
              <Switch
                checked={botStatus === 'running'}
                onCheckedChange={(checked) => {
                  setBotStatus(checked ? 'running' : 'paused');
                  updateBotControl({
                    command: checked ? 'resume' : 'pause'
                  });
                }}
              />
              <span>{botStatus === 'running' ? 'Running' : 'Paused'}</span>
            </div>
          </div>

          {/* Mood Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Mood</label>
            <Select
              value={currentMood}
              onValueChange={(value) => {
                setCurrentMood(value);
                updateBotControl({
                  command: 'mood',
                  moodOverride: value
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tweet Controls */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tweet Type</label>
              <Select
                value={tweetType}
                onValueChange={setTweetType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Tweet</SelectItem>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="rant">Rant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tweetType === 'single' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tweet Content</label>
                <Input
                  value={tweetContent}
                  onChange={(e) => setTweetContent(e.target.value)}
                  placeholder="Enter tweet content..."
                />
              </div>
            )}

            {(tweetType === 'thread' || tweetType === 'rant') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Tweets</label>
                <Select
                  value={tweetCount.toString()}
                  onValueChange={(value) => setTweetCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2,3,4,5,6,7,8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} tweets
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                await updateBotControl({
                  command: 'run',
                  manualTweet: {
                    enabled: true,
                    content: tweetType === 'single' ? tweetContent : null,
                    type: tweetType,
                    tweetCount: tweetCount,
                    processed: false
                  }
                });
                setIsLoading(false);
              }}
            >
              {isLoading ? 'Sending...' : 'Send Tweet'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="max-w-2xl mx-auto">
          <TwitterStatusMonitor />
    </div>
    </div>
  );
}