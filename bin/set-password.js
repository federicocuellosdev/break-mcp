#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const [id, password] = process.argv.slice(2);
if (!id || !password) {
  console.error('Usage: node bin/set-password.js <user_id> <password>');
  process.exit(1);
}

const path = resolve(process.cwd(), 'config', 'users.json');
const db = JSON.parse(readFileSync(path, 'utf8'));
if (!db.users?.[id]) {
  console.error(`User "${id}" not found.`);
  process.exit(1);
}
db.users[id].password_hash = await bcrypt.hash(password, 10);
writeFileSync(path, JSON.stringify(db, null, 2) + '\n');
console.log(`Password updated for "${id}".`);
