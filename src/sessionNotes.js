import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function notesDir() {
  const dir = process.env.SESSION_NOTES_DIR
    ? resolve(process.env.SESSION_NOTES_DIR)
    : resolve(__dirname, '..', 'data', 'session_notes');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function clientFile(slug) {
  return join(notesDir(), `${slug}.md`);
}

function pad(n) { return String(n).padStart(2, '0'); }
function makeId(d = new Date()) {
  const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}${ms}`;
}

function serializeTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return '[]';
  return '[' + tags.map((t) => JSON.stringify(String(t))).join(', ') + ']';
}

function parseFrontmatter(block) {
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try { out[key] = JSON.parse(val); continue; } catch {}
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function saveNote({ clientSlug, title, body, tags, kind, author }) {
  if (!clientSlug) throw new Error('clientSlug requerido');
  if (!title || !title.trim()) throw new Error('title requerido');
  if (!body || !body.trim()) throw new Error('body requerido');

  const now = new Date();
  const id = makeId(now);
  const entry = [
    '---',
    `id: ${id}`,
    `date: ${now.toISOString()}`,
    `title: ${JSON.stringify(title.trim())}`,
    author?.id ? `author_id: ${author.id}` : null,
    author?.name ? `author_name: ${JSON.stringify(author.name)}` : null,
    kind ? `kind: ${kind}` : null,
    `tags: ${serializeTags(tags)}`,
    '---',
    '',
    body.trim(),
    '',
  ].filter((l) => l !== null).join('\n');

  const path = clientFile(clientSlug);
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : '';
  // Prepend: notas más recientes arriba
  writeFileSync(path, entry + '\n' + prev, 'utf8');
  return { id, date: now.toISOString(), path };
}

export function readNotes({ clientSlug, limit = 10 }) {
  if (!clientSlug) throw new Error('clientSlug requerido');
  const path = clientFile(clientSlug);
  if (!existsSync(path)) return { client: clientSlug, count: 0, notes: [] };
  const raw = readFileSync(path, 'utf8');
  // Split por "---\n" preservando frontmatter. Formato: --- \n fm \n --- \n body \n (seguido de la siguiente entrada o EOF)
  const notes = [];
  const parts = raw.split(/^---\s*$/m);
  // parts[0] = "" (antes del primer ---); luego alternan [frontmatter, body, frontmatter, body, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const fmBlock = parts[i];
    const bodyBlock = parts[i + 1] || '';
    const fm = parseFrontmatter(fmBlock);
    notes.push({
      id: fm.id || null,
      date: fm.date || null,
      title: fm.title || '',
      author_id: fm.author_id || '',
      author_name: fm.author_name || '',
      kind: fm.kind || null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      body: bodyBlock.trim(),
    });
    if (notes.length >= limit) break;
  }
  return { client: clientSlug, count: notes.length, notes };
}
