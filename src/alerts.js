import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'alerts.json');

function filePath() {
  return process.env.ALERTS_FILE || DEFAULT_PATH;
}

function load() {
  const p = filePath();
  if (!existsSync(p)) return { alerts: [] };
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  return { alerts: Array.isArray(raw.alerts) ? raw.alerts : [] };
}

function persist(db) {
  const p = filePath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(db, null, 2) + '\n');
}

export function listAlertsForUser(userId) {
  const { alerts } = load();
  return alerts
    .filter((a) => a.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function createAlert({ userId, title, body, kind = 'info' }) {
  const t = String(title || '').trim();
  const d = String(body || '').trim();
  if (!userId) throw new Error('userId obligatorio');
  if (!t) throw new Error('title obligatorio');
  if (!d) throw new Error('body obligatorio');
  const db = load();
  const entry = {
    id: randomUUID(),
    userId,
    title: t,
    body: d,
    kind,
    createdAt: new Date().toISOString(),
  };
  db.alerts.push(entry);
  persist(db);
  return entry;
}

export function dismissAlert(id, userId) {
  const db = load();
  const before = db.alerts.length;
  db.alerts = db.alerts.filter((a) => !(a.id === id && a.userId === userId));
  if (db.alerts.length === before) throw new Error(`Alerta "${id}" no existe para este usuario`);
  persist(db);
}
