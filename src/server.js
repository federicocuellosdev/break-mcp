import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerClientTools } from './tools/clients.js';
import { registerMetaTools } from './tools/meta.js';
import { registerSheetsTools } from './tools/sheets.js';
import { registerGadsTools } from './tools/gads.js';
import { registerGa4Tools } from './tools/ga4.js';
import { registerReportTools } from './tools/report.js';
import { registerLogsTools } from './tools/logs.js';
import { registerBillingTools } from './tools/billing.js';

export function createServer({ user }) {
  const server = new McpServer({
    name: 'break-mcp',
    version: '0.2.0',
  });

  const ctx = { user };

  registerClientTools(server, ctx);
  registerMetaTools(server, ctx);
  registerSheetsTools(server, ctx);
  registerGadsTools(server, ctx);
  registerGa4Tools(server, ctx);
  registerReportTools(server, ctx);
  registerLogsTools(server, ctx);
  registerBillingTools(server, ctx);

  return server;
}
