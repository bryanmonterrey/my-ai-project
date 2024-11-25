-- supabase/migrations/20240325_chat_system.sql

-- Create chat-specific tables using existing enums
create table if not exists chat_sessions (
    id uuid primary key default gen_random_uuid(),
    started_at timestamp with time zone default timezone('utc'::text, now()),
    ended_at timestamp with time zone,
    platform platform_type default 'chat',
    total_messages integer default 0,
    avg_response_time float,
    avg_quality_score float,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references chat_sessions(id) on delete cascade,
    content text not null,
    role text not null check (role in ('user', 'ai')),
    emotional_state emotional_state default 'neutral',
    model_used text,
    token_count integer,
    response_time float,
    quality_score float check (quality_score >= 0 and quality_score <= 1),
    error boolean default false,
    retryable boolean default false,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add metrics tables
create table if not exists message_metrics (
    id uuid primary key default gen_random_uuid(),
    message_id uuid references chat_messages(id) on delete cascade,
    coherence float check (coherence >= 0 and coherence <= 1),
    emotional_alignment float check (emotional_alignment >= 0 and emotional_alignment <= 1),
    narrative_consistency float check (narrative_consistency >= 0 and narrative_consistency <= 1),
    response_relevance float check (response_relevance >= 0 and response_relevance <= 1),
    overall_quality float check (overall_quality >= 0 and overall_quality <= 1),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists training_data (
    id uuid primary key default gen_random_uuid(),
    message_id uuid references chat_messages(id) on delete cascade,
    prompt text not null,
    completion text not null,
    emotional_state emotional_state,
    narrative_mode narrative_mode,
    embedding vector(1536),
    quality_score float check (quality_score >= 0 and quality_score <= 1),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index chat_messages_session_id_idx on chat_messages(session_id);
create index chat_messages_embedding_idx on chat_messages using ivfflat (embedding vector_cosine_ops);
create index chat_messages_emotional_state_idx on chat_messages(emotional_state);
create index chat_messages_quality_score_idx on chat_messages(quality_score);
create index training_data_embedding_idx on training_data using ivfflat (embedding vector_cosine_ops);
create index training_data_quality_score_idx on training_data(quality_score);

-- Add session metrics function
create or replace function update_session_metrics()
returns trigger as $$
begin
    update chat_sessions
    set 
        total_messages = (
            select count(*) from chat_messages 
            where session_id = NEW.session_id
        ),
        avg_response_time = (
            select avg(response_time) 
            from chat_messages 
            where session_id = NEW.session_id
        ),
        avg_quality_score = (
            select avg(quality_score) 
            where session_id = NEW.session_id
        ),
        updated_at = timezone('utc'::text, now())
    where id = NEW.session_id;
    return NEW;
end;
$$ language plpgsql;

-- Create trigger
create trigger update_session_metrics_after_message
    after insert or update on chat_messages
    for each row
    execute function update_session_metrics();