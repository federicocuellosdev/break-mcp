import { z } from 'zod';
import { google } from 'googleapis';
import { resolveSheetRef } from '../clients.js';
import { assertAccess } from '../users.js';

// Si el range no incluye nombre de hoja (no tiene "!"), y hay sheet_name definida
// en el mapping del cliente, se prepende automáticamente.
function applySheetName(range, sheetName) {
  if (!range) return range;
  if (!sheetName) return range;
  if (range.includes('!')) return range;
  // Nombres con espacios o caracteres especiales van entre comillas simples
  const quoted = /[\s'!]/.test(sheetName) ? `'${sheetName.replace(/'/g, "''")}'` : sheetName;
  return `${quoted}!${range}`;
}

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
    return resolveSheetRef(args);
  };

  const commonInput = {
    spreadsheet_id: z.string().optional(),
    client: z.string().optional(),
    sheet_key: z.string().optional(),
    sheet_name: z
      .string()
      .optional()
      .describe('Overrides el nombre de hoja (tab) definido en el alias del cliente. Si no se pasa, usa el mapeado o el que viene explícito en el range.'),
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
      const { spreadsheetId } = gateResolve({ client, sheet_key, spreadsheet_id });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.get({
        spreadsheetId,
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
        'A1 notation. Si el range no tiene "!Hoja" explícito y el alias del cliente trae sheet_name, se prepende automático. Ej: con sheet_name="Azahares" + range="A1:D100" → lee "Azahares!A1:D100".',
      inputSchema: {
        ...commonInput,
        range: z.string().describe('A1 range, ej "A1:D100" (usa sheet_name del alias) o "Hoja!A1:D100" para forzar otra hoja.'),
        value_render_option: z
          .enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'])
          .optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, sheet_name, range, value_render_option }) => {
      const ref = gateResolve({ client, sheet_key, spreadsheet_id, sheet_name });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: ref.spreadsheetId,
        range: applySheetName(range, ref.sheetName),
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
        'Appends rows to the end of the table starting at the given range. Si el range no tiene "!Hoja" y el alias trae sheet_name, se prepende automático.',
      inputSchema: {
        ...commonInput,
        range: z.string().describe('A1 range (ej "A:D") — usa sheet_name del alias si no se pasa "Hoja!".'),
        values: z.array(z.array(z.any())),
        value_input_option: z.enum(['RAW', 'USER_ENTERED']).optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, sheet_name, range, values, value_input_option = 'USER_ENTERED' }) => {
      const ref = gateResolve({ client, sheet_key, spreadsheet_id, sheet_name });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.append({
        spreadsheetId: ref.spreadsheetId,
        range: applySheetName(range, ref.sheetName),
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
        'Writes values into the given A1 range, overwriting existing cells. Si el range no tiene "!Hoja" y el alias trae sheet_name, se prepende automático. For appending prefer sheets_append_rows.',
      inputSchema: {
        ...commonInput,
        range: z.string(),
        values: z.array(z.array(z.any())),
        value_input_option: z.enum(['RAW', 'USER_ENTERED']).optional(),
      },
    },
    async ({ spreadsheet_id, client, sheet_key, sheet_name, range, values, value_input_option = 'USER_ENTERED' }) => {
      const ref = gateResolve({ client, sheet_key, spreadsheet_id, sheet_name });
      const sheets = getSheets();
      const { data } = await sheets.spreadsheets.values.update({
        spreadsheetId: ref.spreadsheetId,
        range: applySheetName(range, ref.sheetName),
        valueInputOption: value_input_option,
        requestBody: { values },
      });
      return asText(data);
    },
  );
}
