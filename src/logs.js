import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'logs.json');

function filePath() {
  return process.env.LOGS_FILE || DEFAULT_PATH;
}

function load() {
  const p = filePath();
  if (!existsSync(p)) return { logs: [] };
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  return { logs: Array.isArray(raw.logs) ? raw.logs : [] };
}

function persist(db) {
  writeFileSync(filePath(), JSON.stringify(db, null, 2) + '\n');
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
  return entry;
}

export function deleteLog(id) {
  const db = load();
  const before = db.logs.length;
  db.logs = db.logs.filter((l) => l.id !== id);
  if (db.logs.length === before) throw new Error(`Log "${id}" no existe`);
  persist(db);
}
