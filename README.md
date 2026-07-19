# Microfyxd Monorepo

Autonomous agent system with goals, tasks, ECU telemetry logging, agent loop state, and a cockpit UI.

## Structure

```
/microfyxd
  /microfyxd-backend    ← Express + Supabase backend
  /microfyxd-site       ← Next.js cockpit frontend
  /supabase
    schema.sql          ← Database schema
```

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works)

## Setup

### 1. Database

1. Go to your Supabase dashboard → SQL Editor
2. Paste and run `/supabase/schema.sql`
3. This creates 4 tables: `goals`, `tasks`, `ecu_logs`, `agent_state`

### 2. Backend

```bash
cd microfyxd-backend
cp .env.example .env
# Edit .env with your real Supabase URL and service role key:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
npm install
node server.js
```

Backend runs on `http://localhost:3000`

### 3. Frontend

```bash
cd microfyxd-site
npm install
npm run dev
```

Frontend runs on `http://localhost:3001` (or whatever Next.js assigns)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/test | Health check |
| GET | /api/goals | List all goals |
| POST | /api/goals | Create a goal `{ text }` |
| PATCH | /api/goals/:id | Update goal status `{ status }` |
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create a task `{ goal_id, text, priority? }` |
| PATCH | /api/tasks/:id | Update task status `{ status }` |
| GET | /api/ecu | Get ECU telemetry logs |
| POST | /api/ecu | Log ECU data `{ rpm, coolant, throttle, dtc? }` |
| GET | /api/state | Get agent state entries |
| POST | /api/state | Log agent state `{ loop_step, summary }` |
| POST | /api/agent/loop | Run autonomous agent loop |

## Cockpit UI Features

- **Goals panel** — create and view goals
- **Tasks panel** — view tasks with priority and status
- **Agent Loop** — trigger the autonomous loop button
- **Agent State** — real-time state log
- **ECU Telemetry** — form to log RPM/coolant/throttle/DTC + view history
- Auto-refreshes every 5 seconds

## Environment Variables

### Backend (`microfyxd-backend/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3000
```

### Frontend
No env vars needed — API calls go to `http://localhost:3000`.

## Git Setup

```bash
cd microfyxd
git init
git add .
git commit -m "Initial Microfyxd full-stack with Supabase backend"
git branch -M main
git remote add origin https://github.com/craighindle5-peckerwood23/microfyxd.git
git push -u origin main
```
