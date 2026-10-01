import { z } from 'zod';
import { resolveGa4PropertyId, getClient } from '../clients.js';
import { assertAccess, allowedClientSlugs } from '../users.js';
import { runReport, runRealtime, getMetadata } from '../providers/ga4.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

function resolveProperty(ctx, { client, property_id }) {
  if (client) assertAccess(ctx.user, client);
  const pid = resolveGa4PropertyId({ client, property_id });
  if (!client && property_id) {
    const allowed = allowedClientSlugs(ctx.user);
    if (allowed !== null) {
      const linked = allowed.some((slug) => {
        try {
          const c = getClient(slug);
          const ids = c.ga4_properties || (c.ga4_property_id ? [c.ga4_property_id] : []);
          return ids.map(String).includes(String(pid));
        } catch { return false; }
      });
      if (!linked) throw new Error(`property_id ${pid} is not linked to any client you can access.`);
    }
  }
  return pid;
}

export function registerGa4Tools(server, ctx) {
  server.registerTool(
    'ga4_metadata',
    {
      title: 'GA4 property metadata (available dimensions and metrics)',
      description:
        'Returns dimensions and metrics available for a GA4 property. Use this to discover what you can query.',
      inputSchema: {
        client: z.string().optional(),
        property_id: z.string().optional().describe('Numeric GA4 property id, e.g. 123456789'),
      },
    },
    async ({ client, property_id }) => {
      const pid = resolveProperty(ctx, { client, property_id });
      const data = await getMetadata({ propertyId: pid });
      return asText(data);
    },
  );

  server.registerTool(
    'ga4_run_report',
    {
      title: 'Run a GA4 report (read-only)',
      description:
        'Runs a GA4 Data API runReport. Provide dimensions, metrics, dateRanges. Statistical only — no user-level or PII data is exposed.',
      inputSchema: {
        client: z.string().optional(),
        property_id: z.string().optional(),
        dimensions: z
          .array(z.string())
          .optional()
          .describe('Dimension names, e.g. ["date","sessionDefaultChannelGroup"]'),
        metrics: z
          .array(z.string())
          .describe('Metric names, e.g. ["sessions","totalUsers","conversions"]'),
        date_ranges: z
          .array(z.object({ startDate: z.string(), endDate: z.string(), name: z.string().optional() }))
          .optional()
          .describe('Defaults to last 7 days if omitted'),
        limit: z.number().int().min(1).max(10000).optional(),
        order_by: z.array(z.record(z.any())).optional().describe('Raw GA4 orderBys array'),
      },
    },
    async ({ client, property_id, dimensions, metrics, date_ranges, limit, order_by }) => {
      const pid = resolveProperty(ctx, { client, property_id });
      const body = {
        dimensions: (dimensions || []).map((name) => ({ name })),
        metrics: (metrics || []).map((name) => ({ name })),
        dateRanges: date_ranges && date_ranges.length
          ? date_ranges
          : [{ startDate: '7daysAgo', endDate: 'today' }],
      };
      if (limit) body.limit = limit;
      if (order_by) body.orderBys = order_by;
      const data = await runReport({ propertyId: pid, body });
      return asText(data);
    },
  );

  server.registerTool(
    'ga4_realtime',
    {
      title: 'Run a GA4 realtime report',
      description: 'Realtime users and events in the last 30 minutes.',
      inputSchema: {
        client: z.string().optional(),
        property_id: z.string().optional(),
        dimensions: z.array(z.string()).optional(),
        metrics: z.array(z.string()).describe('Metric names, e.g. ["activeUsers"]'),
      },
    },
    async ({ client, property_id, dimensions, metrics }) => {
      const pid = resolveProperty(ctx, { client, property_id });
      const body = {
        dimensions: (dimensions || []).map((name) => ({ name })),
        metrics: (metrics || []).map((name) => ({ name })),
      };
      const data = await runRealtime({ propertyId: pid, body });
      return asText(data);
    },
  );
}
