#!/usr/bin/env node
import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exec } from 'node:child_process';

const ENV_PATH = resolve(process.cwd(), '.env');
const REDIRECT_URI = 'http://localhost:8888/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/adwords';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function parseEnv(text) {
  const map = new Map();
  text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  });
  return map;
}

function writeEnv(text, updates) {
  let out = text;
  for (const [k, v] of updates) {
    const re = new RegExp(`^${k}=.*$`, 'm');
    if (re.test(out)) out = out.replace(re, `${k}=${v}`);
    else out += (out.endsWith('\n') ? '' : '\n') + `${k}=${v}\n`;
  }
  return out;
}

const raw = readFileSync(ENV_PATH, 'utf8');
const env = parseEnv(raw);
const clientId = env.get('GADS_CLIENT_ID');
const clientSecret = env.get('GADS_CLIENT_SECRET');
if (!clientId || !clientSecret) {
  console.error('Faltan GADS_CLIENT_ID o GADS_CLIENT_SECRET en .env');
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);
const authUrl =
  `${AUTH_URL}?` +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  }).toString();

console.log('\n1. El browser se va a abrir con la pantalla de consent de Google.');
console.log('2. Autorizá con la cuenta que tiene acceso al MCC de Google Ads.');
console.log('3. Google redirige a localhost:8888 y este script captura el refresh_token.\n');
console.log('Si el browser no abre solo, entrá manualmente a:');
console.log(authUrl, '\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:8888`);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end('Not found');
    return;
  }
  const code = url.searchParams.get('code');
  const gotState = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<h1>Error: ${err}</h1><p>Cerrá esta ventana y volvé a la terminal.</p>`);
    console.error('Error del consent:', err);
    server.close();
    process.exit(1);
  }
  if (!code || gotState !== state) {
    res.writeHead(400).end('Bad request');
    return;
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    });
    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    if (!r.ok || !data.refresh_token) {
      res
        .writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(`<h1>Sin refresh_token</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
      console.error('Respuesta de Google:', data);
      server.close();
      process.exit(1);
    }

    const updated = writeEnv(raw, [['GADS_REFRESH_TOKEN', data.refresh_token]]);
    writeFileSync(ENV_PATH, updated);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
      `<!doctype html><html><head><meta charset="utf-8"><title>OK</title><style>body{font-family:system-ui;max-width:520px;margin:80px auto;text-align:center;color:#1a1a1e}h1{color:#0f8a5f}code{background:#f4f4f7;padding:2px 6px;border-radius:4px}</style></head><body><h1>&#10003; Listo</h1><p>El refresh_token se guardó en <code>.env</code>. Podés cerrar esta ventana.</p></body></html>`,
    );
    console.log('\n✓ refresh_token guardado en .env');
    console.log('\nAhora corré:');
    console.log('  sops -e --age <PUB_KEY> .env > .env.enc');
    console.log('para actualizar el vault, y reiniciá el server.');
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 200);
  } catch (e) {
    res.writeHead(500).end(String(e));
    console.error(e);
    server.close();
    process.exit(1);
  }
});

server.listen(8888, () => {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${authUrl}"`
      : process.platform === 'darwin'
        ? `open "${authUrl}"`
        : `xdg-open "${authUrl}"`;
  exec(cmd);
  console.log('Servidor escuchando en http://localhost:8888. Esperando redirect...');
});
