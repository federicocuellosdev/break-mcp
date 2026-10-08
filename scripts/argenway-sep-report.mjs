#!/usr/bin/env node
// Pulls Argenway Kommo leads for September 2026 (Argentine time) and
// classifies by pipeline + status. Reads token from .env.enc via sops.

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const env = Object.fromEntries(
  execSync('sops --input-type dotenv --output-type dotenv -d .env.enc', {
    cwd: new URL('..', import.meta.url).pathname.slice(1),
    encoding: 'utf8',
  })
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const TOKEN = env.KOMMO_ARGENWAY_TOKEN;
const SUB = env.KOMMO_ARGENWAY_SUBDOMAIN || 'argenway';
if (!TOKEN) throw new Error('no KOMMO_ARGENWAY_TOKEN');

const FROM = 1788231600; // 2026-09-01 00:00 -03
const TO = 1790823599; // 2026-09-30 23:59 -03

async function paged(path) {
  const out = [];
  let page = 1;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `https://${SUB}.kommo.com${path}${sep}limit=250&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (res.status === 204) break;
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    const body = await res.json();
    const items = body?._embedded?.leads || [];
    if (!items.length) break;
    out.push(...items);
    if (!body?._links?.next) break;
    page++;
    if (page > 50) break;
  }
  return out;
}

const leads = await paged(
  `/api/v4/leads?filter%5Bcreated_at%5D%5Bfrom%5D=${FROM}&filter%5Bcreated_at%5D%5Bto%5D=${TO}`,
);
console.log(`total leads sep: ${leads.length}`);

// Pipelines dict
const pipelinesRes = await fetch(`https://${SUB}.kommo.com/api/v4/leads/pipelines`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const pipelinesBody = await pipelinesRes.json();
const nameOfStatus = {};
const nameOfPipeline = {};
for (const p of pipelinesBody._embedded.pipelines) {
  nameOfPipeline[p.id] = p.name;
  for (const s of p._embedded.statuses) nameOfStatus[`${p.id}:${s.id}`] = s.name;
}

const buckets = {};
for (const l of leads) {
  const key = `${l.pipeline_id} ${nameOfPipeline[l.pipeline_id] || '?'} / ${
    nameOfStatus[`${l.pipeline_id}:${l.status_id}`] || l.status_id
  }`;
  buckets[key] = (buckets[key] || 0) + 1;
}
const rows = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
console.log('\nBuckets:');
for (const [k, v] of rows) console.log(`  ${String(v).padStart(4)}  ${k}`);

writeFileSync(
  'scripts/argenway-sep-report.json',
  JSON.stringify({ total: leads.length, buckets: Object.fromEntries(rows), leads }, null, 2),
);
console.log('\nsaved scripts/argenway-sep-report.json');
