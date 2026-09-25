import { z } from 'zod';
import { resolveMetaAdAccount, getClient } from '../clients.js';
import { assertAccess, allowedClientSlugs } from '../users.js';

const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

async function graph(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
  const url = new URL(`${GRAPH()}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    const msg = body.error?.message || `HTTP ${res.status}`;
    const code = body.error?.code;
    throw new Error(`Meta API error${code ? ` (${code})` : ''}: ${msg}`);
  }
  return body;
}

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

function resolveAndAuthorizeAct(ctx, { client, ad_account_id }) {
  if (client) assertAccess(ctx.user, client);
  const act = resolveMetaAdAccount({ client, ad_account_id });
  if (!client && ad_account_id) {
    const allowed = allowedClientSlugs(ctx.user);
    if (allowed !== null) {
      const match = allowed.find((slug) => {
        try {
          return getClient(slug).meta_ad_account_id === ad_account_id;
        } catch {
          return false;
        }
      });
      if (!match) {
        throw new Error(
          `ad_account_id ${ad_account_id} is not linked to any client you can access`,
        );
      }
    }
  }
  return act;
}

export function registerMetaTools(server, ctx) {
  server.registerTool(
    'meta_list_ad_accounts',
    {
      title: 'List ad accounts under the Business Manager',
      description:
        'Returns all owned + client ad accounts visible to META_BUSINESS_ID. Each item includes id (act_...), name, currency, account_status.',
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe('Page size, default 100'),
      },
    },
    async ({ limit = 100 }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('meta_list_ad_accounts is admin-only. Use list_clients to see your accessible accounts.');
      }
      const bmId = process.env.META_BUSINESS_ID;
      if (!bmId) throw new Error('META_BUSINESS_ID not set');
      const fields = 'id,account_id,name,currency,account_status,timezone_name';
      const [owned, client] = await Promise.all([
        graph(`/${bmId}/owned_ad_accounts`, { fields, limit }),
        graph(`/${bmId}/client_ad_accounts`, { fields, limit }),
      ]);
      return asText({
        owned: owned.data || [],
        client: client.data || [],
      });
    },
  );

  server.registerTool(
    'meta_list_campaigns',
    {
      title: 'List campaigns for an ad account',
      description:
        'Returns campaigns of an ad account with basic status and objective. Pass either client (slug from list_clients) or ad_account_id (act_...).',
      inputSchema: {
        client: z.string().optional().describe('Client slug from list_clients'),
        ad_account_id: z
          .string()
          .optional()
          .describe('Ad account id including the act_ prefix'),
        limit: z.number().int().min(1).max(200).optional(),
        effective_status: z
          .array(z.string())
          .optional()
          .describe('Filter, e.g. ["ACTIVE","PAUSED"]'),
      },
    },
    async ({ client, ad_account_id, limit = 50, effective_status }) => {
      const actId = resolveAndAuthorizeAct(ctx, { client, ad_account_id });
      const fields = 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time';
      const params = { fields, limit };
      if (effective_status?.length) params.effective_status = effective_status;
      const data = await graph(`/${actId}/campaigns`, params);
      return asText(data);
    },
  );

  server.registerTool(
    'meta_get_insights',
    {
      title: 'Get Meta ads insights',
      description:
        'Insights for an ad account, campaign, adset or ad. For account-level use client (slug) or entity_id=act_...; for other levels pass the entity_id directly. Date range via time_range {since,until} in YYYY-MM-DD or date_preset (e.g. last_7d, last_30d, this_month).',
      inputSchema: {
        client: z
          .string()
          .optional()
          .describe('Client slug (only valid when level=account, resolves to act_...)'),
        entity_id: z
          .string()
          .optional()
          .describe('act_..., campaign id, adset id or ad id'),
        level: z
          .enum(['account', 'campaign', 'adset', 'ad'])
          .describe('Aggregation level of the report'),
        fields: z
          .array(z.string())
          .optional()
          .describe(
            'Insights fields, e.g. ["spend","impressions","clicks","ctr","cpc","actions"]',
          ),
        time_range: z
          .object({ since: z.string(), until: z.string() })
          .optional(),
        date_preset: z.string().optional(),
        breakdowns: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      },
    },
    async ({ client, entity_id, level, fields, time_range, date_preset, breakdowns, limit = 100 }) => {
      let id = entity_id;
      if (!id) {
        if (level !== 'account') {
          throw new Error('entity_id is required when level is not "account"');
        }
        id = resolveAndAuthorizeAct(ctx, { client });
      } else if (level === 'account') {
        id = resolveAndAuthorizeAct(ctx, { client, ad_account_id: entity_id });
      } else if (client) {
        assertAccess(ctx.user, client);
      }
      const params = {
        level,
        fields: (fields && fields.length
          ? fields
          : ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'reach']
        ).join(','),
        limit,
      };
      if (time_range) params.time_range = time_range;
      else if (date_preset) params.date_preset = date_preset;
      else params.date_preset = 'last_7d';
      if (breakdowns?.length) params.breakdowns = breakdowns.join(',');

      const data = await graph(`/${id}/insights`, params);
      return asText(data);
    },
  );

  server.registerTool(
    'meta_graph_get',
    {
      title: 'Raw Meta Graph GET',
      description:
        'Escape hatch: perform an arbitrary GET on the Graph API. Use for endpoints not yet wrapped as dedicated tools.',
      inputSchema: {
        path: z
          .string()
          .describe('Path starting with /, e.g. /act_123/adsets'),
        params: z.record(z.any()).optional(),
      },
    },
    async ({ path, params = {} }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('meta_graph_get is admin-only (bypasses client-level access checks).');
      }
      if (!path.startsWith('/')) throw new Error('path must start with /');
      const data = await graph(path, params);
      return asText(data);
    },
  );
}
