import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, '..', 'config', 'clients.json');

let cache = null;

function load() {
  if (cache) return cache;

  const envJson = process.env.CLIENTS_JSON;
  if (envJson) {
    try {
      cache = JSON.parse(envJson);
    } catch {
      throw new Error('CLIENTS_JSON is not valid JSON');
    }
  } else {
    const path = process.env.CLIENTS_FILE || DEFAULT_PATH;
    cache = JSON.parse(readFileSync(path, 'utf8'));
  }

  if (!cache.clients || typeof cache.clients !== 'object') {
    throw new Error('clients config must have a top-level "clients" object');
  }
  return cache;
}

export function listClients() {
  const { clients } = load();
  return Object.entries(clients).map(([slug, c]) => ({
    slug,
    name: c.name,
    meta_ad_account_id: c.meta_ad_account_id || null,
    gads_customer_id: c.gads_customer_id || null,
    ga4_property_id: c.ga4_property_id || null,
    sheets: c.sheets || {},
  }));
}

export function getClient(slug) {
  const { clients } = load();
  const c = clients[slug];
  if (!c) {
    const known = Object.keys(clients).join(', ');
    throw new Error(`Unknown client "${slug}". Known: ${known || '(none)'}`);
  }
  return { slug, ...c };
}

export function resolveMetaAdAccount({ client, ad_account_id }) {
  if (ad_account_id) return ad_account_id;
  if (!client) {
    throw new Error('Provide either ad_account_id or client');
  }
  const c = getClient(client);
  if (!c.meta_ad_account_id) {
    throw new Error(`Client "${client}" has no meta_ad_account_id in config`);
  }
  return c.meta_ad_account_id;
}

export function resolveGadsCustomerId({ client, customer_id }) {
  if (customer_id) return customer_id;
  if (!client) throw new Error('Provide either customer_id or client');
  const c = getClient(client);
  if (!c.gads_customer_id) {
    throw new Error(`Client "${client}" has no gads_customer_id in config`);
  }
  return c.gads_customer_id;
}

export function resolveGa4PropertyId({ client, property_id }) {
  if (property_id) return property_id;
  if (!client) throw new Error('Provide either property_id or client');
  const c = getClient(client);
  if (!c.ga4_property_id) {
    throw new Error(`Client "${client}" has no ga4_property_id in config`);
  }
  return c.ga4_property_id;
}

function persist(db) {
  if (process.env.CLIENTS_JSON) {
    throw new Error(
      'Cannot persist clients when CLIENTS_JSON env var is set (read-only mode).',
    );
  }
  const path = process.env.CLIENTS_FILE || DEFAULT_PATH;
  writeFileSync(path, JSON.stringify(db, null, 2) + '\n');
  cache = null;
}

function normalizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createClientRecord({ slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id }) {
  const s = normalizeSlug(slug);
  if (!s) throw new Error('slug obligatorio');
  if (!name) throw new Error('name obligatorio');
  const db = load();
  if (db.clients[s]) throw new Error(`Ya existe un cliente con slug "${s}"`);
  db.clients[s] = {
    name,
    meta_ad_account_id: meta_ad_account_id || null,
    gads_customer_id: gads_customer_id || null,
    ga4_property_id: ga4_property_id || null,
    sheets: {},
  };
  persist(db);
  return { slug: s, ...db.clients[s] };
}

export function updateClientRecord(slug, patch) {
  const db = load();
  const c = db.clients[slug];
  if (!c) throw new Error(`Cliente "${slug}" no existe`);
  if (patch.name !== undefined) c.name = patch.name;
  if (patch.meta_ad_account_id !== undefined) c.meta_ad_account_id = patch.meta_ad_account_id || null;
  if (patch.gads_customer_id !== undefined) c.gads_customer_id = patch.gads_customer_id || null;
  if (patch.ga4_property_id !== undefined) c.ga4_property_id = patch.ga4_property_id || null;
  persist(db);
  return { slug, ...c };
}

export function deleteClientRecord(slug) {
  const db = load();
  if (!db.clients[slug]) throw new Error(`Cliente "${slug}" no existe`);
  delete db.clients[slug];
  persist(db);
}

export function resolveSheetId({ client, sheet_key, spreadsheet_id }) {
  if (spreadsheet_id) return spreadsheet_id;
  if (!client || !sheet_key) {
    throw new Error('Provide either spreadsheet_id or (client + sheet_key)');
  }
  const c = getClient(client);
  const id = c.sheets?.[sheet_key];
  if (!id) {
    const known = Object.keys(c.sheets || {}).join(', ');
    throw new Error(
      `Client "${client}" has no sheet "${sheet_key}". Known keys: ${known || '(none)'}`,
    );
  }
  return id;
}
