import nodemailer from 'nodemailer';

const SMTP_HOST = 'cloud.ioagencia.com';
const SMTP_PORT = 465;
const SMTP_USER = 'no-reply@breakmkt.com.ar';
const SMTP_PASS = process.env.SMTP_PASS;
if (!SMTP_PASS) { console.error('SMTP_PASS env var requerido'); process.exit(1); }
const FROM = 'no-reply@breakmkt.com.ar';
const TO = 'federicoc@breakmkt.com.ar';

const cliente = 'Annika';
const formName = 'Annika - annikamerch';
const dateLabel = '30/10/2026 00:09';

const contactRows = [
  ['Nombre', 'Grelis'],
  ['Apellido', 'Rangel León'],
  ['Email', 'grelisrangel@hotmail.com'],
  ['WhatsApp', '<a href="https://wa.me/541127976641" style="color:#E13B7D;text-decoration:none;">+541127976641</a>'],
  ['Teléfono', '+541127976641'],
];
const formRows = [
  ['¿qué kits te interesan?', 'asador y picada'],
  ['¿cuántos regalos?', 'entre 21 y 50'],
  ['Presupuesto aproximado por regalo', 'hasta $30.000'],
];
const originRows = [
  ['Plataforma', 'fb'],
];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderRows = rows => rows.map(([k, v]) => `
  <tr>
    <td style="padding:14px 16px;color:#6B7280;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;width:40%;vertical-align:middle;border:1px solid #E5E7EB;background:#F9FAFB;">${esc(k)}</td>
    <td style="padding:14px 16px;color:#111827;font-size:14px;font-weight:500;vertical-align:middle;border:1px solid #E5E7EB;">${v}</td>
  </tr>
`).join('');
const tableAttrs = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;"';

const leadgenId = 'TEST-GRELIS';
const adId = '';

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuevo lead en ${cliente}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
  <tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
    <tr><td style="height:6px;background:linear-gradient(90deg,#0087F2 0%,#BF4FCD 55%,#E13B7D 100%);line-height:0;font-size:0;">&nbsp;</td></tr>
    <tr><td style="padding:28px 32px 20px 32px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;font-weight:600;padding-bottom:14px;border-bottom:1px solid #E5E7EB;">Break · MCP</div>
      <h1 style="margin:20px 0 6px 0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Nuevo lead en ${cliente}</h1>
      <div style="font-size:13px;color:#6B7280;">Formulario instantáneo ${formName} · ${dateLabel}</div>
    </td></tr>

    <tr><td style="padding:0 32px 32px 32px;">
      <div style="font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:#9CA3AF;font-weight:600;margin-bottom:8px;">Datos de contacto</div>
      <table ${tableAttrs}>${renderRows(contactRows)}</table>
    </td></tr>

    <tr><td style="padding:0 32px 32px 32px;">
      <div style="font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:#9CA3AF;font-weight:600;margin-bottom:8px;">Respuestas al formulario</div>
      <table ${tableAttrs}>${renderRows(formRows)}</table>
    </td></tr>

    <tr><td style="padding:0 32px 32px 32px;">
      <div style="font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:#9CA3AF;font-weight:600;margin-bottom:8px;">Origen de la pauta</div>
      <table ${tableAttrs}>${renderRows(originRows)}</table>
    </td></tr>

    <tr><td style="padding:0 32px 28px 32px;">
      <div style="background:#FDF2F8;border:1px solid #FBCFE8;border-radius:10px;padding:12px 14px;font-size:12px;color:#9D174D;line-height:1.6;">
        <strong style="color:#831843;">Lead ID:</strong> ${leadgenId}${adId ? `<br><strong style="color:#831843;">Ad ID:</strong> ${adId}` : ''}
      </div>
    </td></tr>

    <tr><td style="padding:16px 32px 28px 32px;border-top:1px solid #F3F4F6;">
      <div style="font-size:11px;color:#9CA3AF;line-height:1.5;">Mensaje enviado automáticamente por Break MCP. Si tenés dudas sobre esta notificación, respondé a este correo.</div>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>`;

const t = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } });
const info = await t.sendMail({ from: `"Break MCP" <${FROM}>`, to: TO, subject: `Nuevo lead · Annika · Grelis`, html });
console.log('OK', info.messageId, info.accepted);
