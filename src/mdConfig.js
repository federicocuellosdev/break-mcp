import { listClients } from './clients.js';
import { allowedClientSlugs } from './users.js';

const TOOLS = [
  { name: 'list_clients', desc: 'Ver a qué clientes podés acceder' },
  { name: 'meta_list_campaigns', desc: 'Campañas Meta Ads del cliente' },
  { name: 'meta_get_insights', desc: 'Insights (spend, impresiones, clicks, CTR, CPC, conversions)' },
  { name: 'gads_run_query', desc: 'Query GAQL read-only a Google Ads' },
  { name: 'gads_campaign_performance', desc: 'Resumen de campañas Google Ads por rango de fechas' },
  { name: 'ga4_run_report', desc: 'Reporte GA4 (dimensiones + métricas)' },
  { name: 'ga4_realtime', desc: 'Usuarios y eventos GA4 en tiempo real (30 min)' },
  { name: 'sheets_read_range', desc: 'Leer un rango A1 de una planilla' },
  { name: 'sheets_append_rows', desc: 'Escribir filas al final de una planilla' },
  { name: 'render_report', desc: 'Generar informe deck (plantilla Azahares)' },
  { name: 'render_doc', desc: 'Generar doc/handoff (plantilla Nodo)' },
];

export function generateUserMd({ user, mcpUrl }) {
  const clients = listClients();
  const allowed = allowedClientSlugs(user);
  const visible = allowed === null ? clients : clients.filter((c) => allowed.includes(c.slug));

  const clientLines = visible.length
    ? visible
        .map(
          (c) =>
            `- **${c.name}** (\`${c.slug}\`) — Meta: ${c.meta_ad_account_id ? `\`${c.meta_ad_account_id}\`` : '_pendiente_'} · Google Ads: ${c.gads_customer_id ? `\`${c.gads_customer_id}\`` : '_pendiente_'} · GA4: ${c.ga4_property_id ? `\`${c.ga4_property_id}\`` : '_pendiente_'}`,
        )
        .join('\n')
    : '_(sin clientes asignados — pedile al admin que te habilite)_';

  const toolLines = TOOLS.map((t) => `- \`${t.name}\` — ${t.desc}`).join('\n');

  const mcpJsonSnippet = JSON.stringify(
    {
      mcpServers: {
        'break-mcp': {
          type: 'http',
          url: mcpUrl,
          headers: { Authorization: `Bearer ${user.token}` },
        },
      },
    },
    null,
    2,
  );

  const cliSnippet = `claude mcp add --transport http break-mcp ${mcpUrl} --header "Authorization: Bearer ${user.token}"`;

  return `# break-mcp — ${user.name}

Usuario: \`${user.id}\`${user.email ? ` · ${user.email}` : ''}
Rol: \`${user.role}\`
Endpoint: \`${mcpUrl}\`

## Instalación

### Opción A · CLI de Claude Code

\`\`\`bash
${cliSnippet}
\`\`\`

### Opción B · Editar settings.json

Agregá esto a \`~/.claude/settings.json\` (mergéalo si ya existe la clave \`mcpServers\`):

\`\`\`json
${mcpJsonSnippet}
\`\`\`

## Clientes a los que podés acceder

${clientLines}

## Tools disponibles

${toolLines}

## Cómo lo uso

Después de registrar el MCP, en cualquier conversación con Claude Code podés pedir:

- _"Con break-mcp, listame mis clientes"_
- _"Traé las campañas activas de Preston en Meta"_
- _"Insights de los últimos 30 días para el ad account de Preston, por día"_
- _"Corré una query GAQL a Google Ads de Preston: total spend por campaña de los últimos 7 días"_
- _"Corré un report GA4 de Preston: sessions y conversions por canal, últimos 30 días"_
- _"Con todo eso, armame un informe usando render_report para Preston"_

## Reglas

- Cada tool valida que tengas permiso al cliente antes de consultar la API.
- Google Ads y GA4 son **read-only estricto** (por bloqueos de cuenta): solo SELECT y runReport.
- Este archivo contiene tu bearer token. Tratalo como un password: no lo commitees, no lo compartas.

---
_Regenerá este archivo cuando cambien tus permisos o clientes disponibles: desde el panel admin, sección **Mi config MCP**._
`;
}
