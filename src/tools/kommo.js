import { z } from 'zod';
import { assertAccess } from '../users.js';
import { listPipelines, listLeads } from '../providers/kommo.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerKommoTools(server, ctx) {
  server.registerTool(
    'kommo_list_pipelines',
    {
      title: 'Listar embudos y etapas de Kommo del cliente',
      description:
        'Devuelve los pipelines (embudos) de Kommo del cliente, cada uno con sus statuses (etapas). Usá esto primero para descubrir pipeline_id / status_id antes de llamar a kommo_list_leads.',
      inputSchema: {
        client: z.string().describe('Slug del cliente (debe tener Kommo conectado en el panel admin)'),
      },
    },
    async ({ client }) => {
      assertAccess(ctx.user, client);
      const data = await listPipelines(client);
      return asText({ client, pipelines: data });
    },
  );

  server.registerTool(
    'kommo_list_leads',
    {
      title: 'Listar leads de Kommo del cliente',
      description:
        'Devuelve leads del Kommo del cliente con filtros opcionales de embudo y rango de fechas de creación. Cada lead incluye id, nombre, pipeline y etapa (nombres), tags, monto (price), fecha de creación, cierre y actualización. Soporta paginación.',
      inputSchema: {
        client: z.string().describe('Slug del cliente'),
        pipeline: z
          .union([z.string(), z.number()])
          .optional()
          .describe('ID numérico o nombre del embudo (se hace match exacto por id, o parcial case-insensitive por nombre).'),
        created_from: z
          .string()
          .optional()
          .describe('Fecha de creación desde: YYYY-MM-DD o unix timestamp (segundos).'),
        created_to: z
          .string()
          .optional()
          .describe('Fecha de creación hasta: YYYY-MM-DD o unix timestamp (segundos).'),
        page: z.number().int().min(1).optional().describe('Página 1-indexada, default 1'),
        limit: z.number().int().min(1).max(250).optional().describe('Hasta 250, default 250'),
        with_contacts: z
          .boolean()
          .optional()
          .describe('Si true, incluye referencias a contactos vinculados. Default false.'),
      },
    },
    async ({ client, pipeline, created_from, created_to, page, limit, with_contacts }) => {
      assertAccess(ctx.user, client);
      const data = await listLeads({
        clientSlug: client,
        pipeline,
        created_from,
        created_to,
        page: page ?? 1,
        limit: limit ?? 250,
        with_contacts: !!with_contacts,
      });
      return asText({ client, ...data });
    },
  );
}
