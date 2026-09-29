import { z } from 'zod';
import { createLog } from '../logs.js';

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerLogsTools(server, ctx) {
  server.registerTool(
    'report_issue',
    {
      title: 'Reportar problema, limitación o fix sugerido',
      description:
        'Registra un log visible en el panel admin para reportar problemas detectados, limitaciones de las herramientas MCP, o sugerir mejoras/fixes. Título corto y descripción con contexto (qué se intentó, qué falló, error observado, cliente involucrado si aplica).',
      inputSchema: {
        title: z.string().min(3).max(120).describe('Título breve del reporte'),
        description: z
          .string()
          .min(10)
          .describe('Descripción detallada con contexto suficiente para reproducir o entender el problema'),
      },
    },
    async ({ title, description }) => {
      const entry = createLog({
        userId: ctx.user?.id || null,
        userName: ctx.user?.name || null,
        title,
        description,
      });
      return asText({ ok: true, id: entry.id, createdAt: entry.createdAt });
    },
  );
}
