import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'logs.json');

function filePath() {
  return process.env.LOGS_FILE || DEFAULT_PATH;
}

export function logsStorageInfo() {
  const p = filePath();
  const custom = !!process.env.LOGS_FILE;
  let exists = false;
  let size = null;
  let mtime = null;
  try {
    const s = statSync(p);
    exists = true;
    size = s.size;
    mtime = s.mtime.toISOString();
  } catch {}
  return {
    path: p,
    using_custom_path: custom,
    exists,
    size,
    mtime,
    ephemeral_warning: !custom,
  };
}

function load() {
  const p = filePath();
  if (!existsSync(p)) return { logs: [] };
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  return { logs: Array.isArray(raw.logs) ? raw.logs : [] };
}

function persist(db) {
  const p = filePath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(db, null, 2) + '\n');
}

export function listLogs() {
  const { logs } = load();
  return [...logs].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export function createLog({ userId, userName, title, description }) {
  const t = String(title || '').trim();
  const d = String(description || '').trim();
  if (!t) throw new Error('title obligatorio');
  if (!d) throw new Error('description obligatorio');
  const db = load();
  const entry = {
    id: randomUUID(),
    userId: userId || null,
    userName: userName || null,
    title: t,
    description: d,
    createdAt: new Date().toISOString(),
  };
  db.logs.push(entry);
  persist(db);

  const verify = load();
  const persisted = verify.logs.some((l) => l.id === entry.id);
  if (!persisted) {
    throw new Error(
      `Log write FAILED verification: entry ${entry.id} not found after write at ${filePath()}. Possible ephemeral filesystem.`,
    );
  }

  return entry;
}

export function deleteLog(id) {
  const db = load();
  const before = db.logs.length;
  db.logs = db.logs.filter((l) => l.id !== id);
  if (db.logs.length === before) throw new Error(`Log "${id}" no existe`);
  persist(db);
}
