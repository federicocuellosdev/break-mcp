const API_VERSION = process.env.GADS_API_VERSION || 'v18';

let cachedToken = null;
let cachedExpires = 0;

async function accessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpires - 60_000) return cachedToken;

  const clientId = process.env.GADS_CLIENT_ID;
  const clientSecret = process.env.GADS_CLIENT_SECRET;
  const refreshToken = process.env.GADS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Ads OAuth not configured (GADS_CLIENT_ID, GADS_CLIENT_SECRET, GADS_REFRESH_TOKEN)',
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `Google Ads OAuth refresh failed: ${json.error_description || json.error || res.status}`,
    );
  }
  cachedToken = json.access_token;
  cachedExpires = now + json.expires_in * 1000;
  return cachedToken;
}

function headers(extra = {}) {
  const developerToken = process.env.GADS_DEVELOPER_TOKEN;
  if (!developerToken) throw new Error('GADS_DEVELOPER_TOKEN not set');
  return {
    'developer-token': developerToken,
    ...(process.env.GADS_LOGIN_CUSTOMER_ID
      ? { 'login-customer-id': String(process.env.GADS_LOGIN_CUSTOMER_ID).replace(/-/g, '') }
      : {}),
    ...extra,
  };
}

const cleanId = (id) => String(id).replace(/-/g, '');

export async function listMccChildren() {
  const mcc = process.env.GADS_LOGIN_CUSTOMER_ID;
  if (!mcc) throw new Error('GADS_LOGIN_CUSTOMER_ID not set');
  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.status,
      customer_client.manager,
      customer_client.level
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'
    ORDER BY customer_client.descriptive_name
  `.trim();
  const data = await runSearch({ customerId: mcc, query });
  return (data.results || [])
    .map((r) => r.customerClient || {})
    .filter((c) => c.id && !c.manager)
    .map((c) => ({
      id: String(c.id),
      name: c.descriptiveName || `Customer ${c.id}`,
      currency: c.currencyCode || '',
      level: c.level,
    }));
}

export async function listAccessibleCustomers() {
  const token = await accessToken();
  const res = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers:listAccessibleCustomers`,
    { headers: { authorization: `Bearer ${token}`, ...headers() } },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Google Ads API error: ${JSON.stringify(json)}`);
  return json;
}

const FORBIDDEN = /\b(update|create|mutate|remove|delete)\b/i;

export async function runSearch({ customerId, query }) {
  if (FORBIDDEN.test(query)) {
    throw new Error('Google Ads mutations are blocked. Only SELECT queries are allowed.');
  }
  const token = await accessToken();
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${cleanId(customerId)}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...headers(),
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google Ads API error: ${JSON.stringify(json)}`);
  return json;
}
