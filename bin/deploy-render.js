#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const RENDER_TOKEN = process.env.RENDER_TOKEN;
if (!RENDER_TOKEN) {
  console.error('RENDER_TOKEN required in env');
  process.exit(1);
}

const OWNER_ID = 'tea-d3fvmvali9vc73ep907g';
const REPO = 'https://github.com/federicocuellosdev/break-mcp';
const BRANCH = 'main';
const NAME = 'break-mcp';

function parseEnv(text) {
  const m = new Map();
  text.split(/\r?\n/).forEach((line) => {
    const t = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (t) m.set(t[1], t[2]);
  });
  return m;
}

const env = parseEnv(readFileSync('.env', 'utf8'));
const users = JSON.stringify(JSON.parse(readFileSync('config/users.json', 'utf8')));

const envVars = [
  { key: 'NODE_VERSION', value: '20' },
  { key: 'MCP_SESSION_SECRET', generateValue: true },
  { key: 'MCP_USERS_JSON', value: users },
  { key: 'META_GRAPH_VERSION', value: env.get('META_GRAPH_VERSION') || 'v21.0' },
  { key: 'META_ACCESS_TOKEN', value: env.get('META_ACCESS_TOKEN') || '' },
  { key: 'META_BUSINESS_ID', value: env.get('META_BUSINESS_ID') || '' },
  { key: 'GADS_DEVELOPER_TOKEN', value: env.get('GADS_DEVELOPER_TOKEN') || '' },
  { key: 'GADS_CLIENT_ID', value: env.get('GADS_CLIENT_ID') || '' },
  { key: 'GADS_CLIENT_SECRET', value: env.get('GADS_CLIENT_SECRET') || '' },
  { key: 'GADS_REFRESH_TOKEN', value: env.get('GADS_REFRESH_TOKEN') || '' },
  { key: 'GADS_LOGIN_CUSTOMER_ID', value: env.get('GADS_LOGIN_CUSTOMER_ID') || '' },
  { key: 'GADS_API_VERSION', value: env.get('GADS_API_VERSION') || 'v25' },
  { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', value: env.get('GOOGLE_SERVICE_ACCOUNT_JSON') || '' },
];

const payload = {
  type: 'web_service',
  name: NAME,
  ownerId: OWNER_ID,
  repo: REPO,
  autoDeploy: 'yes',
  branch: BRANCH,
  serviceDetails: {
    env: 'node',
    plan: 'starter',
    region: 'oregon',
    envSpecificDetails: {
      buildCommand: 'npm install',
      startCommand: 'node src/index.js',
    },
    healthCheckPath: '/health',
    numInstances: 1,
  },
  envVars,
};

const r = await fetch('https://api.render.com/v1/services', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${RENDER_TOKEN}`,
    'content-type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify(payload),
});
const data = await r.json();
if (!r.ok) {
  console.error('HTTP', r.status);
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

const svc = data.service || data;
console.log('OK — service created');
console.log('id:  ', svc.id);
console.log('name:', svc.name);
console.log('url: ', svc.serviceDetails?.url || svc.service?.serviceDetails?.url);
console.log('deployId:', data.deployId);
