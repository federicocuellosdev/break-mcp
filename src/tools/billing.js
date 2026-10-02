import { z } from 'zod';
import { listClients } from '../clients.js';
import { isAdminOrDev } from '../users.js';
import { runSearch } from '../providers/gads.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

const META_ACCOUNT_STATUS = {
  1: { label: 'ACTIVE', billing: 'ok' },
  2: { label: 'DISABLED', billing: 'warn' },
  3: { label: 'UNSETTLED', billing: 'bad' },
  7: { label: 'PENDING_RISK_REVIEW', billing: 'warn' },
  8: { label: 'PENDING_SETTLEMENT', billing: 'bad' },
  9: { label: 'IN_GRACE_PERIOD', billing: 'warn' },
  100: { label: 'PENDING_CLOSURE', billing: 'warn' },
  101: { label: 'CLOSED', billing: 'bad' },
  201: { label: 'ACTIVE', billing: 'ok' },
  202: { label: 'CLOSED', billing: 'bad' },
};

const META_DISABLE_REASON = {
  0: 'NONE',
  1: 'ADS_INTEGRITY_POLICY',
  2: 'ADS_IP_REVIEW',
  3: 'RISK_PAYMENT',
  4: 'GRAY_ACCOUNT_SHUT_DOWN',
  5: 'ADS_AFC_REVIEW',
  6: 'BUSINESS_INTEGRITY_RAR',
  7: 'PERMANENT_CLOSE',
  8: 'UNUSED_RESELLER_ACCOUNT',
  9: 'UNUSED_ACCOUNT',
};

