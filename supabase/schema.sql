-- Microfyxd Supabase Schema
-- Run this in your Supabase SQL Editor

-- ─── goals ────────────────────────────────────────────────────────────────
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  status      text not null default 'active',
  created_at  timestamp with time zone default now()
);

-- ─── tasks ────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid references goals(id) on delete cascade,
  text        text not null,
  priority    int default 1,
  status      text not null default 'pending',
  created_at  timestamp with time zone default now()
);

-- ─── ecu_logs ────────────────────────────────────────────────────────────
create table if not exists ecu_logs (
  id          uuid primary key default gen_random_uuid(),
  rpm         int,
  coolant     int,
  throttle    int,
  dtc         jsonb,
  created_at  timestamp with time zone default now()
);

-- ─── agent_state ─────────────────────────────────────────────────────────
create table if not exists agent_state (
  id          uuid primary key default gen_random_uuid(),
  loop_step   text,
  summary     text,
  created_at  timestamp with time zone default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
create index if not exists idx_goals_status on goals(status);
create index if not exists idx_tasks_goal_id on tasks(goal_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_ecu_logs_created on ecu_logs(created_at desc);
create index if not exists idx_agent_state_created on agent_state(created_at desc);

-- ─── RLS Policies (service role bypasses RLS, but for future API key use) ──
alter table goals enable row level security;
alter table tasks enable row level security;
alter table ecu_logs enable row level security;
alter table agent_state enable row level security;

-- Allow service role full access (already bypassed, but explicit for anon if needed)
create policy "Allow all for service role" on goals for all using (true) with check (true);
create policy "Allow all for service role" on tasks for all using (true) with check (true);
create policy "Allow all for service role" on ecu_logs for all using (true) with check (true);
create policy "Allow all for service role" on agent_state for all using (true) with check (true);
