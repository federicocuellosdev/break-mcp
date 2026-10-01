import { listClients } from '../clients.js';
import { allowedClientSlugs } from '../users.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerClientTools(server, ctx) {
  server.registerTool(
    'list_clients',
    {
      title: 'List clients you have access to',
      description:
        'Returns the client registry filtered by your permissions. Admin and dev see every client; analyst sees only the clients explicitly assigned to them. Each entry includes slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id and named sheets.',
      inputSchema: {},
    },
    async () => {
      const all = listClients();
      const allowed = allowedClientSlugs(ctx.user);
      const clients = allowed === null ? all : all.filter((c) => allowed.includes(c.slug));
      return asText({
        user: { id: ctx.user.id, name: ctx.user.name, role: ctx.user.role },
        clients,
      });
    },
  );
}
