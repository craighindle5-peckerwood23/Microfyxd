import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Patch global WebSocket for Node 20 compat
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as Record<string, unknown>).WebSocket = WebSocket;
}

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

export const isSupabaseConfigured = () => supabase !== null;
