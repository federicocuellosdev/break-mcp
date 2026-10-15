import { google } from 'googleapis';

let cachedAuth = null;

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  cachedAuth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return cachedAuth;
}

async function bearer() {
  const auth = getAuth();
  const { access_token } = await auth.authorize();
  return access_token;
}

const BASE = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';

async function post(url, body) {
  const token = await bearer();
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GA4 API error: ${JSON.stringify(json)}`);
  return json;
}

async function get(url) {
  const token = await bearer();
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`GA4 API error: ${JSON.stringify(json)}`);
  return json;
}

export async function runReport({ propertyId, body }) {
  return post(`${BASE}/properties/${propertyId}:runReport`, body);
}

export async function runRealtime({ propertyId, body }) {
  return post(`${BASE}/properties/${propertyId}:runRealtimeReport`, body);
}

export async function getMetadata({ propertyId }) {
  return get(`${BASE}/properties/${propertyId}/metadata`);
}

export async function listProperties({ accountId }) {
  const filter = accountId ? `?filter=parent:accounts/${accountId}` : '';
  return get(`${ADMIN}/properties${filter}`);
}

export async function listAccountSummaries() {
  return get(`${ADMIN}/accountSummaries?pageSize=200`);
}

// Chequea si una property recibió datos en los últimos N días.
// Devuelve: { ok, sessions, last_date, days }  ·  tira error si falla API/auth.
export async function recentActivity({ propertyId, days = 3 }) {
  const body = {
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }],
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: true }],
    limit: 10,
  };
  const data = await post(`${BASE}/properties/${propertyId}:runReport`, body);
  const rows = data.rows || [];
  let total = 0;
  let lastDate = null;
  for (const r of rows) {
    const v = Number(r.metricValues?.[0]?.value || 0);
    total += v;
    if (v > 0 && !lastDate) lastDate = r.dimensionValues?.[0]?.value || null;
  }
  return { ok: true, sessions: total, last_date: lastDate, days };
}
