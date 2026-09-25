import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'users.json');

let cache = null;

function load() {
  if (cache) return cache;

  const envJson = process.env.MCP_USERS_JSON;
  let raw;
  if (envJson) {
    try {
      raw = JSON.parse(envJson);
    } catch {
      throw new Error('MCP_USERS_JSON is not valid JSON');
    }
  } else {
    const path = process.env.MCP_USERS_FILE || DEFAULT_PATH;
    if (!existsSync(path)) {
      throw new Error(
        `Users config not found. Set MCP_USERS_JSON or create ${path}.`,
      );
    }
    raw = JSON.parse(readFileSync(path, 'utf8'));
  }

  if (!raw.users || typeof raw.users !== 'object') {
    throw new Error('users config must have a top-level "users" object');
  }

  const byToken = new Map();
  for (const [id, u] of Object.entries(raw.users)) {
    if (!u.token) continue;
    byToken.set(u.token, { id, ...u });
  }

  cache = { raw, byToken };
  return cache;
}

export function verifyToken(token) {
  if (!token) return null;
  const { byToken } = load();
  return byToken.get(token) || null;
}

export function getUserById(id) {
  const { raw } = load();
  const u = raw.users[id];
  return u ? { id, ...u } : null;
}

export async function verifyCredentials(idOrEmail, password) {
  const { raw } = load();
  const key = String(idOrEmail).toLowerCase().trim();
  const match = Object.entries(raw.users).find(
    ([id, u]) => id.toLowerCase() === key || (u.email && u.email.toLowerCase() === key),
  );
  if (!match) return null;
  const [id, u] = match;
  if (!u.password_hash) return null;
  const ok = await bcrypt.compare(password, u.password_hash);
  return ok ? { id, ...u } : null;
}

export function listAllUsers() {
  const { raw } = load();
  return Object.entries(raw.users).map(([id, u]) => ({
    id,
    name: u.name,
    email: u.email || null,
    role: u.role,
    active: u.active !== false,
    clients: u.clients,
    accounts: u.accounts || { meta: [], gads: [], ga4: [] },
    has_password: !!u.password_hash,
    has_token: !!u.token,
  }));
}

export function canAccessClient(user, clientSlug) {
  if (!user) return false;
  if (user.role === 'admin' || user.clients === '*') return true;
  if (Array.isArray(user.clients)) return user.clients.includes(clientSlug);
  return false;
}

export function allowedClientSlugs(user) {
  if (!user) return [];
  if (user.role === 'admin' || user.clients === '*') return null;
  return Array.isArray(user.clients) ? user.clients : [];
}

export function assertAccess(user, clientSlug) {
  if (!canAccessClient(user, clientSlug)) {
    throw new Error(
      `User "${user?.id || 'anonymous'}" is not allowed to access client "${clientSlug}"`,
    );
  }
}

function persist(db) {
  if (process.env.MCP_USERS_JSON) {
    throw new Error(
      'Cannot persist users when MCP_USERS_JSON env var is set (read-only mode). Use file mode for CRUD.',
    );
  }
  const path = process.env.MCP_USERS_FILE || DEFAULT_PATH;
  writeFileSync(path, JSON.stringify(db, null, 2) + '\n');
  cache = null;
}

function normalizeClients(input) {
  if (input === '*' || input === '' || input == null) return '*';
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createUser({ id, name, email, role, clients, password }) {
  if (!id || !name) throw new Error('id y name son obligatorios');
  const { raw } = load();
  if (raw.users[id]) throw new Error(`Ya existe un usuario con id "${id}"`);
  const entry = {
    token: randomBytes(32).toString('hex'),
    name,
    email: email || '',
    role: role || 'analyst',
    active: true,
    clients: normalizeClients(clients),
    accounts: { meta: [], gads: [], ga4: [] },
  };
  if (password) entry.password_hash = await bcrypt.hash(password, 10);
  raw.users[id] = entry;
  persist(raw);
  return { id, ...entry };
}

export async function updateUser(id, patch) {
  const { raw } = load();
  const u = raw.users[id];
  if (!u) throw new Error(`Usuario "${id}" no existe`);
  if (patch.name !== undefined) u.name = patch.name;
  if (patch.email !== undefined) u.email = patch.email;
  if (patch.role !== undefined) u.role = patch.role;
  if (patch.active !== undefined) u.active = !!patch.active;
  if (patch.clients !== undefined) u.clients = normalizeClients(patch.clients);
  if (patch.password) u.password_hash = await bcrypt.hash(patch.password, 10);
  persist(raw);
  return { id, ...u };
}

export function updateUserAccounts(id, platform, ids) {
  const { raw } = load();
  const u = raw.users[id];
  if (!u) throw new Error(`Usuario "${id}" no existe`);
  if (!['meta', 'gads', 'ga4'].includes(platform)) {
    throw new Error(`platform inválida: ${platform}`);
  }
  if (!u.accounts) u.accounts = { meta: [], gads: [], ga4: [] };
  const normalized = Array.isArray(ids)
    ? ids.map((s) => String(s).trim()).filter(Boolean)
    : String(ids || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  u.accounts[platform] = normalized;
  persist(raw);
  return u.accounts;
}

export function regenerateUserToken(id) {
  const { raw } = load();
  const u = raw.users[id];
  if (!u) throw new Error(`Usuario "${id}" no existe`);
  u.token = randomBytes(32).toString('hex');
  persist(raw);
  return u.token;
}

export function deleteUser(id) {
  const { raw } = load();
  if (!raw.users[id]) throw new Error(`Usuario "${id}" no existe`);
  delete raw.users[id];
  persist(raw);
}
