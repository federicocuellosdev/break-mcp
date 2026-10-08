import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
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
    // Seed from packaged default if custom path does not exist yet (first boot with persistent disk)
    if (path !== DEFAULT_PATH && existsSync(DEFAULT_PATH)) {
      if (!existsSync(path)) {
        mkdirSync(dirname(path), { recursive: true });
        copyFileSync(DEFAULT_PATH, path);
      } else if (process.env.CLIENTS_FORCE_SEED === '1') {
        // Backup current and re-seed from repo. Set CLIENTS_FORCE_SEED=1 for one boot,
        // then remove it. Backup goes next to the file with a timestamp.
        mkdirSync(dirname(path), { recursive: true });
        const bak = `${path}.bak.${Date.now()}`;
        copyFileSync(path, bak);
        copyFileSync(DEFAULT_PATH, path);
        console.log(`[clients] Force-seeded ${path} from repo. Backup: ${bak}`);
      }
    }
    cache = JSON.parse(readFileSync(path, 'utf8'));
  }

  if (!cache.clients || typeof cache.clients !== 'object') {
    throw new Error('clients config must have a top-level "clients" object');
  }
  return cache;
}

function normAcc(single, plural) {
  if (Array.isArray(plural) && plural.length) return plural.map(String);
  if (single) return [String(single)];
  return [];
}

export function listClients() {
  const { clients } = load();
  return Object.entries(clients)
    .sort((a, b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0]), 'es', { sensitivity: 'base' }))
    .map(([slug, c]) => {
    const metaIds = normAcc(c.meta_ad_account_id, c.meta_ad_accounts);
    const gadsIds = normAcc(c.gads_customer_id, c.gads_customers);
    const ga4Ids = normAcc(c.ga4_property_id, c.ga4_properties);
    return {
      slug,
      name: c.name,
      active: c.active !== false,
      meta_ad_account_id: metaIds[0] || null,
      gads_customer_id: gadsIds[0] || null,
      ga4_property_id: ga4Ids[0] || null,
      meta_ad_accounts: metaIds,
      gads_customers: gadsIds,
      ga4_properties: ga4Ids,
      sheets: c.sheets || {},
      budgets: c.budgets || {},
      platforms_active: c.platforms_active || {},
    };
  });
}

function decodeJwtExp(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(pad, 'base64').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function updateClientKommo(slug, { subdomain, token }) {
  const db = load();
  const c = db.clients[slug];
  if (!c) throw new Error(`Cliente "${slug}" no existe`);
  const sub = String(subdomain || '').toLowerCase().trim().replace(/\.kommo\.com\/?$/, '').replace(/^https?:\/\//, '').replace(/[^a-z0-9-]/g, '');
  const tok = String(token || '').trim();
  if (!sub && !tok) {
    delete c.kommo;
    persist(db);
    return null;
  }
  if (!sub) throw new Error('Subdominio obligatorio');
  if (!tok) throw new Error('Token obligatorio');
  const exp = decodeJwtExp(tok);
  c.kommo = { subdomain: sub, token: tok, token_exp: exp };
  persist(db);
  return c.kommo;
}

export function updateClientPlatformActive(slug, platform, active) {
  const db = load();
  const c = db.clients[slug];
  if (!c) throw new Error(`Cliente "${slug}" no existe`);
  if (!['meta', 'gads', 'ga4'].includes(platform)) throw new Error(`platform inválida: ${platform}`);
  if (!c.platforms_active) c.platforms_active = {};
  c.platforms_active[platform] = !!active;
  persist(db);
  return c.platforms_active;
}

const PLATFORM_FIELDS = {
  meta: { singular: 'meta_ad_account_id', plural: 'meta_ad_accounts' },
  gads: { singular: 'gads_customer_id', plural: 'gads_customers' },
  ga4: { singular: 'ga4_property_id', plural: 'ga4_properties' },
};

const BUDGET_PLATFORMS = new Set(['meta', 'gads']);

function normBudgetEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === 'number') return { amount: entry, alert_pct: 80 };
  return { amount: entry.amount ?? null, alert_pct: entry.alert_pct ?? 80 };
}

export function updateClientBudget(slug, platform, patch) {
  const db = load();
  const c = db.clients[slug];
  if (!c) throw new Error(`Cliente "${slug}" no existe`);
  if (!BUDGET_PLATFORMS.has(platform)) throw new Error(`platform inválida para presupuesto: ${platform}`);
  if (!c.budgets) c.budgets = {};
  const current = normBudgetEntry(c.budgets[platform]) || { amount: null, alert_pct: 80 };

  if (patch && Object.prototype.hasOwnProperty.call(patch, 'amount')) {
    const raw = patch.amount;
    const n = raw === '' || raw == null ? null : Number(raw);
    if (n != null && (!Number.isFinite(n) || n < 0)) throw new Error('Monto inválido');
    current.amount = n;
  }
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'alert_pct')) {
    const raw = patch.alert_pct;
    const n = raw === '' || raw == null ? null : Number(raw);
    if (n != null && (!Number.isFinite(n) || n < 0 || n > 100)) throw new Error('Porcentaje inválido (0-100)');
    current.alert_pct = n ?? 80;
  }

  if (current.amount == null) delete c.budgets[platform];
  else c.budgets[platform] = current;

  persist(db);
  return c.budgets;
}

export function updateClientAccounts(slug, platform, ids) {
  const db = load();
  const c = db.clients[slug];
  if (!c) throw new Error(`Cliente "${slug}" no existe`);
  const fields = PLATFORM_FIELDS[platform];
  if (!fields) throw new Error(`platform inválida: ${platform}`);
  const normalized = Array.isArray(ids)
    ? [...new Set(ids.map((s) => String(s).trim()).filter(Boolean))]
    : String(ids || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  c[fields.plural] = normalized;
  c[fields.singular] = normalized[0] || null;
  persist(db);
  return normalized;
}

export function getClient(slug) {
  const { clients } = load();
  const c = clients[slug];
  if (!c) {
    const known = Object.keys(clients).join(', ');
    throw new Error(`Unknown client "${slug}". Known: ${known || '(none)'}`);
  }
  const metaIds = normAcc(c.meta_ad_account_id, c.meta_ad_accounts);
  const gadsIds = normAcc(c.gads_customer_id, c.gads_customers);
  const ga4Ids = normAcc(c.ga4_property_id, c.ga4_properties);
  return {
    slug,
    ...c,
    meta_ad_account_id: metaIds[0] || null,
    gads_customer_id: gadsIds[0] || null,
    ga4_property_id: ga4Ids[0] || null,
    meta_ad_accounts: metaIds,
    gads_customers: gadsIds,
    ga4_properties: ga4Ids,
  };
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
  const meta = meta_ad_account_id ? String(meta_ad_account_id) : null;
  const gads = gads_customer_id ? String(gads_customer_id) : null;
  const ga4 = ga4_property_id ? String(ga4_property_id) : null;
  db.clients[s] = {
    name,
    meta_ad_account_id: meta,
    gads_customer_id: gads,
    ga4_property_id: ga4,
    meta_ad_accounts: meta ? [meta] : [],
    gads_customers: gads ? [gads] : [],
    ga4_properties: ga4 ? [ga4] : [],
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
  if (patch.active !== undefined) c.active = !!patch.active;
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
