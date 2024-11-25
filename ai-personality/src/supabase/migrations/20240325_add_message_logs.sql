-- src/supabase/migrations/20240325_add_message_logs.sql

create type message_sender as enum ('user', 'ai');
create type emotional_state as enum ('neutral', 'excited', 'contemplative', 'chaotic', 'creative', 'analytical');
create type platform_type as enum ('chat', 'twitter', 'telegram', 'internal');

create table if not exists message_logs (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  sender message_sender not null,
  emotional_state emotional_state,
  platform platform_type not null default 'chat',
  token_count integer,
  model_used text,
  response_time float,
  prompt_tokens integer,
  completion_tokens integer,
  narrative_mode text,
  training_quality float check (training_quality >= 0 and training_quality <= 1),
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add indexes for common queries
create index message_logs_training_quality_idx on message_logs(training_quality);
create index message_logs_platform_idx on message_logs(platform);
create index message_logs_emotional_state_idx on message_logs(emotional_state);

-- Add RLS policies
alter table message_logs enable row level security;

create policy "Enable read access for authenticated users" on message_logs
  for select using (auth.role() = 'authenticated');
  
create policy "Enable insert for authenticated users" on message_logs
  for insert with check (auth.role() = 'authenticated');