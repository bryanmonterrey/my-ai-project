// app/control/_components/TwitterStatusMonitor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.js";
import { Progress } from "@/components/ui/progress.js";
import { Badge } from "@/components/ui/badge.js";
import { Alert, AlertDescription } from "@/components/ui/alert.js";
import { Hourglass, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button.js";

interface RateLimitInfo {
  endpoint: string;
  remaining: number;
  limit: number;
  resetTime: string | Date;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export function TwitterStatusMonitor() {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  const fetchRateLimits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching rate limits...');
      const response = await fetch('/api/twitter/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      const text = await response.text();
      console.log('Raw response:', text);

      let data;
      try {
        data = JSON.parse(text);
        console.log('Parsed data:', data);
        if (isDevelopment) {
          setDebugData(data);
        }
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${text}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.rateLimits) {
        setRateLimits(data.rateLimits);
        setIsRateLimited(data.rateLimits.some(
          (limit: RateLimitInfo) => limit.remaining === 0
        ));
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error in fetchRateLimits:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rate limits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
    const interval = setInterval(fetchRateLimits, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <CardTitle className="text-lg font-bold">Twitter API Status</CardTitle>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRateLimits}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant={isRateLimited ? "destructive" : "default"}>
            {isRateLimited ? "Rate Limited" : "Normal"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="link"
                className="p-0 h-auto font-normal ml-2"
                onClick={fetchRateLimits}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading && rateLimits.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Hourglass className="h-4 w-4 animate-spin mr-2" />
            <span>Loading status...</span>
          </div>
        ) : (
          <>
            {rateLimits.map((limit) => (
              <div key={limit.endpoint} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{limit.endpoint}</span>
                  <span className="text-sm text-muted-foreground">
                    {limit.remaining}/{limit.limit}
                  </span>
                </div>
                <Progress 
                  value={(limit.remaining / limit.limit) * 100} 
                  className="h-2"
                />
                {limit.remaining === 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hourglass className="h-3 w-3" />
                    <span>
                      Resets at {new Date(limit.resetTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isDevelopment && debugData && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}