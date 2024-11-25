-- Enable necessary extensions
create extension if not exists "vector" with schema public;

-- Memories table
create table if not exists "memories" (
  "id" uuid primary key default gen_random_uuid(),
  "content" text not null,
  "type" text not null,
  "emotional_context" text,
  "importance" float not null default 0.5,
  "associations" text[],
  "embedding" vector(1536),
  "platform" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "last_accessed" timestamp with time zone default timezone('utc'::text, now())
);

-- Interactions table
create table if not exists "interactions" (
  "id" uuid primary key default gen_random_uuid(),
  "content" text not null,
  "platform" text not null,
  "participant" text,
  "emotional_response" jsonb,
  "importance" float not null default 0.5,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Personality states table
create table if not exists "personality_states" (
  "id" uuid primary key default gen_random_uuid(),
  "emotional_state" text not null,
  "emotional_intensity" float not null,
  "current_context" jsonb,
  "active_narratives" text[],
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tweet patterns table
create table if not exists "tweet_patterns" (
  "id" uuid primary key default gen_random_uuid(),
  "style" text not null,
  "pattern" text not null,
  "themes" text[],
  "intensity_range" float[2],
  "contextual_triggers" text[],
  "emotional_states" text[],
  "success_rate" float default 0.5,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists memories_embedding_idx on memories using ivfflat (embedding vector_cosine_ops);
create index if not exists memories_type_idx on memories(type);
create index if not exists interactions_platform_idx on interactions(platform);
create index if not exists personality_states_created_at_idx on personality_states(created_at);

-- Functions
create or replace function match_memories(query_embedding vector, match_threshold float, match_count int)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from memories
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;