// Publica el informe de auditoría de pipelines Kommo de Azahares.
// URL: /azahares/pipelines
import { createHmac } from 'node:crypto';

const RENDER_TOKEN = process.env.RENDER_TOKEN || process.env.BREAK_RENDER_TOKEN;
if (!RENDER_TOKEN) { console.error('No RENDER_TOKEN'); process.exit(1); }
const SERVICE_ID = 'srv-daqut3g473hc7396psl0';
const MCP_URL = 'https://break-mcp.onrender.com/mcp';

const envs = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars?limit=100`, {
  headers: { authorization: `Bearer ${RENDER_TOKEN}`, accept: 'application/json' },
}).then((r) => r.json());
const env = Object.fromEntries(envs.map((i) => i.envVar || i).map((v) => [v.key, v.value]));
const users = JSON.parse(env.MCP_USERS_JSON).users || {};
const devIds = String(env.MCP_DEV_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const devId = devIds.find((id) => users[id]) ||
  (Object.entries(users).find(([, u]) => u.role === 'admin' && u.active !== false) || [])[0];
const mcpToken = users[devId].token;

const CSS = `
:root {
  --primary:#121C25; --secondary:#057488; --light:#f7f5f0; --white:#ffffff;
  --text:#212529; --text-muted:#6c757d; --text-dim:#93a1bd; --border:#e4ddd4;
  --awa:#4a90e2; --eng:#d4a85a; --conv:#3aa676; --coral:#c0526a;
  --awa-soft:#e3eaf8; --eng-soft:#faeed7; --conv-soft:#e3f3eb; --coral-soft:#fef4f5;
  color-scheme: light;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--light); color: var(--text); font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.top { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem clamp(16px, 4vw, 3rem); max-width: 1280px; margin: 0 auto; }
.brand { display: flex; align-items: center; gap: 0.9rem; }
.brand .logo { font-size: 1rem; font-weight: 700; color: var(--primary); text-decoration: none; letter-spacing: -0.01em; }
.brand .x { color: var(--text-dim); font-size: 0.85rem; }
.ctx { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); }

.slide { padding: clamp(60px, 7vh, 90px) clamp(20px, 5vw, 4rem) clamp(60px, 7vh, 80px); }
.inner { max-width: 1180px; margin: 0 auto; }
.stag { display: block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.9rem; }
h1 { font-size: clamp(1.9rem, 4.2vw, 3.4rem); font-weight: 800; letter-spacing: -0.028em; line-height: 1.05; color: var(--primary); }
h1 .accent { color: var(--secondary); }
h2 { font-size: clamp(1.3rem, 2.2vw, 1.75rem); font-weight: 700; letter-spacing: -0.02em; color: var(--primary); }
.lede { font-size: clamp(0.95rem, 1.15vw, 1.05rem); font-weight: 400; color: var(--text-muted); max-width: 68ch; margin: 1.3rem 0 0; line-height: 1.6; }

.ikpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: clamp(2.2rem, 5vh, 3rem); }
.ikpi { background: var(--white); border: 1px solid var(--border); padding: 1.1rem 1.2rem; border-radius: 10px; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between; }
.ikpi .lbl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); }
.ikpi b { display: block; font-size: clamp(1.3rem, 1.9vw, 1.7rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-top: 0.55rem; color: var(--primary); font-variant-numeric: tabular-nums; }
.ikpi small { display: block; font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.55rem; line-height: 1.4; }

.block { margin-top: clamp(3rem, 6vh, 4.5rem); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.block-head h2 { font-size: 1.4rem; font-weight: 700; }
.section-divider { margin: clamp(4rem, 8vh, 6rem) 0 0; border-top: 1px solid rgba(0,0,0,0.06); }
.section-divider + .block { margin-top: clamp(3rem, 6vh, 4.5rem); }

table.ctbl { width: 100%; border-collapse: collapse; font-size: 0.86rem; background: var(--white); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; font-variant-numeric: tabular-nums; }
table.ctbl th, table.ctbl td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid var(--border); vertical-align: middle; }
table.ctbl tbody tr:last-child td { border-bottom: 0; }
table.ctbl th { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); background: #f0ece6; }
table.ctbl td.name { font-weight: 600; color: var(--primary); }
table.ctbl td.n, table.ctbl th.n { text-align: right; font-variant-numeric: tabular-nums; }
table.ctbl td.n { font-weight: 600; color: var(--primary); }
table.ctbl tr.muted td { color: var(--text-muted); }
table.ctbl tr.muted td.name { color: var(--text-muted); font-weight: 500; }

.pill { display: inline-block; padding: 0.14rem 0.6rem; border-radius: 100px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap; }
.pill-ok { background: var(--conv-soft); color: var(--conv); }
.pill-off { background: var(--coral-soft); color: var(--coral); }
.pill-wait { background: var(--eng-soft); color: #8a6d00; }
.pill-neutral { background: var(--border); color: var(--text-muted); }

.foot-note { margin-top: 1.8rem; color: var(--text-muted); font-size: 0.82rem; line-height: 1.6; max-width: 120ch; border-top: 1px solid var(--border); padding-top: 1.2rem; }
.foot-note strong { color: var(--primary); font-weight: 600; }

.wcards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 1rem; }
.wcard { display: flex; align-items: flex-start; gap: 1.1rem; padding: 1.3rem 1.4rem; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.wcard .wicon { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 10px; background: var(--conv-soft); border: 1px solid rgba(58,166,118,0.3); display: flex; align-items: center; justify-content: center; color: var(--conv); }
.wcard .wicon svg { width: 20px; height: 20px; }
.wcard h4 { font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 0.4rem; }
.wcard p { font-size: 0.88rem; color: var(--text); line-height: 1.6; }
.wcard p strong { color: var(--primary); font-weight: 600; }

@media (max-width: 900px) {
  .ikpis { grid-template-columns: 1fr 1fr; }
  .wcards { grid-template-columns: 1fr; }
  table.ctbl { font-size: 0.78rem; }
  table.ctbl th, table.ctbl td { padding: 0.6rem; }
}
`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Azahares del Paraná · Pipelines Kommo</title>
<link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<div class="top">
  <nav>
    <div class="brand">
      <a class="logo" href="/azahares">Azahares del Paraná</a>
      <span class="x">×</span>
      <a class="logo" href="/">break</a>
    </div>
    <span class="ctx">Pipelines Kommo · auditoría</span>
  </nav>
</div>

<section class="slide">
  <div class="inner">
    <span class="stag">Azahares del Paraná · 19 de octubre 2026</span>
    <h1>Auditoría de<br><span class="accent">pipelines Kommo</span></h1>
    <p class="lede">Un único pipeline concentra el 99,9% de la actividad real. Los otros tres están prácticamente muertos. Se puede centralizar sin fricción.</p>

    <div class="ikpis">
      <div class="ikpi">
        <span class="lbl">Pipelines activos</span>
        <b>4</b>
        <small>1 principal + 3 secundarios</small>
      </div>
      <div class="ikpi">
        <span class="lbl">Leads totales</span>
        <b>3.504</b>
        <small>sumados todos los pipelines</small>
      </div>
      <div class="ikpi">
        <span class="lbl">Actividad real</span>
        <b>99,9 %</b>
        <small>concentrada en 1 solo pipeline</small>
      </div>
      <div class="ikpi">
        <span class="lbl">Pipelines "fantasma"</span>
        <b>3</b>
        <small>0, 1 y 1 lead vivos respectivamente</small>
      </div>
    </div>

    <div class="block">
      <div class="block-head">
        <h2>Actividad por pipeline</h2>
      </div>
      <table class="ctbl">
        <thead>
          <tr>
            <th>Pipeline</th>
            <th class="n">Leads totales</th>
            <th class="n">Abiertos</th>
            <th class="n">Nuevos 30d</th>
            <th class="n">Updates 30d</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="name">Embudo de ventas <small style="color:var(--text-muted);font-weight:400">· principal</small></td>
            <td class="n">3.502</td>
            <td class="n">3.237</td>
            <td class="n">380</td>
            <td class="n">2.447</td>
            <td><span class="pill pill-ok">Activo</span></td>
          </tr>
          <tr class="muted">
            <td class="name">Pipeline 1 — Relanzamiento comercial</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td><span class="pill pill-off">Dormido</span></td>
          </tr>
          <tr class="muted">
            <td class="name">Gera</td>
            <td class="n">0</td>
            <td class="n">0</td>
            <td class="n">0</td>
            <td class="n">0</td>
            <td><span class="pill pill-off">Vacío</span></td>
          </tr>
          <tr class="muted">
            <td class="name">Reactivación comercial jun 26</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td class="n">1</td>
            <td><span class="pill pill-off">Dormido</span></td>
          </tr>
        </tbody>
      </table>
      <p class="foot-note"><strong>Lectura:</strong> toda la operación comercial sucede dentro de <strong>Embudo de ventas</strong>. "Pipeline 1 Relanzamiento" tiene un lead web del 09/10, "Reactivación jun 26" tiene un lead del 07/10 y "Gera" está vacío. Los tres secundarios no reciben tráfico de ningún canal — su funcionalidad fue absorbida por el principal.</p>
    </div>

    <div class="section-divider"></div>

    <div class="block">
      <div class="block-head">
        <h2>¿De dónde entra cada lead al pipeline principal?</h2>
      </div>
      <p class="lede" style="margin-top:0.4rem">Las tags del Embudo de ventas identifican la fuente de origen (no hay un campo <em>Fuente</em> estructurado — se depende de tags sueltas).</p>
      <table class="ctbl" style="margin-top:1.5rem">
        <thead>
          <tr>
            <th>Fuente</th>
            <th class="n">Leads</th>
            <th>Qué es</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="name">base_fria_oct26</td>
            <td class="n">854</td>
            <td>Base fría de octubre — reactivación masiva</td>
          </tr>
          <tr>
            <td class="name">Importar_24062026_* (3 batches)</td>
            <td class="n">~600</td>
            <td>Importaciones CSV manuales del 24/06 (probable cruce con Sheet)</td>
          </tr>
          <tr>
            <td class="name">reactivacion_jun26</td>
            <td class="n">308</td>
            <td>Reactivación de junio</td>
          </tr>
          <tr>
            <td class="name">caliente_oct26</td>
            <td class="n">215</td>
            <td>Leads calificados como "caliente" por el comercial</td>
          </tr>
          <tr>
            <td class="name">form_meta_oct26</td>
            <td class="n">158</td>
            <td>Formulario instantáneo de Meta Ads · campaña octubre</td>
          </tr>
          <tr>
            <td class="name">Meta leads (viejo)</td>
            <td class="n">24</td>
            <td>Tag genérico de Meta anterior a <code>form_meta_oct26</code></td>
          </tr>
          <tr class="muted">
            <td class="name">etapa_previa: *</td>
            <td class="n">~1.400</td>
            <td>Marcadores de leads <strong>migrados</strong> desde los pipelines viejos (Gera, Relanzamiento, Reactivación) — confirma que ya se consolidó aquí</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section-divider"></div>

    <div class="block">
      <div class="block-head">
        <h2>Diagnóstico del embudo principal</h2>
      </div>
      <table class="ctbl">
        <thead>
          <tr>
            <th>Etapa</th>
            <th class="n">Leads abiertos</th>
            <th>Lectura</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="name">Nuevo</td><td class="n">1.308</td><td>Nunca abiertos — stock sin trabajar</td></tr>
          <tr><td class="name">Base fría (+1 año)</td><td class="n">1.101</td><td>Base histórica dormida</td></tr>
          <tr><td class="name">Sin respuesta (en seguimiento)</td><td class="n">444</td><td>Mensajes enviados sin respuesta</td></tr>
          <tr><td class="name">Interesado</td><td class="n">275</td><td>Mostraron interés pero sin próxima acción cargada</td></tr>
          <tr><td class="name">Contactado</td><td class="n">44</td><td>Primer contacto hecho</td></tr>
          <tr><td class="name">[sin uso] Lead no calificado (20 días)</td><td class="n">42</td><td>Etapa marcada "sin uso" pero con leads adentro</td></tr>
          <tr><td class="name">Negociación</td><td class="n">15</td><td>Pipeline real activo</td></tr>
          <tr><td class="name">Visita (agendada o realizada)</td><td class="n">8</td><td>En proceso de cierre</td></tr>
        </tbody>
      </table>
      <p class="foot-note"><strong>Lo que salta:</strong> hay <strong>2.409 leads en "Nuevo" o "Base fría"</strong> sin tocar, contra <strong>23 en etapas de cierre</strong> (Negociación + Visita). El embudo real activo es chico frente al stock acumulado. Además hay <strong>11 etapas marcadas <code>[sin uso]</code></strong> (recontactos escalonados + nombres de vendedores: bruno, Gi, Gera, Marian) que generan ruido visual y no se usan.</p>
    </div>

    <div class="section-divider"></div>

    <div class="block">
      <div class="block-head">
        <h2>¿Centralizar? Sí — con 4 acciones mínimas</h2>
      </div>
      <div class="wcards">
        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 12h8M11 18h2"/></svg></div>
          <div>
            <h4>Archivar los 3 pipelines muertos</h4>
            <p>Mover los 2 leads activos (Camilo Soto, Cristian Ventura) al principal con tag de origen, y archivar <strong>Pipeline 1 Relanzamiento</strong>, <strong>Gera</strong> y <strong>Reactivación jun 26</strong>. Son ruido visual que no genera valor.</p>
          </div>
        </div>
        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></div>
          <div>
            <h4>Limpiar las 11 etapas <code>[sin uso]</code></h4>
            <p>Son nombres de vendedores viejos y recontactos escalonados. Quedarían <strong>10 etapas limpias</strong>: Incoming → Nuevo → Sin respuesta → Contactado → Interesado → Visita → Negociación → Base fría → Ganado → Perdido.</p>
          </div>
        </div>
        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
          <div>
            <h4>Campo custom "Fuente"</h4>
            <p>Hoy se depende de tags sueltas (<code>form_meta_oct26</code>, <code>base_fria_oct26</code>, etc.) que no se pueden agregar. Un campo estructurado con valores fijos (<em>Meta Ads / Base fría / Importación / Web / Reactivación</em>) permite medir rendimiento por canal.</p>
          </div>
        </div>
        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg></div>
          <div>
            <h4>Decidir sobre los 2.409 dormidos</h4>
            <p>1.308 en "Nuevo" sin tocar + 1.101 en "Base fría" (+1 año). O se arma una campaña dedicada de reactivación/recalificación, o se marcan como pérdida para no inflar el stock y limpiar los reportes.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

</body>
</html>`;

async function mcp(body, sessionId = null) {
  const headers = { authorization: `Bearer ${mcpToken}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const r = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, text: await r.text(), sid: r.headers.get('mcp-session-id') };
}
function parseSse(text) {
  const line = text.split('\n').find((l) => l.startsWith('data:'));
  if (!line) throw new Error('No data line');
  const p = JSON.parse(line.replace(/^data:\s*/, ''));
  if (p.error) throw new Error('MCP: ' + JSON.stringify(p.error));
  return p.result;
}

const init = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'azh-pipelines', version: '0' } } });
const published = await mcp({
  jsonrpc: '2.0', id: 2, method: 'tools/call',
  params: { name: 'publish_report', arguments: {
    client: 'azahares',
    slug: 'pipelines',
    title: 'Auditoría de pipelines Kommo',
    description: 'Auditoría de los 4 pipelines del Kommo de Azahares: actividad real, canales que nutren cada uno y propuesta de centralización.',
    sources: [
      { platform: 'other', label: 'Kommo · azaharesdelparan.kommo.com', period: 'snapshot 2026-10-19' },
    ],
    html,
    private: true,
  } },
}, init.sid);
console.log(parseSse(published.text).content[0].text);
