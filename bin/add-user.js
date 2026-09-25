#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
if (args.length < 2 || args.includes('--help')) {
  console.error(`
Usage:
  node bin/add-user.js <id> <name> [--email <email>] [--role admin|analyst] [--clients slug1,slug2|*] [--password <pass>]

If --password is omitted, only a bearer token is generated (user cannot log in to the web UI).
`);
  process.exit(1);
}

const [id, name, ...rest] = args;
const readOpt = (flag, def) => {
  const i = rest.indexOf(flag);
  return i >= 0 ? rest[i + 1] : def;
};

const email = readOpt('--email', '');
const role = readOpt('--role', 'analyst');
const clientsRaw = readOpt('--clients', '');
const password = readOpt('--password', '');
const clients = clientsRaw === '*' || clientsRaw === '' ? '*' : clientsRaw.split(',').map((s) => s.trim()).filter(Boolean);

const path = resolve(process.cwd(), 'config', 'users.json');
let db = { users: {} };
if (existsSync(path)) {
  db = JSON.parse(readFileSync(path, 'utf8'));
  if (!db.users) db.users = {};
} else {
  mkdirSync(dirname(path), { recursive: true });
}

if (db.users[id]) {
  console.error(`User "${id}" already exists. Delete it manually first to regenerate.`);
  process.exit(1);
}

const token = randomBytes(32).toString('hex');
const entry = { token, name, email, role, clients };
if (password) {
  entry.password_hash = await bcrypt.hash(password, 10);
}
db.users[id] = entry;

writeFileSync(path, JSON.stringify(db, null, 2) + '\n');

const url = process.env.MCP_URL || 'https://REPLACE-WITH-RENDER-URL';
console.log(`\nUser "${id}" created${password ? ' (with password)' : ' (token only)'}.\n`);
console.log('Bearer token:', token);
console.log(`\nWeb login URL: ${url}/login`);
console.log(`Config file:   ${url}/config.md (after login)`);
