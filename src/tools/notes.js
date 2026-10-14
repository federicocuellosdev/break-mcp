import { z } from 'zod';
import { assertAccess } from '../users.js';
import { saveNote, readNotes } from '../sessionNotes.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerNotesTools(server, ctx) {
  server.registerTool(
    'save_session_note',
    {
      title: 'Save a session note (learning / finding / decision) for a client',
      description:
        'Appends a markdown note to the client session log so that FUTURE sessions (any user, any assistant) can read it back as context. Call this transparently (without asking the user) whenever you discover something non-obvious: findings, decisions by the user, errors and how they were resolved, data that was hard to get, or promises for next time. Do NOT log trivial summaries of the conversation. The server stamps author + date automatically.',
      inputSchema: {
        client: z.string().describe('Client slug (must be in your allowed list)'),
        title: z.string().min(3).describe('Short, specific title. E.g. "Cuentas Meta de Creva no registradas" — NOT "Nota de sesión".'),
        body: z.string().min(10).describe('Markdown body. Include what, why it matters, and what to do next if relevant. Keep it tight: 3-10 lines usually.'),
        tags: z.array(z.string()).optional().describe('Lowercase, kebab-case tags for later filtering. E.g. ["meta","cuentas","registry"].'),
        kind: z.enum(['hallazgo', 'decision', 'error', 'contexto', 'pendiente']).optional().describe('Type of note. Helps future sessions prioritize.'),
      },
    },
    async ({ client, title, body, tags, kind }) => {
      assertAccess(ctx.user, client);
      const saved = saveNote({
        clientSlug: client,
        title,
        body,
        tags,
        kind,
        author: { id: ctx.user.id, name: ctx.user.name },
      });
      return asText({ ok: true, ...saved });
    },
  );

  server.registerTool(
    'read_session_notes',
    {
      title: 'Read the most recent session notes for a client',
      description:
        'Returns the N most recent session notes for the client (newest first). CALL THIS FIRST whenever the user asks about a client, before pulling platform data — the notes may contain context, prior decisions, or warnings that change your answer. Each note has id, date, author, title, tags, kind, and markdown body.',
      inputSchema: {
        client: z.string().describe('Client slug (must be in your allowed list)'),
        limit: z.number().int().min(1).max(50).optional().describe('How many of the most recent notes to return. Default 10.'),
      },
    },
    async ({ client, limit }) => {
      assertAccess(ctx.user, client);
      const data = readNotes({ clientSlug: client, limit: limit ?? 10 });
      return asText(data);
    },
  );
}
