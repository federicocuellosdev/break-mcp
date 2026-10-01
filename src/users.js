import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'users.json');

export const ROLES = ['admin', 'analyst', 'dev'];
export const UI_ROLES = ['admin', 'analyst']; // dev se asigna solo via MCP_DEV_USERS

let cache = null;

function devUserIdsFromEnv() {
  return new Set(
    String(process.env.MCP_DEV_USERS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function migrateRole(role, id, devIds) {
  if (devIds.has(String(id).toLowerCase())) return 'dev';
  if (role === 'dev') return 'dev';
  if (role === 'analyst') return 'analyst';
  return 'admin';
}

function migrateUser(id, u, devIds) {
  const migrated = { ...u };
  migrated.role = migrateRole(u.role, id, devIds);
  // analyst conserva clients (array de slugs); admin/dev no necesita
  if (migrated.role === 'analyst') {
    if (!Array.isArray(migrated.clients)) migrated.clients = [];
  } else {
    delete migrated.clients;
  }
  delete migrated.accounts;
  return migrated;
}

function load() {
  if (cache) return cache;

  const envJson = process.env.MCP_USERS_JSON;
  const filePath = process.env.MCP_USERS_FILE || DEFAULT_PATH;
  let raw;

  // Priority: if MCP_USERS_FILE is explicitly set, use file mode (enables CRUD).
  // If the file does not exist yet but MCP_USERS_JSON is set, seed the file from JSON.
  const fileExplicit = !!process.env.MCP_USERS_FILE;
  if (fileExplicit) {
    if (!existsSync(filePath) && envJson) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, envJson);
    }
    if (!existsSync(filePath)) {
      throw new Error(`Users config not found. Create ${filePath} or set MCP_USERS_JSON.`);
    }
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } else if (envJson) {
    try {
      raw = JSON.parse(envJson);
    } catch {
      throw new Error('MCP_USERS_JSON is not valid JSON');
    }
  } else {
    if (!existsSync(filePath)) {
      throw new Error(`Users config not found. Set MCP_USERS_JSON or create ${filePath}.`);
    }
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  }

  if (!raw.users || typeof raw.users !== 'object') {
    throw new Error('users config must have a top-level "users" object');
  }

  const devIds = devUserIdsFromEnv();
  for (const [id, u] of Object.entries(raw.users)) {
    raw.users[id] = migrateUser(id, u, devIds);
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
  return Object.entries(raw.users)
    .sort((a, b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0]), 'es', { sensitivity: 'base' }))
    .map(([id, u]) => ({
      id,
      name: u.name,
      email: u.email || null,
      role: u.role,
      active: u.active !== false,
      clients: u.role === 'analyst' ? (u.clients || []) : null,
      has_password: !!u.password_hash,
      has_token: !!u.token,
    }));
}

export function isDev(user) {
  return !!user && user.role === 'dev';
}

export function isAdminOrDev(user) {
  return !!user && (user.role === 'admin' || user.role === 'dev');
}

export function hasAccess(user) {
  return !!user && ROLES.includes(user.role);
}

export function canAccessClient(user, clientSlug) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'dev') return true;
  if (user.role === 'analyst') return Array.isArray(user.clients) && user.clients.includes(clientSlug);
  return false;
}

export function allowedClientSlugs(user) {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'dev') return null;
  if (user.role === 'analyst') return Array.isArray(user.clients) ? user.clients : [];
  return [];
}

export function assertAccess(user, clientSlug) {
  if (!canAccessClient(user)) {
    throw new Error(
      `User "${user?.id || 'anonymous'}" is not allowed to access client "${clientSlug}"`,
    );
  }
}

export function assertCanAssignRole(actor, targetRole) {
  if (!ROLES.includes(targetRole)) {
    throw new Error(`Rol inválido: ${targetRole}. Valores: ${ROLES.join(', ')}`);
  }
  if (targetRole === 'dev' && !isDev(actor)) {
    throw new Error('Solo un usuario dev puede asignar el rol dev.');
  }
  // admin y analyst los puede asignar cualquiera con acceso al panel
}

function persist(db) {
  const fileExplicit = !!process.env.MCP_USERS_FILE;
  if (!fileExplicit && process.env.MCP_USERS_JSON) {
    throw new Error(
      'Cannot persist users when only MCP_USERS_JSON is set (read-only mode). Set MCP_USERS_FILE to enable CRUD.',
    );
  }
  const path = process.env.MCP_USERS_FILE || DEFAULT_PATH;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(db, null, 2) + '\n');
  cache = null;
}

const PASS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generatePassword(length = 16) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += PASS_ALPHABET[bytes[i] % PASS_ALPHABET.length];
  return out;
}

function slugifyId(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createUser({ id, name, email, role, password, clients }, { actor } = {}) {
  if (!name) throw new Error('name es obligatorio');
  const finalRole = role || 'admin';
  if (actor) assertCanAssignRole(actor, finalRole);
  else if (!ROLES.includes(finalRole)) throw new Error(`Rol inválido: ${finalRole}`);
  const { raw } = load();
  let finalId = id ? slugifyId(id) : slugifyId(email || name);
  if (!finalId) throw new Error('no se pudo derivar un id válido');
  if (raw.users[finalId]) {
    let suffix = 2;
    while (raw.users[`${finalId}-${suffix}`]) suffix++;
    finalId = `${finalId}-${suffix}`;
  }
  const plainPassword = password || generatePassword(16);
  const entry = {
    token: randomBytes(32).toString('hex'),
    name,
    email: email || '',
    role: finalRole,
    active: true,
    password_hash: await bcrypt.hash(plainPassword, 10),
  };
  if (finalRole === 'analyst') entry.clients = Array.isArray(clients) ? clients : [];
  raw.users[finalId] = entry;
  persist(raw);
  return { id: finalId, ...entry, _plain_password: plainPassword };
}

export async function updateUser(id, patch, { actor } = {}) {
  const { raw } = load();
  const u = raw.users[id];
  if (!u) throw new Error(`Usuario "${id}" no existe`);
  if (patch.name !== undefined) u.name = patch.name;
  if (patch.email !== undefined) u.email = patch.email;
  if (patch.role !== undefined) {
    if (actor) assertCanAssignRole(actor, patch.role);
    else if (!ROLES.includes(patch.role)) throw new Error(`Rol inválido: ${patch.role}`);
    u.role = patch.role;
    if (u.role === 'analyst' && !Array.isArray(u.clients)) u.clients = [];
    if (u.role !== 'analyst') delete u.clients;
  }
  if (patch.active !== undefined) u.active = !!patch.active;
  if (patch.password) u.password_hash = await bcrypt.hash(patch.password, 10);
  if (patch.clients !== undefined && u.role === 'analyst') {
    u.clients = Array.isArray(patch.clients) ? patch.clients.filter(Boolean) : [];
  }
  persist(raw);
  return { id, ...u };
}

export async function regenerateUserPassword(id) {
  const { raw } = load();
  const u = raw.users[id];
  if (!u) throw new Error(`Usuario "${id}" no existe`);
  const plain = generatePassword(16);
  u.password_hash = await bcrypt.hash(plain, 10);
  persist(raw);
  return plain;
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
