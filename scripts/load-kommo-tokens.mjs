#!/usr/bin/env node
// Lee KOMMO_<CLIENT>_SUBDOMINIO + KOMMO_<CLIENT>_TOKEN del vault (break/api, break/previnca)
// y los mergea en config/clients.json. Decodifica el JWT para extraer exp.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

function decrypt(path) {
  const out = execFileSync('sops', ['--input-type', 'dotenv', '--output-type', 'dotenv', '-d', path], {
    encoding: 'utf8',
  });
  return Object.fromEntries(
    out
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
}

function decodeExp(token) {
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

const breakApi = decrypt('C:/Dev/break/api/.env.enc');
const previnca = decrypt('C:/Dev/break/previnca/.env.enc');

// slug → {sub, tok}
const mapping = {
  azahares: { sub: breakApi.KOMMO_AZAHARES_SUBDOMINIO, tok: breakApi.KOMMO_AZAHARES_TOKEN },
  coas: { sub: breakApi.KOMMO_COAS_SUBDOMINIO, tok: breakApi.KOMMO_COAS_TOKEN },
  preston: { sub: breakApi.KOMMO_PRESTON_SUBDOMINIO, tok: breakApi.KOMMO_PRESTON_TOKEN },
  'break-talent': { sub: breakApi.KOMMO_TALENT_SUBDOMINIO, tok: breakApi.KOMMO_TALENT_TOKEN },
  yafue: { sub: breakApi.KOMMO_YAFUE_SUBDOMINIO, tok: breakApi.KOMMO_YAFUE_TOKEN },
  previnca: { sub: previnca.KOMMO_SUBDOMINIO, tok: previnca.KOMMO_TOKEN },
  // marlaca: token present but no subdomain in vault
  marlaca: { sub: null, tok: breakApi.MARLACA_KOMMO_TOKEN },
};

const path = 'config/clients.json';
const db = JSON.parse(readFileSync(path, 'utf8'));

const report = [];
for (const [slug, { sub, tok }] of Object.entries(mapping)) {
  if (!db.clients[slug]) {
    report.push([slug, 'SKIP: no existe en clients.json']);
    continue;
  }
  if (!sub || !tok) {
    report.push([slug, `SKIP: incompleto (sub=${!!sub} tok=${!!tok})`]);
    continue;
  }
  const exp = decodeExp(tok);
  db.clients[slug].kommo = { subdomain: sub, token: tok, token_exp: exp };
  const d = exp ? new Date(exp * 1000).toISOString().slice(0, 10) : 'sin exp';
  report.push([slug, `OK  sub=${sub}  exp=${d}`]);
}

writeFileSync(path, JSON.stringify(db, null, 2) + '\n');

console.log('\nResultado:');
for (const [slug, msg] of report) console.log(`  ${slug.padEnd(14)} ${msg}`);
