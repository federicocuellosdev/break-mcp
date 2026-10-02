import { runSearch } from './providers/gads.js';

async function metaGet(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
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

async function metaSpend(accountIds, from, to) {
  let total = 0;
  let currency = null;
  for (const acc of accountIds) {
    const j = await metaGet(`/${acc}/insights`, {
      fields: 'spend,account_currency',
      time_range: { since: from, until: to },
    });
    const row = j.data && j.data[0];
    if (row) {
      if (row.spend) total += Number(row.spend);
      if (row.account_currency && !currency) currency = row.account_currency;
    }
  }
  if (!currency && accountIds.length) {
    try {
      const info = await metaGet(`/${accountIds[0]}`, { fields: 'currency' });
      currency = info.currency || null;
    } catch {}
  }
  return { spend: total, currency };
}

async function gadsSpend(customerIds, from, to) {
  let total = 0;
  let currency = null;
  const query = `SELECT metrics.cost_micros, customer.currency_code FROM customer WHERE segments.date BETWEEN '${from}' AND '${to}'`;
  for (const cid of customerIds) {
    const data = await runSearch({ customerId: cid, query });
    for (const row of data.results || []) {
      const cost = row.metrics && (row.metrics.costMicros || row.metrics.cost_micros);
      if (cost) total += Number(cost) / 1e6;
      const cur = row.customer && (row.customer.currencyCode || row.customer.currency_code);
      if (cur && !currency) currency = cur;
    }
  }
  if (!currency && customerIds.length) {
    try {
      const info = await runSearch({
        customerId: customerIds[0],
        query: 'SELECT customer.currency_code FROM customer LIMIT 1',
      });
      const r = info.results && info.results[0];
      currency = (r && r.customer && (r.customer.currencyCode || r.customer.currency_code)) || null;
    } catch {}
  }
  return { spend: total, currency };
}

function buildStatus(budgetEntry, result) {
  const budget = Number(budgetEntry.amount) || 0;
  const alert_pct = budgetEntry.alert_pct ?? 80;
  const hasBudget = budgetEntry.amount != null && budget > 0;
  if (result && result.error) {
    return { budget, alert_pct, spend: null, pct: null, currency: null, status: 'error', error: result.error };
  }
  const spend = Number(result?.spend) || 0;
  const currency = result?.currency || null;
  const pct = hasBudget ? (spend / budget) * 100 : null;
  let status = 'ok';
  if (!hasBudget) status = 'no-budget';
  else if (spend >= budget) status = 'over';
  else if (pct >= alert_pct) status = 'warn';
  return { budget, alert_pct, spend, pct, currency, status };
}

export async function computeInvestment({ clients, from, to }) {
  const results = await Promise.all(
    clients.map(async (c) => {
      const b = c.budgets || {};
      const platforms = {};
      const jobs = [];

      const metaAccs = c.meta_ad_accounts || [];
      const hasMetaBudget = b.meta && b.meta.amount != null;
      if (metaAccs.length || hasMetaBudget) {
        const be = hasMetaBudget ? b.meta : { amount: null, alert_pct: 80 };
        if (metaAccs.length) {
          jobs.push(
            metaSpend(metaAccs, from, to)
              .then((s) => { platforms.meta = buildStatus(be, s); })
              .catch((e) => { platforms.meta = buildStatus(be, { error: e.message }); }),
          );
        } else {
          platforms.meta = {
            budget: Number(be.amount) || 0,
            alert_pct: be.alert_pct ?? 80,
            spend: null,
            pct: null,
            status: 'no-account',
          };
        }
      }

      const gadsAccs = c.gads_customers || [];
      const hasGadsBudget = b.gads && b.gads.amount != null;
      if (gadsAccs.length || hasGadsBudget) {
        const be = hasGadsBudget ? b.gads : { amount: null, alert_pct: 80 };
        if (gadsAccs.length) {
          jobs.push(
            gadsSpend(gadsAccs, from, to)
              .then((s) => { platforms.gads = buildStatus(be, s); })
              .catch((e) => { platforms.gads = buildStatus(be, { error: e.message }); }),
          );
        } else {
          platforms.gads = {
            budget: Number(be.amount) || 0,
            alert_pct: be.alert_pct ?? 80,
            spend: null,
            pct: null,
            status: 'no-account',
          };
        }
      }

      await Promise.all(jobs);
      return {
        slug: c.slug,
        name: c.name,
        meta_ad_accounts: metaAccs,
        gads_customers: gadsAccs,
        platforms_active: c.platforms_active || {},
        platforms,
      };
    }),
  );
  return results;
}
