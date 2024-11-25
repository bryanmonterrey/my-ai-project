export interface Database {
    public: {
      Tables: {
        memories: {
          Row: {
            id: number;
            content: string;
            embedding: number[];
            created_at: string;
            metadata: Record<string, any>;
          };
          Insert: {
            content: string;
            embedding: number[];
            created_at?: string;
            metadata?: Record<string, any>;
          };
          Update: {
            content?: string;
            embedding?: number[];
            created_at?: string;
            metadata?: Record<string, any>;
          };
        };
      };
      Functions: {
        match_memories: {
          Args: {
            query_embedding: number[];
            match_count: number;
          };
          Returns: Array<{
            id: number;
            content: string;
            similarity: number;
          }>;
        };
      };
    };
  }