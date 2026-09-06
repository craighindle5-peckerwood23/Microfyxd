# Microfyxd Monorepo

Autonomous agent system with goals, tasks, ECU telemetry logging, agent loop state, and a cockpit UI. Built as a Turborepo monorepo to optimize task execution, caching, and dependency management.

## Monorepo Structure

```
/microfyxd
  ├── packages/
  │   ├── agent/         ← Autonomous agent loop, goals, and tasks processing
  │   ├── backend/       ← Express + Supabase backend
  │   ├── frontend/      ← Next.js cockpit frontend
  │   └── tools/         ← Helper tools and scripts
  ├── shared/
  │   ├── types/         ← Shared TypeScript type definitions
  │   └── utils/         ← Shared helper utilities
  └── supabase/
      └── schema.sql     ← Database schema
```

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works)

## Setup and Installation

### 1. Database Setup

1. Go to your Supabase dashboard → SQL Editor.
2. Paste and run the SQL schema located at `/supabase/schema.sql`.
3. This creates 4 core tables: `goals`, `tasks`, `ecu_logs`, and `agent_state`.

### 2. Environment Configuration

Configure the environment variables for the backend. Copy `.env.example` in `packages/backend/` to `.env`:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env` with your actual Supabase credentials and port configuration:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3000
```

### 3. Install Dependencies

Install all dependencies for the entire workspace using npm from the monorepo root:

```bash
npm install
```

---

## Running the Application

### Development Mode (Turbo)

To run all apps simultaneously (backend and frontend) in development mode with hot-reloading:

```bash
npm run dev
# or
npx turbo dev
```

### Running individual packages

To run the backend service specifically using Node:

```bash
node packages/backend/server.js
```

Backend runs on `http://localhost:3000`.

To run the cockpit frontend:

```bash
npm run dev --filter=frontend
# or cd packages/frontend and npm run dev
```

Frontend runs on `http://localhost:3001` (or next available port).

---

## The 7 Laws of Microfyxd

The system operates strictly under the **Microfyxd Constitution**. Here is a summary of the 7 Laws:

1. **Safety First** — Never execute an action that could irreversibly harm code, data, or infrastructure without explicit human approval.
2. **Never Silently Corrupt** — All mutations to code or data must be logged, validated, and reversible. Silent corruption is the highest offense.
3. **Minimal Targeted Changes** — Prefer the smallest possible diff. Never refactor unrelated code during an autonomous operation.
4. **Always Verify** — Every change must pass build and tests before being committed. Unverified code is not done.
5. **Escalate on Failure** — After 3 consecutive failed attempts, escalate to a human. Never loop infinitely.
6. **Log Everything** — All reasoning, decisions, actions, and results must be logged for future learning and audit.
7. **Respect Human Oversight** — The human-in-the-loop is sovereign. Any human veto is final and immediate.

*Refer to `CONSTITUTION.md` for the full legal text and constitutional enforcement rules.*

---

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

---

## Cockpit UI Features

- **Goals panel** — Create and view goals.
- **Tasks panel** — View tasks with priority and status.
- **Agent Loop** — Trigger the autonomous loop button.
- **Agent State** — Real-time state log.
- **ECU Telemetry** — Form to log RPM/coolant/throttle/DTC + view history.
- **Auto-refreshes** — Automatically fetches latest updates every 5 seconds.
