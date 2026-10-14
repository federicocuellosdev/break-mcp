import { z } from 'zod';
import { assertAccess } from '../users.js';
import {
  listPipelines,
  listLeads,
  listNotes,
  listContacts,
  getLeadDetail,
} from '../providers/kommo.js';

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

  server.registerTool(
    'kommo_list_notes',
    {
      title: 'Listar notas de Kommo (del timeline de leads, contactos o compañías)',
      description:
        'Devuelve notas del Kommo del cliente. Las notas son los mensajes/comentarios/llamadas que quedan registrados en el timeline de cada entidad. Si pasás lead_id trae solo las notas de ese lead; si no, trae notas de todos los leads filtradas por fecha de update. Cada nota incluye id, note_type, text (ya normalizado), created_at, created_by, responsible_user_id.',
      inputSchema: {
        client: z.string().describe('Slug del cliente'),
        entity: z
          .enum(['leads', 'contacts', 'companies'])
          .optional()
          .describe('Entidad dueña de las notas. Default "leads".'),
        lead_id: z
          .union([z.string(), z.number()])
          .optional()
          .describe('ID del lead cuyas notas querés. Shortcut cuando entity="leads".'),
        entity_id: z
          .union([z.string(), z.number()])
          .optional()
          .describe('ID de la entidad (usar si entity != "leads").'),
        note_type: z
          .string()
          .optional()
          .describe('Filtra por tipo: common | call_in | call_out | service_message | sms_in | sms_out | attachment | invoice_paid | geolocation | message_cashier | extended_service_message'),
        updated_from: z.string().optional().describe('Fecha update desde: YYYY-MM-DD o unix seg'),
        updated_to: z.string().optional().describe('Fecha update hasta: YYYY-MM-DD o unix seg'),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(250).optional(),
      },
    },
    async ({ client, entity, lead_id, entity_id, note_type, updated_from, updated_to, page, limit }) => {
      assertAccess(ctx.user, client);
      const data = await listNotes({
        clientSlug: client,
        entity: entity || 'leads',
        lead_id,
        entity_id,
        note_type,
        updated_from,
        updated_to,
        page: page ?? 1,
        limit: limit ?? 250,
      });
      return asText({ client, ...data });
    },
  );

  server.registerTool(
    'kommo_list_contacts',
    {
      title: 'Listar contactos de Kommo del cliente',
      description:
        'Devuelve contactos del CRM con sus custom fields (ej. teléfono, email, DNI). Soporta búsqueda por query y filtro por fecha de creación.',
      inputSchema: {
        client: z.string().describe('Slug del cliente'),
        query: z.string().optional().describe('Texto a buscar en nombre, teléfono, email, etc'),
        created_from: z.string().optional().describe('YYYY-MM-DD o unix seg'),
        created_to: z.string().optional().describe('YYYY-MM-DD o unix seg'),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(250).optional(),
      },
    },
    async ({ client, query, created_from, created_to, page, limit }) => {
      assertAccess(ctx.user, client);
      const data = await listContacts({
        clientSlug: client,
        query,
        created_from,
        created_to,
        page: page ?? 1,
        limit: limit ?? 250,
      });
      return asText({ client, ...data });
    },
  );

  server.registerTool(
    'kommo_lead_detail',
    {
      title: 'Detalle completo de un lead de Kommo',
      description:
        'Devuelve un lead con pipeline/stage, tags, custom fields, contactos y compañías vinculados, loss_reason y (por default) todas sus notas del timeline. Útil para contexto profundo de un lead específico.',
      inputSchema: {
        client: z.string().describe('Slug del cliente'),
        lead_id: z.union([z.string(), z.number()]).describe('ID del lead'),
        include_notes: z
          .boolean()
          .optional()
          .describe('Si false, saltea el fetch de notas (más rápido). Default true.'),
      },
    },
    async ({ client, lead_id, include_notes }) => {
      assertAccess(ctx.user, client);
      const data = await getLeadDetail(client, lead_id, {
        include_notes: include_notes !== false,
      });
      return asText({ client, ...data });
    },
  );
}
