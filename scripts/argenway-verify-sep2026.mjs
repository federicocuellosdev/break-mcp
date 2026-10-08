import { runSearch } from '../src/providers/gads.js';

const META_ACCOUNT = 'act_1377888335802809';
const GADS_ACCOUNTS = ['3514893354', '1084565846']; // Argenway/Break + Argenway

const FROM = '2026-09-01';
const TO = '2026-09-30';
const PREV_FROM = '2026-08-01';
const PREV_TO = '2026-08-31';

async function meta(path, params = {}) {
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

async function metaInsights(accountId, from, to) {
  const j = await meta(`/${accountId}/insights`, {
    level: 'account',
    fields: 'spend,impressions,reach,frequency,clicks,ctr,cpm,cpc,actions',
    time_range: { since: from, until: to },
  });
  return (j.data || [])[0] || {};
}

async function metaCampaigns(accountId, from, to) {
  const j = await meta(`/${accountId}/insights`, {
    level: 'campaign',
    fields: 'campaign_name,spend,impressions,reach,frequency,clicks,ctr,cpm,cpc,actions',
    time_range: { since: from, until: to },
    limit: 100,
  });
  return j.data || [];
}

async function gadsAccountMetrics(cid, from, to) {
  const q = `
    SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.ctr, metrics.average_cpc
    FROM customer
    WHERE segments.date BETWEEN '${from}' AND '${to}'
  `;
  const d = await runSearch({ customerId: cid, query: q });
  const rows = d.results || [];
  let cost = 0, imp = 0, clk = 0, conv = 0;
  for (const r of rows) {
    cost += Number(r.metrics?.costMicros || 0);
    imp += Number(r.metrics?.impressions || 0);
    clk += Number(r.metrics?.clicks || 0);
    conv += Number(r.metrics?.conversions || 0);
  }
  return { cost: cost / 1e6, imp, clk, conv };
}

async function gadsCampaigns(cid, from, to) {
  const q = `
    SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.ctr
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
  `;
  const d = await runSearch({ customerId: cid, query: q });
  return (d.results || []).map((r) => ({
    name: r.campaign?.name,
    status: r.campaign?.status,
    cost: Number(r.metrics?.costMicros || 0) / 1e6,
    imp: Number(r.metrics?.impressions || 0),
    clk: Number(r.metrics?.clicks || 0),
    conv: Number(r.metrics?.conversions || 0),
  }));
}

function sumActions(actions, type) {
  if (!actions) return 0;
  const a = actions.find((x) => x.action_type === type);
  return a ? Number(a.value) : 0;
}

const fmt = (n) => Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) + '%' : 's/d');
const delta = (now, prev) => {
  if (!prev) return 'n/a';
  const d = ((now - prev) / prev) * 100;
  return (d >= 0 ? '↑' : '↓') + ' ' + Math.abs(d).toFixed(1) + '%';
};

console.log(`\n=== Argenway · ${FROM} → ${TO} vs ${PREV_FROM} → ${PREV_TO} ===\n`);

console.log('### META ADS (act_1377888335802809)');
const [metaSep, metaAgo] = await Promise.all([
  metaInsights(META_ACCOUNT, FROM, TO),
  metaInsights(META_ACCOUNT, PREV_FROM, PREV_TO),
]);

const metaLeads = sumActions(metaSep.actions, 'lead');
const metaMsgConvs = sumActions(metaSep.actions, 'onsite_conversion.messaging_conversation_started_7d');
const metaMsgConvsAgo = sumActions(metaAgo.actions, 'onsite_conversion.messaging_conversation_started_7d');
const metaLeadsAgo = sumActions(metaAgo.actions, 'lead');

console.log(`  Inversión:    $${fmt(metaSep.spend)}  (vs $${fmt(metaAgo.spend)} = ${delta(+metaSep.spend, +metaAgo.spend)})`);
console.log(`  Impresiones:  ${fmt(metaSep.impressions)}  (vs ${fmt(metaAgo.impressions)})`);
console.log(`  Alcance:      ${fmt(metaSep.reach)}  (freq: ${metaSep.frequency})`);
console.log(`  Clics:        ${fmt(metaSep.clicks)}  (CTR ${metaSep.ctr}% · CPC $${fmt(metaSep.cpc)})`);
console.log(`  CPM:          $${fmt(metaSep.cpm)}`);
console.log(`  Leads:        ${metaLeads}  (vs ago: ${metaLeadsAgo})`);
console.log(`  Conv. msg:    ${metaMsgConvs}  (vs ago: ${metaMsgConvsAgo})`);
console.log(`  Actions brutas:`);
for (const a of metaSep.actions || []) {
  console.log(`    ${a.action_type.padEnd(55)} = ${a.value}`);
}

console.log('\n### META ADS · campañas septiembre');
const metaCamps = await metaCampaigns(META_ACCOUNT, FROM, TO);
for (const c of metaCamps.sort((a, b) => +b.spend - +a.spend)) {
  const leads = sumActions(c.actions, 'lead');
  console.log(`  ${c.campaign_name}`);
  console.log(`    spend=$${fmt(c.spend)}  imp=${fmt(c.impressions)}  reach=${fmt(c.reach)}  clk=${fmt(c.clicks)}  CTR=${c.ctr}%  CPM=$${fmt(c.cpm)}  leads=${leads}`);
}

console.log('\n### GOOGLE ADS');
for (const cid of GADS_ACCOUNTS) {
  try {
    const [sep, ago] = await Promise.all([
      gadsAccountMetrics(cid, FROM, TO),
      gadsAccountMetrics(cid, PREV_FROM, PREV_TO),
    ]);
    console.log(`  Cuenta ${cid}:`);
    console.log(`    Inversión:   $${fmt(sep.cost)}  (vs $${fmt(ago.cost)} = ${delta(sep.cost, ago.cost)})`);
    console.log(`    Impresiones: ${fmt(sep.imp)}  (vs ${fmt(ago.imp)} = ${delta(sep.imp, ago.imp)})`);
    console.log(`    Clics:       ${fmt(sep.clk)}  (CTR ${pct(sep.clk, sep.imp)})`);
    console.log(`    Conversiones:${sep.conv.toFixed(2)}`);

    console.log('    Campañas:');
    const camps = await gadsCampaigns(cid, FROM, TO);
    const byName = {};
    for (const c of camps) {
      if (!byName[c.name]) byName[c.name] = { ...c };
      else {
        byName[c.name].cost += c.cost;
        byName[c.name].imp += c.imp;
        byName[c.name].clk += c.clk;
        byName[c.name].conv += c.conv;
      }
    }
    for (const c of Object.values(byName).sort((a, b) => b.cost - a.cost)) {
      console.log(`      ${(c.name || '').slice(0, 48).padEnd(48)}  spend=$${fmt(c.cost).padStart(10)}  imp=${fmt(c.imp).padStart(7)}  clk=${fmt(c.clk).padStart(5)}  conv=${c.conv.toFixed(2)}  CTR=${pct(c.clk, c.imp)}`);
    }
  } catch (e) {
    console.log(`  Cuenta ${cid}: ERR ${e.message.slice(0, 100)}`);
  }
}
