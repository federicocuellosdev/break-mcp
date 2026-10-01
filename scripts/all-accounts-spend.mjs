import { runSearch, listMccChildren } from '../src/providers/gads.js';

const now = new Date();
const FROM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const TODAY = now.toISOString().slice(0, 10);

const META_STATUS = {
  1: 'ACTIVE',
  2: 'DISABLED',
  3: 'UNSETTLED',
  7: 'PENDING_RISK',
  8: 'PENDING_SETTLEMENT',
  9: 'GRACE',
  100: 'PENDING_CLOSURE',
  101: 'CLOSED',
  201: 'ACTIVE',
  202: 'CLOSED',
};

async function graph(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  const ver = process.env.META_GRAPH_VERSION || 'v21.0';
  const url = new URL(`https://graph.facebook.com/${ver}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
}

async function metaSpend() {
  const bm = process.env.META_BUSINESS_ID;
  const fields = 'id,account_id,name,currency,account_status';
  const [owned, client] = await Promise.all([
    graph(`/${bm}/owned_ad_accounts`, { fields, limit: 200 }),
    graph(`/${bm}/client_ad_accounts`, { fields, limit: 200 }),
  ]);
  const accounts = [
    ...(owned.data || []).map((a) => ({ ...a, kind: 'owned' })),
    ...(client.data || []).map((a) => ({ ...a, kind: 'client' })),
  ];
  const results = await Promise.all(
    accounts.map(async (a) => {
      try {
        const j = await graph(`/${a.id}/insights`, {
          fields: 'spend',
          time_range: { since: FROM, until: TODAY },
        });
        const spend = Number(j.data?.[0]?.spend || 0);
        return { ...a, spend };
      } catch (e) {
        return { ...a, spend: null, error: e.message };
      }
    }),
  );
  return results;
}

async function gadsSpendAll() {
  const children = await listMccChildren();
  const results = await Promise.all(
    (children || []).map(async (c) => {
      const cid = String(c.id);
      try {
        const sq = await runSearch({
          customerId: cid,
          query: `SELECT metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${FROM}' AND '${TODAY}'`,
        });
        let micros = 0;
        for (const r of sq.results || []) {
          const m = r.metrics?.costMicros || r.metrics?.cost_micros;
          if (m) micros += Number(m);
        }
        return {
          id: cid,
          name: c.name || c.descriptive_name || '',
          currency: c.currency_code || c.currency || '',
          status: c.status || '',
          spend: micros / 1e6,
        };
      } catch (e) {
        return { id: cid, name: c.name || '', spend: null, error: e.message };
      }
    }),
  );
  return results;
}

const fmt = (n) => (n == null ? '—' : '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));

const [meta, gads] = await Promise.all([metaSpend(), gadsSpendAll()]);

console.log(`\n=== META ADS — spend ${FROM} → ${TODAY} ===`);
const metaSorted = meta.slice().sort((a, b) => (b.spend || 0) - (a.spend || 0));
let metaTotal = 0;
for (const a of metaSorted) {
  if (a.spend) metaTotal += a.spend;
  const status = META_STATUS[a.account_status] || `?${a.account_status}`;
  console.log(
    `${fmt(a.spend).padStart(16)}  ${(a.currency || '').padEnd(4)}  ${status.padEnd(18)}  ${(a.name || '').slice(0, 40).padEnd(40)}  ${a.id}${a.error ? '  ERR:' + a.error.slice(0, 50) : ''}`,
  );
}
console.log(`TOTAL META (ARS mix): ${fmt(metaTotal)}  (${metaSorted.filter((a) => a.spend > 0).length} cuentas con gasto)`);

console.log(`\n=== GOOGLE ADS — spend ${FROM} → ${TODAY} ===`);
const gadsSorted = gads.slice().sort((a, b) => (b.spend || 0) - (a.spend || 0));
let gadsTotal = 0;
for (const a of gadsSorted) {
  if (a.spend) gadsTotal += a.spend;
  console.log(
    `${fmt(a.spend).padStart(16)}  ${(a.currency || '').padEnd(4)}  ${(a.status || '').padEnd(10)}  ${(a.name || '').slice(0, 40).padEnd(40)}  ${a.id}${a.error ? '  ERR:' + a.error.slice(0, 50) : ''}`,
  );
}
console.log(`TOTAL GADS (currency mix): ${fmt(gadsTotal)}  (${gadsSorted.filter((a) => a.spend > 0).length} cuentas con gasto)`);
