import { listClients } from '../clients.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerClientTools(server, ctx) {
  server.registerTool(
    'list_clients',
    {
      title: 'List clients you have access to',
      description:
        'Returns the full client registry. Every authenticated user sees every client. Each entry includes slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id and named sheets.',
      inputSchema: {},
    },
    async () => {
      const clients = listClients();
      return asText({
        user: { id: ctx.user.id, name: ctx.user.name, role: ctx.user.role },
        clients,
      });
    },
  );
}
