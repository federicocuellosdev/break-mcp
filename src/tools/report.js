import { z } from 'zod';
import { renderReport } from '../render/template.js';
import { renderDoc } from '../render/docTemplate.js';
import { assertAccess } from '../users.js';
import { saveReport } from '../web/publicReports.js';

const kpiSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
  sub: z.string().optional(),
  win: z.boolean().optional(),
});

const bandSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
  width: z.number().min(10).max(100).optional(),
  color: z.string().optional(),
});

const costSchema = z.object({ label: z.string(), value: z.string() });
const convSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(['good', 'bad']).optional(),
});

const barSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  prefix: z.string().optional(),
  pct: z.number().min(0).max(100).optional(),
  meta: z.string().optional(),
  variant: z.enum(['best', 'worst']).optional(),
});

const timelineItem = z.object({ date: z.string(), text: z.string() });
const factSchema = z.object({ value: z.union([z.string(), z.number()]), label: z.string() });
const leadSchema = z.object({ name: z.string(), detail: z.string().optional() });
const columnSchema = z.object({
  label: z.string(),
  count: z.union([z.string(), z.number()]),
  hot: z.boolean().optional(),
  leads: z.array(leadSchema).optional(),
});
const actionSchema = z.object({
  when: z.string(),
  title: z.string(),
  detail: z.string().optional(),
});
const decisionSchema = z.object({ title: z.string(), detail: z.string().optional() });

const slideSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('portada'),
    title: z.tuple([z.string(), z.string().optional()]).or(z.array(z.string())),
    eyebrow: z.string().optional(),
    lede: z.string().optional(),
    kpis: z.array(kpiSchema).max(4).optional(),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
  z.object({
    kind: z.literal('embudo'),
    title: z.array(z.string()),
    eyebrow: z.string().optional(),
    bands: z.array(bandSchema),
    costs: z.array(costSchema).optional(),
    conversions: z.array(convSchema).optional(),
    headers: z
      .object({
        costs: z.string().optional(),
        bands: z.string().optional(),
        conversions: z.string().optional(),
      })
      .optional(),
    key: z
      .object({
        pill: z.string().optional(),
        text: z.string().describe('Frase de cierre. Usá **texto** para bolds.'),
      })
      .optional(),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
  z.object({
    kind: z.literal('pauta'),
    title: z.array(z.string()),
    eyebrow: z.string().optional(),
    bars: z.array(barSchema),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
  z.object({
    kind: z.literal('venta'),
    title: z.array(z.string()),
    eyebrow: z.string().optional(),
    timeline: z.array(timelineItem).optional(),
    facts: z.array(factSchema).optional(),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
  z.object({
    kind: z.literal('pipeline'),
    title: z.array(z.string()),
    eyebrow: z.string().optional(),
    columns: z.array(columnSchema),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
  z.object({
    kind: z.literal('proximos'),
    title: z.array(z.string()),
    eyebrow: z.string().optional(),
    actions: z.array(actionSchema).optional(),
    decisions: z.array(decisionSchema).optional(),
    background: z.enum(['s-black', 's-white', 's-bg']).optional(),
  }),
]);

export function registerReportTools(server, ctx) {
  server.registerTool(
    'render_report',
    {
      title: 'Render an HTML report using the Azahares × Break template',
      description:
        'Builds a full HTML deck matching the brand template (6 slide kinds: portada, embudo, pauta, venta, pipeline, proximos). Provide the client slug (permission-checked) and an array of slides. Returns raw HTML you can save as .html.',
      inputSchema: {
        client: z.string().describe('Client slug (must be in your allowed list)'),
        contexto: z
          .string()
          .describe('Short uppercase context shown in the header, e.g. "Informe comercial · 25 jun → 10 sep 2026"'),
        title: z.string().optional().describe('Document <title>. Defaults to "<Client> · <contexto>"'),
        slides: z.array(slideSchema).min(1),
      },
    },
    async ({ client, contexto, title, slides }) => {
      assertAccess(ctx.user, client);
      const html = renderReport({
        cliente: { slug: client, name: client },
        contexto,
        title,
        slides,
      });
      return {
        content: [{ type: 'text', text: html }],
      };
    },
  );

  const blockSchema = z.union([
    z.string(),
    z.object({ kind: z.literal('p'), text: z.string() }),
    z.object({ kind: z.literal('h3'), text: z.string() }),
    z.object({ kind: z.literal('ul'), items: z.array(z.string()) }),
    z.object({ kind: z.literal('ol'), items: z.array(z.string()) }),
    z.object({ kind: z.literal('code'), text: z.string() }),
    z.object({
      kind: z.literal('callout'),
      text: z.string(),
      strong: z.string().optional(),
    }),
  ]);

  const cardSection = z.object({
    kind: z.literal('card'),
    title: z.string().optional(),
    tag: z.string().optional(),
    body: z.union([z.string(), z.array(blockSchema)]).optional(),
  });

  const calloutSection = z.object({
    kind: z.literal('callout'),
    text: z.string(),
    strong: z.string().optional(),
  });

  const flowSection = z.object({
    kind: z.literal('flow'),
    title: z.string().optional(),
    nodes: z.array(z.object({ title: z.string(), sub: z.string().optional() })),
    note: z.string().optional(),
  });

  const stepSection = z.object({
    kind: z.literal('steps'),
    title: z.string().optional(),
    items: z.array(
      z.object({
        title: z.string(),
        body: z.union([z.string(), z.array(blockSchema)]).optional(),
      }),
    ),
  });

  const tableSection = z.object({
    kind: z.literal('table'),
    title: z.string().optional(),
    headers: z.array(z.string()).optional(),
    rows: z.array(z.array(z.string())),
    note: z.string().optional(),
  });

  const docSectionSchema = z.union([
    cardSection,
    calloutSection,
    flowSection,
    stepSection,
    tableSection,
    z.object({
      kind: z.literal('tabs'),
      items: z.array(
        z.object({
          label: z.string(),
          sections: z.array(
            z.union([cardSection, calloutSection, flowSection, stepSection, tableSection]),
          ),
        }),
      ),
    }),
  ]);

  server.registerTool(
    'render_doc',
    {
      title: 'Render an internal doc / handoff using the Break doc template',
      description:
        'Builds an HTML document with the Break doc variant (columna angosta, accent pink sólido). Ideal para guías internas, handoffs y explicaciones de proceso. Section kinds: card, callout, flow, steps, table, tabs. If client is provided, it is permission-checked; if omitted, generates a client-agnostic doc (allowed for any authenticated user).',
      inputSchema: {
        client: z.string().optional().describe('Optional client slug for permission-scoped docs'),
        kicker: z.string().describe('Uppercase kicker line above the title, e.g. "Break · Sistema Paid Media"'),
        title: z.string(),
        sub: z.string().optional().describe('Subtitle / lead paragraph'),
        doc_title: z.string().optional().describe('HTML <title> tag; defaults to `title`'),
        footer: z.string().optional(),
        sections: z.array(docSectionSchema).min(1),
      },
    },
    async ({ client, kicker, title, sub, doc_title, footer, sections }) => {
      if (client) assertAccess(ctx.user, client);
      const html = renderDoc({
        cliente: client ? { slug: client, name: client } : null,
        kicker,
        title,
        sub,
        doc_title,
        footer,
        sections,
      });
      return { content: [{ type: 'text', text: html }] };
    },
  );

  const sourceSchema = z.object({
    platform: z.enum(['meta', 'gads', 'ga4', 'sheets', 'other']),
    account_id: z.string().optional().describe('Ad account / customer / property id used'),
    label: z.string().optional().describe('Human label shown to the client, ej. "Meta Ads · Preston"'),
    period: z.string().optional().describe('Range used, ej. "2026-08-01 → 2026-08-31"'),
  });

  server.registerTool(
    'publish_report',
    {
      title: 'Publish an HTML report to the client public gallery',
      description:
        'Uploads the given HTML to the server so it appears at mcp.breakmkt.com.ar/{client} as a card and at mcp.breakmkt.com.ar/{client}/{slug} as a full page. The server routes to the correct client folder based on the `client` slug and validates the user has access. Use this AFTER the user reviewed the local file and said "publicar / subir". Author is inferred from the bearer token.',
      inputSchema: {
        client: z.string().describe('Client slug (must be in your allowed list) — the server uses this to route to the right public folder'),
        slug: z.string().describe('URL slug for the report (kebab-case, ej. "informe-septiembre-2026")'),
        title: z.string().describe('Human title for the gallery card, ej. "Informe septiembre 2026"'),
        description: z.string().optional().describe('One-line summary shown on the card'),
        sources: z.array(sourceSchema).optional().describe('Data sources that fed this report (Meta / Google Ads / GA4 / Sheets). Multiple platforms per report are expected.'),
        html: z.string().describe('Full standalone HTML of the report'),
      },
    },
    async ({ client, slug, title, description, sources, html }) => {
      assertAccess(ctx.user, client);
      const base = (process.env.MCP_URL || 'https://mcp.breakmkt.com.ar').replace(/\/+$/, '').replace(/\/mcp$/, '');
      const saved = saveReport({
        clientSlug: client,
        reportSlug: slug,
        title,
        description,
        sources,
        html,
        author: { id: ctx.user.id, name: ctx.user.name },
      });
      const url = `${base}/${client}/${saved.slug}`;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: true, url, gallery_url: `${base}/${client}`, ...saved }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'list_published_reports',
    {
      title: 'List reports already published for a client',
      description: 'Returns the reports currently visible in the client public gallery so you can avoid slug collisions or reuse a slug to update.',
      inputSchema: {
        client: z.string().describe('Client slug (must be in your allowed list)'),
      },
    },
    async ({ client }) => {
      assertAccess(ctx.user, client);
      const { reportsForClient } = await import('../web/publicReports.js');
      const items = reportsForClient(client).map((r) => ({
        slug: r.slug,
        title: r.title,
        description: r.description,
        author: r.author_name,
        published_at: r.published_at,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
    },
  );
}
