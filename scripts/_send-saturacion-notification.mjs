import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'cloud.ioagencia.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || 'no-reply@breakmkt.com.ar';
const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM || 'no-reply@breakmkt.com.ar';
const TO_RAW = process.argv[2];
if (!TO_RAW) { console.error('Usage: node scripts/_send-saturacion-notification.mjs <to>[,<to>...]'); process.exit(1); }
const TO = TO_RAW.split(',').map((s) => s.trim()).filter(Boolean);
if (!SMTP_PASS) { console.error('Missing SMTP_PASS env var'); process.exit(1); }

const LANDING = 'https://mcp.breakmkt.com.ar/notificacion/saturacion-meta-ads/';

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Nueva sección en Break MCP</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
  <tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
    <tr><td style="height:6px;background:linear-gradient(90deg,#0087F2 0%,#BF4FCD 55%,#E13B7D 100%);line-height:0;font-size:0;">&nbsp;</td></tr>
    <tr><td style="padding:28px 32px 10px 32px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;font-weight:600;padding-bottom:14px;border-bottom:1px solid #E5E7EB;">Break · MCP · Novedad</div>
    </td></tr>
    <tr><td style="padding:14px 32px 8px 32px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" style="width:76px;height:76px;background:#FDF2F8;border-radius:100px;">
        <img src="https://mcp.breakmkt.com.ar/public/img/notif-saturation.png?v=3" width="40" height="40" alt="Saturación" style="display:block;border:0;">
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:4px 32px 6px 32px;" align="center">
      <h1 style="margin:12px 0 6px 0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Nueva sección: Saturación Meta Ads</h1>
      <div style="font-size:14px;color:#374151;max-width:460px;margin:0 auto;line-height:1.6;">El objetivo de esta sección es brindar una serie de datos con el propósito de determinar si es necesario rotar un conjunto de creatividades.</div>
    </td></tr>
    <tr><td style="padding:24px 32px 10px 32px;" align="center">
      <a href="${LANDING}" style="display:inline-block;background:linear-gradient(90deg,#0087F2 0%,#BF4FCD 55%,#E13B7D 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;letter-spacing:0.3px;">Ver video explicativo</a>
    </td></tr>
    <tr><td style="padding:14px 32px 28px 32px;" align="center">
      <div style="font-size:12px;color:#9CA3AF;">O entrá directo a <a href="https://mcp.breakmkt.com.ar/admin/saturacion" style="color:#E13B7D;text-decoration:none;">mcp.breakmkt.com.ar/admin/saturacion</a></div>
    </td></tr>
    <tr><td style="padding:16px 32px 28px 32px;border-top:1px solid #F3F4F6;">
      <div style="font-size:11px;color:#9CA3AF;line-height:1.5;text-align:center;">Mensaje enviado automáticamente por Break MCP.</div>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

for (const addr of TO) {
  try {
    const info = await transporter.sendMail({
      from: `"Break MCP" <${FROM}>`,
      to: addr,
      subject: 'Break MCP · Nueva sección: Saturación Meta Ads',
      html,
    });
    console.log('OK', addr, info.messageId);
  } catch (e) {
    console.error('FAIL', addr, e.message);
  }
}
