import 'server-only';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DB } from './types';
import { buildSeed } from './seed';

/**
 * Lightweight JSON-file persistence for the MVP.
 *
 * ⚠️  This is a demonstration data layer chosen because it has ZERO native
 * dependencies and runs anywhere (no DB server, no engine binaries to fetch).
 * The production schema is documented in `prisma/schema.prisma` and the app
 * is structured so this module is the ONLY place that touches storage — swap
 * it for Prisma + PostgreSQL without changing any route handler.
 */

/**
 * Resolve a writable data directory.
 *  - `ONEWAY_DATA_DIR` if set (recommended on persistent hosts).
 *  - otherwise `<cwd>/.data` (local dev).
 *  - serverless/read-only FS (e.g. Vercel) → falls back to the OS temp dir,
 *    so the demo still runs (data is reseeded per cold start; use PostgreSQL
 *    for durable production storage — see prisma/schema.prisma).
 */
function resolveDataDir(): string {
  if (process.env.ONEWAY_DATA_DIR) return process.env.ONEWAY_DATA_DIR;
  const local = path.join(process.cwd(), '.data');
  try {
    fs.mkdirSync(local, { recursive: true });
    fs.accessSync(local, fs.constants.W_OK);
    return local;
  } catch {
    return path.join(os.tmpdir(), 'oneway-data');
  }
}

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'oneway.json');

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as DB;
      return cache;
    }
  } catch {
    // Corrupt file — fall through to reseed.
  }
  cache = buildSeed();
  persist();
  return cache;
}

function persist(): void {
  if (!cache) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Read-only FS (e.g. some serverless targets): keep working in-memory.
  }
}

/** Read-only access to the database. */
export function db(): DB {
  return load();
}

/** Mutate the database inside a callback, then persist. */
export function write<T>(fn: (database: DB) => T): T {
  const database = load();
  const result = fn(database);
  persist();
  return result;
}

/** Force a fresh reseed (used by scripts/tests). */
export function resetDb(): DB {
  cache = buildSeed();
  persist();
  return cache;
}
