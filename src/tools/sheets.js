import { z } from 'zod';
import { google } from 'googleapis';
import { resolveSheetId } from '../clients.js';
import { assertAccess } from '../users.js';

let cachedClient = null;

function getSheets() {
  if (cachedClient) return cachedClient;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

export function registerSheetsTools(server, ctx) {
  const gateResolve = (args) => {
    if (args.client) assertAccess(ctx.user, args.client);
    return resolveSheetId(args);
  };

  server.registerTool(
    'sheets_get_metadata',
    {
      title: 'Get spreadsheet metadata',
      description:
        'Returns title, sheet tabs and grid properties. Pass either spreadsheet_id or (client + sheet_key). The spreadsheet must be shared with the service-account email.',
      inputSchema: {
        spreadsheet_id: z.string().optional(),
        client: z.string().optional(),
        sheet_key: z.string().optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key }) => {
      const id = gateResolve({ client, sheet_key, spreadsheet_id });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.get({
        spreadsheetId: id,
        fields: 'spreadsheetId,properties.title,sheets(properties(sheetId,title,index,gridProperties))',
      });
      return asText(data);
    },
  );

  server.registerTool(
    'sheets_read_range',
    {
      title: 'Read a range from a sheet',
      description:
        'A1 notation, e.g. "Sheet1!A1:D100". Pass either spreadsheet_id or (client + sheet_key). Returns rows as an array of arrays.',
      inputSchema: {
        spreadsheet_id: z.string().optional(),
        client: z.string().optional(),
        sheet_key: z.string().optional(),
        range: z.string().describe('A1 range, e.g. "Sheet1!A1:D100"'),
        value_render_option: z
          .enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'])
          .optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, range, value_render_option }) => {
      const id = gateResolve({ client, sheet_key, spreadsheet_id });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: id,
        range,
        valueRenderOption: value_render_option,
      });
      return asText(data);
    },
  );

  server.registerTool(
    'sheets_append_rows',
    {
      title: 'Append rows to a sheet',
      description:
        'Appends rows to the end of the table starting at the given range. Pass either spreadsheet_id or (client + sheet_key). Values is an array of rows.',
      inputSchema: {
        spreadsheet_id: z.string().optional(),
        client: z.string().optional(),
        sheet_key: z.string().optional(),
        range: z.string().describe('A1 range that indicates the target table, e.g. "Sheet1!A:D"'),
        values: z.array(z.array(z.any())),
        value_input_option: z.enum(['RAW', 'USER_ENTERED']).optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, range, values, value_input_option = 'USER_ENTERED' }) => {
      const id = gateResolve({ client, sheet_key, spreadsheet_id });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.append({
        spreadsheetId: id,
        range,
        valueInputOption: value_input_option,
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });
      return asText(data);
    },
  );

  server.registerTool(
    'sheets_update_range',
    {
      title: 'Overwrite a range in a sheet',
      description:
        'Writes values into the given A1 range, overwriting existing cells. Pass either spreadsheet_id or (client + sheet_key). For appending prefer sheets_append_rows.',
      inputSchema: {
        spreadsheet_id: z.string().optional(),
        client: z.string().optional(),
        sheet_key: z.string().optional(),
        range: z.string(),
        values: z.array(z.array(z.any())),
        value_input_option: z.enum(['RAW', 'USER_ENTERED']).optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, range, values, value_input_option = 'USER_ENTERED' }) => {
      const id = gateResolve({ client, sheet_key, spreadsheet_id });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range,
        valueInputOption: value_input_option,
        requestBody: { values },
      });
      return asText(data);
    },
  );
}
