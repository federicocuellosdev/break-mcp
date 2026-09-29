import { runSearch } from './providers/gads.js';

async function metaSpend(accountIds, from, to) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
  const ver = process.env.META_GRAPH_VERSION || 'v21.0';
  let total = 0;
  for (const acc of accountIds) {
    const url = new URL(`https://graph.facebook.com/${ver}/${acc}/insights`);
    url.searchParams.set('access_token', token);
    url.searchParams.set('fields', 'spend');
    url.searchParams.set('time_range', JSON.stringify({ since: from, until: to }));
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const row = j.data && j.data[0];
    if (row && row.spend) total += Number(row.spend);
  }
  return total;
}

async function gadsSpend(customerIds, from, to) {
  let total = 0;
  const query = `SELECT metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${from}' AND '${to}'`;
  for (const cid of customerIds) {
    const data = await runSearch({ customerId: cid, query });
    const rows = data.results || [];
    for (const row of rows) {
      const cost = row.metrics && (row.metrics.costMicros || row.metrics.cost_micros);
      if (cost) total += Number(cost) / 1e6;
    }
  }
  return total;
}

function buildStatus(budgetEntry, spendResult) {
  const budget = Number(budgetEntry.amount) || 0;
  const alert_pct = budgetEntry.alert_pct ?? 80;
  const hasBudget = budgetEntry.amount != null && budget > 0;
  if (spendResult && typeof spendResult === 'object' && spendResult.error) {
    return { budget, alert_pct, spend: null, pct: null, status: 'error', error: spendResult.error };
  }
  const spend = Number(spendResult) || 0;
  const pct = hasBudget ? (spend / budget) * 100 : null;
  let status = 'ok';
  if (!hasBudget) status = 'no-budget';
  else if (spend >= budget) status = 'over';
  else if (pct >= alert_pct) status = 'warn';
  return { budget, alert_pct, spend, pct, status };
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
      return { slug: c.slug, name: c.name, platforms };
    }),
  );
  return results;
}