async function metaGraph(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
  const ver = process.env.META_GRAPH_VERSION || 'v21.0';
  const url = new URL(`https://graph.facebook.com/${ver}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}

async function checkMeta() {
  const bmId = process.env.META_BUSINESS_ID;
  if (!bmId) return { configured: false, reason: 'META_BUSINESS_ID not set', accounts: [] };
  const fields = 'id,account_id,name,currency,account_status,disable_reason,balance,funding_source_details';
  const [owned, client] = await Promise.all([
    metaGraph(`/${bmId}/owned_ad_accounts`, { fields, limit: 200 }),
    metaGraph(`/${bmId}/client_ad_accounts`, { fields, limit: 200 }),
  ]);
  const map = (kind) => (a) => {
    const s = META_ACCOUNT_STATUS[a.account_status] || { label: `UNKNOWN(${a.account_status})`, billing: 'warn' };
    const disable = a.disable_reason != null && a.disable_reason !== 0
      ? META_DISABLE_REASON[a.disable_reason] || `CODE_${a.disable_reason}`
      : null;
    const funding = a.funding_source_details?.display_string || null;
    return {
      kind,
      id: a.id,
      name: a.name,
      currency: a.currency,
      status: s.label,
      billing: disable === 'RISK_PAYMENT' ? 'bad' : s.billing,
      disable_reason: disable,
      balance: a.balance ? Number(a.balance) / 100 : null,
      funding_source: funding,
    };
  };
  return {
    configured: true,
    accounts: [
      ...(owned.data || []).map(map('owned')),
      ...(client.data || []).map(map('client')),
    ],
  };
}

async function checkGads() {
  const notReady =
    !process.env.GADS_DEVELOPER_TOKEN ||
    !process.env.GADS_CLIENT_ID ||
    !process.env.GADS_REFRESH_TOKEN ||
    !process.env.GADS_LOGIN_CUSTOMER_ID;
  if (notReady) return { configured: false, reason: 'Google Ads env vars missing', accounts: [] };

  const mcc = process.env.GADS_LOGIN_CUSTOMER_ID;
  const mccChildren = await runSearch({
    customerId: mcc,
    query: `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.status,
        customer_client.currency_code,
        customer_client.manager
      FROM customer_client
      WHERE customer_client.level <= 1
    `,
  });
  const children = (mccChildren.results || [])
    .map((r) => r.customerClient || r.customer_client)
    .filter((c) => c && c.manager === false);

  const accounts = await Promise.all(
    children.map(async (c) => {
      const cid = String(c.id);
      let billingStatus = null;
      let billingNote = null;
      try {
        const bs = await runSearch({
          customerId: cid,
          query: `
            SELECT
              billing_setup.id,
              billing_setup.status,
              billing_setup.payments_account_info.payments_account_name
            FROM billing_setup
          `,
        });
        const rows = (bs.results || []).map((r) => r.billingSetup || r.billing_setup).filter(Boolean);
        const active = rows.find((b) => b.status === 'APPROVED') || rows[0];
        billingStatus = active ? active.status : 'NONE';
        billingNote = active?.paymentsAccountInfo?.paymentsAccountName
          || active?.payments_account_info?.payments_account_name
          || null;
      } catch (e) {
        billingStatus = 'ERROR';
        billingNote = e.message;
      }

      // Detectar "pago vencido": Google Ads sigue mostrando el customer como ENABLED
      // y el billing_setup como APPROVED aunque haya deuda. La única señal visible via
      // API es que las campañas marcadas ENABLED no están sirviendo (serving_status
      // SUSPENDED, ENDED o NONE), lo cual se puede inspeccionar en campaign.
      let servingIssue = null;
      try {
        const camp = await runSearch({
          customerId: cid,
          query: `
            SELECT campaign.id, campaign.status, campaign.serving_status
            FROM campaign
            WHERE campaign.status = 'ENABLED'
            LIMIT 100
          `,
        });
        const campRows = (camp.results || []).map((r) => r.campaign).filter(Boolean);
        if (campRows.length) {
          const notServing = campRows.filter((cp) => {
            const ss = cp.servingStatus || cp.serving_status;
            return ss && ss !== 'SERVING';
          });
          // Si la mayoría (>=80%) de campañas enabled no están sirviendo, es señal de billing issue
          if (notServing.length && notServing.length / campRows.length >= 0.8) {
            servingIssue = `${notServing.length}/${campRows.length} campañas no están sirviendo (posible pago vencido)`;
          }
        }
      } catch {}

      let billingFlag = 'ok';
      if (c.status === 'SUSPENDED' || c.status === 'CLOSED' || c.status === 'CANCELED') billingFlag = 'bad';
      else if (billingStatus === 'NONE' || billingStatus === 'CANCELLED') billingFlag = 'bad';
      else if (servingIssue) billingFlag = 'bad';
      else if (billingStatus === 'PENDING' || billingStatus === 'APPROVED_HELD') billingFlag = 'warn';
      else if (billingStatus === 'ERROR') billingFlag = 'warn';

      return {
        id: cid,
        name: c.descriptiveName || c.descriptive_name || '',
        currency: c.currencyCode || c.currency_code || null,
        status: c.status,
        billing: billingFlag,
        billing_setup_status: billingStatus,
        billing_account: billingNote,
        serving_issue: servingIssue,
      };
    }),
  );
  return { configured: true, accounts };
}

export async function checkBillingSummary() {
  const [meta, gads] = await Promise.all([
    checkMeta().catch((e) => ({ configured: true, error: e.message, accounts: [] })),
    checkGads().catch((e) => ({ configured: true, error: e.message, accounts: [] })),
  ]);
  const metaMap = {};
  for (const a of meta.accounts || []) {
    metaMap[a.id] = {
      status: a.status,
      billing: a.billing,
      funding: a.funding_source,
      disable_reason: a.disable_reason,
    };
  }
  const gadsMap = {};
  for (const a of gads.accounts || []) {
    gadsMap[a.id] = {
      status: a.status,
      billing: a.billing,
      billing_setup: a.billing_setup_status,
      funding: a.billing_account,
      serving_issue: a.serving_issue || null,
    };
  }
  return {
    meta: { configured: meta.configured !== false, error: meta.error || null, accounts: metaMap },
    gads: { configured: gads.configured !== false, error: gads.error || null, accounts: gadsMap },
  };
}

function matchClient(platform, accountId, clients) {
  return clients.find((c) => {
    if (platform === 'meta') {
      const ids = c.meta_ad_accounts || (c.meta_ad_account_id ? [c.meta_ad_account_id] : []);
      return ids.some((x) => String(x) === String(accountId));
    }
    if (platform === 'gads') {
      const ids = c.gads_customers || (c.gads_customer_id ? [c.gads_customer_id] : []);
      return ids.some((x) => String(x) === String(accountId));
    }
    return false;
  });
}

export function registerBillingTools(server, ctx) {
  server.registerTool(
    'check_billing_status',
    {
      title: 'Check billing / payment status across all Meta and Google Ads accounts',
      description:
        'Read-only sweep over every ad account in the Meta Business Manager and every customer under the Google Ads MCC. Flags payment issues (unpaid, suspended, no active billing setup). For each account returns status, billing flag (ok/warn/bad), funding source and the client slug it is linked to (if any). Admin or dev role required.',
      inputSchema: {
        platform: z
          .enum(['meta', 'gads', 'both'])
          .optional()
          .describe('Default both. Use "meta" or "gads" to limit the sweep.'),
        only_issues: z
          .boolean()
          .optional()
          .describe('If true, return only accounts flagged as warn or bad.'),
      },
    },
    async ({ platform = 'both', only_issues = false }) => {
      if (!isAdminOrDev(ctx.user)) {
        throw new Error('check_billing_status requires admin or dev role.');
      }
      const clients = listClients();
      const out = { meta: null, gads: null, generated_at: new Date().toISOString() };

      if (platform === 'meta' || platform === 'both') {
        try {
          const meta = await checkMeta();
          meta.accounts = meta.accounts.map((a) => {
            const client = matchClient('meta', a.id, clients);
            return { ...a, client: client ? { slug: client.slug, name: client.name } : null };
          });
          if (only_issues) meta.accounts = meta.accounts.filter((a) => a.billing !== 'ok');
          out.meta = meta;
        } catch (e) {
          out.meta = { configured: true, error: e.message, accounts: [] };
        }
      }

      if (platform === 'gads' || platform === 'both') {
        try {
          const gads = await checkGads();
          gads.accounts = gads.accounts.map((a) => {
            const client = matchClient('gads', a.id, clients);
            return { ...a, client: client ? { slug: client.slug, name: client.name } : null };
          });
          if (only_issues) gads.accounts = gads.accounts.filter((a) => a.billing !== 'ok');
          out.gads = gads;
        } catch (e) {
          out.gads = { configured: true, error: e.message, accounts: [] };
        }
      }

      const summary = {
        meta_total: out.meta?.accounts?.length ?? 0,
        meta_issues: (out.meta?.accounts || []).filter((a) => a.billing !== 'ok').length,
        gads_total: out.gads?.accounts?.length ?? 0,
        gads_issues: (out.gads?.accounts || []).filter((a) => a.billing !== 'ok').length,
      };
      return asText({ summary, ...out });
    },
  );
}
