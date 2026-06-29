import 'server-only';
import fs from 'node:fs';
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

const DATA_DIR = path.join(process.cwd(), '.data');
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
