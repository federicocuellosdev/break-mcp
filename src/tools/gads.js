import { z } from 'zod';
import { resolveGadsCustomerId } from '../clients.js';
import { assertAccess, isAdminOrDev } from '../users.js';
import { listAccessibleCustomers, runSearch } from '../providers/gads.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

function resolveCustomer(ctx, { client, customer_id }) {
  if (client) assertAccess(ctx.user, client);
  return resolveGadsCustomerId({ client, customer_id });
}

export function registerGadsTools(server, ctx) {
  server.registerTool(
    'gads_list_accessible_customers',
    {
      title: 'List Google Ads accounts accessible to the agency MCC',
      description:
        'Returns the list of customer ids reachable via the configured MCC login-customer-id.',
      inputSchema: {},
    },
    async () => {
      if (!isAdminOrDev(ctx.user)) {
        throw new Error('gads_list_accessible_customers requires admin or dev role.');
      }
      const data = await listAccessibleCustomers();
      return asText(data);
    },
  );

  server.registerTool(
    'gads_run_query',
    {
      title: 'Run a read-only GAQL query',
      description:
        'Executes a GAQL SELECT query against a client account. Mutations are blocked. Provide client (slug) or customer_id.',
      inputSchema: {
        client: z.string().optional(),
        customer_id: z.string().optional(),
        query: z
          .string()
          .describe(
            'GAQL query, e.g. "SELECT campaign.id, campaign.name, metrics.cost_micros FROM campaign WHERE segments.date DURING LAST_7_DAYS"',
          ),
      },
    },
    async ({ client, customer_id, query }) => {
      const cid = resolveCustomer(ctx, { client, customer_id });
      const data = await runSearch({ customerId: cid, query });
      return asText(data);
    },
  );

  server.registerTool(
    'gads_campaign_performance',
    {
      title: 'Campaign performance summary',
      description:
        'Convenience wrapper around gads_run_query that returns campaigns with cost, clicks, impressions, conversions for a date range.',
      inputSchema: {
        client: z.string().optional(),
        customer_id: z.string().optional(),
        date_range: z
          .string()
          .optional()
          .describe('GAQL date literal, e.g. LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH'),
        since: z.string().optional().describe('YYYY-MM-DD'),
        until: z.string().optional().describe('YYYY-MM-DD'),
      },
    },
    async ({ client, customer_id, date_range = 'LAST_7_DAYS', since, until }) => {
      const cid = resolveCustomer(ctx, { client, customer_id });
      const where =
        since && until
          ? `segments.date BETWEEN '${since}' AND '${until}'`
          : `segments.date DURING ${date_range}`;
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE ${where}
        ORDER BY metrics.cost_micros DESC
      `.trim();
      const data = await runSearch({ customerId: cid, query });
      return asText(data);
    },
  );
}
