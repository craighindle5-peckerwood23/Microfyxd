import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Patch global WebSocket for Node 20 (Supabase realtime needs this)
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ─── Local fallback database ──────────────────────────────────────────────
// Mirrors the Supabase query-builder API against a JSON file so the runtime
// stays fully functional when Supabase credentials are absent. When SUPABASE_URL
// and SUPABASE_SERVICE_ROLE_KEY are set, the real Supabase client is used instead.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

class LocalQuery {
  constructor(table) {
    this.table = table;
    this.rows = null;
    this.patch = null;
  }
  select() {
    if (this.rows) return this; // chained after insert/update
    const db = loadDb();
    this.rows = [...(db[this.table] || [])];
    return this;
  }
  order(col, opts = {}) {
    const asc = opts.ascending !== false ? 1 : -1;
    this.rows.sort((a, b) => (a[col] > b[col] ? asc : -asc));
    return this;
  }
  limit(n) {
    if (this.rows) this.rows = this.rows.slice(0, n);
    return this;
  }
  insert(payload) {
    const db = loadDb();
    const arr = Array.isArray(payload) ? payload : [payload];
    const now = new Date().toISOString();
    const created = arr.map((p) => ({ id: uid(), created_at: now, ...p }));
    db[this.table] = [...(db[this.table] || []), ...created];
    saveDb(db);
    this.rows = created;
    return this;
  }
  update(patch) {
    this.patch = patch;
    return this;
  }
  eq(col, val) {
    const db = loadDb();
    const now = new Date().toISOString();
    const rows = (db[this.table] || []).map((r) =>
      r[col] === val ? { ...r, ...this.patch, updated_at: now } : r
    );
    db[this.table] = rows;
    saveDb(db);
    this.rows = rows.filter((r) => r[col] === val);
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve({ data: this.rows, error: null }).then(resolve, reject);
  }
}

class LocalClient {
  from(table) {
    return new LocalQuery(table);
  }
}

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : new LocalClient();

export const isSupabaseConfigured = () => Boolean(url && key);
