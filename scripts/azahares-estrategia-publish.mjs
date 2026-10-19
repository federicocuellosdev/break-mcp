// Publica el informe de estrategia de Azahares siguiendo el estilo visual de Marlaca/Patagonica.
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

const META_LOGO = `<img src="/public/img/platforms/meta-ads.png" alt="Meta Ads">`;

const CSS = `
:root {
  --primary:#121C25; --secondary:#057488; --light:#f7f5f0; --white:#ffffff;
  --text:#212529; --text-muted:#6c757d; --text-dim:#93a1bd; --border:#e4ddd4;
  --awa:#4a90e2; --eng:#d4a85a; --conv:#3aa676; --coral:#c0526a;
  --awa-soft:#e3eaf8; --eng-soft:#faeed7; --conv-soft:#e3f3eb; --coral-soft:#fef4f5;
  color-scheme: light;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
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
h3 { font-size: 1rem; font-weight: 700; color: var(--primary); }
.lede { font-size: clamp(0.95rem, 1.15vw, 1.05rem); font-weight: 400; color: var(--text-muted); max-width: 68ch; margin: 1.3rem 0 0; line-height: 1.6; }

.ikpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: clamp(2.2rem, 5vh, 3rem); }
.ikpi { background: var(--white); border: 1px solid var(--border); padding: 1.3rem 1.4rem; border-radius: 10px; min-height: 118px; display: flex; flex-direction: column; justify-content: space-between; }
.ikpi .lbl { font-size: 0.63rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted); }
.ikpi b { display: block; font-size: clamp(1.55rem, 2.3vw, 2rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-top: 0.75rem; color: var(--primary); font-variant-numeric: tabular-nums; }
.ikpi small { display: block; font-size: 0.85rem; color: var(--text-muted); font-weight: 500; margin-top: 0.7rem; }
.ikpi.total { background: linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%); color: var(--white); border-color: transparent; }
.ikpi.total .lbl { color: rgba(255,255,255,0.65); }
.ikpi.total b { color: var(--white); }
.ikpi.total small { color: rgba(255,255,255,0.7); }

.block { margin-top: clamp(3rem, 6vh, 4.5rem); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.block-head h2 { font-size: 1.45rem; font-weight: 700; }
.block-head .sub { font-size: 0.82rem; color: var(--text-muted); }
.block-head .sub code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.8rem; background: var(--border); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--primary); }

.phead { display: flex; align-items: center; gap: 0.7rem; margin-top: 2.5rem; margin-bottom: 1rem; }
.phead:first-child { margin-top: 0; }
.phead .plogo { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.phead .plogo img { width: 100%; height: 100%; object-fit: contain; }
.phead h3 { font-size: 1.05rem; font-weight: 700; color: var(--primary); }
.phead .psub { margin-left: auto; font-size: 0.78rem; color: var(--text-muted); }

table.ctbl { width: 100%; border-collapse: collapse; font-size: 0.88rem; background: var(--white); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; font-variant-numeric: tabular-nums; }
table.ctbl th, table.ctbl td { padding: 0.9rem 1rem; text-align: left; border-bottom: 1px solid var(--border); vertical-align: middle; }
table.ctbl tbody tr:last-child td { border-bottom: 0; }
table.ctbl tfoot td { background: #f0ece6; border-top: 2px solid var(--border); font-weight: 700; color: var(--primary); }
table.ctbl th { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); background: #f0ece6; }
table.ctbl td.name { font-weight: 600; color: var(--primary); }
table.ctbl td.n, table.ctbl th.n { text-align: right; }
table.ctbl td.n { font-weight: 600; color: var(--primary); }
table.ctbl td.kpi { white-space: nowrap; }
table.ctbl td.kpi b { font-size: 0.9rem; font-weight: 700; color: var(--primary); }
table.ctbl td.kpi span.k { font-size: 0.72rem; color: var(--text-muted); margin-left: 0.4rem; }

.cat { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.74rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 999px; border: 1px solid; }
.cat .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
.cat.awa { background: var(--awa-soft); color: #1a3a6e; border-color: rgba(74,144,226,0.4); }
.cat.awa .dot { background: var(--awa); }
.cat.eng { background: var(--eng-soft); color: #7a5820; border-color: rgba(212,168,90,0.5); }
.cat.eng .dot { background: var(--eng); }
.cat.conv { background: var(--conv-soft); color: #1f5a3e; border-color: rgba(58,166,118,0.4); }
.cat.conv .dot { background: var(--conv); }

a.cname { color: var(--primary); text-decoration: none; cursor: pointer; border-bottom: 1px dotted var(--text-dim); transition: color 0.15s, border-color 0.15s; }
a.cname:hover { color: var(--secondary); border-bottom-color: var(--secondary); }

.wcards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 1rem; }
.wcard { display: flex; align-items: flex-start; gap: 1.1rem; padding: 1.3rem 1.4rem; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.wcard .wicon { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 10px; background: var(--conv-soft); border: 1px solid rgba(58,166,118,0.3); display: flex; align-items: center; justify-content: center; color: var(--conv); }
.wcard.alert .wicon { background: var(--coral-soft); border-color: rgba(192,82,106,0.4); color: var(--coral); }
.wcard.opp .wicon { background: var(--awa-soft); border-color: rgba(74,144,226,0.4); color: var(--awa); }
.wcard.full { grid-column: 1 / -1; }
.wcard .wicon svg { width: 22px; height: 22px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.wcard .wbody { flex: 1; min-width: 0; }
.wcard .wbody h4 { font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 0.35rem; }
.wcard .wbody p { font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); margin: 0; }
.wcard .wbody p + p { margin-top: 0.6rem; }
.wcard .wbody p strong { color: var(--primary); font-weight: 600; }

.foot-note { margin-top: 1.8rem; color: var(--text-muted); font-size: 0.82rem; line-height: 1.6; max-width: 120ch; border-top: 1px solid var(--border); padding-top: 1.2rem; }
.foot-note strong { color: var(--primary); font-weight: 600; }

.section-divider { margin: clamp(4rem, 8vh, 6rem) 0 0; border-top: 1px solid rgba(0,0,0,0.06); }
.section-divider + .block { margin-top: clamp(3rem, 6vh, 4.5rem); }

.sheet-grid { display: grid; grid-template-columns: 300px 1fr; gap: clamp(2rem, 5vw, 3.5rem); align-items: center; margin-top: 1.8rem; }
@media (max-width: 760px) { .sheet-grid { grid-template-columns: 1fr; } }
.pie-wrap { display: flex; flex-direction: column; align-items: center; gap: 1.3rem; }
.pie { width: 180px; height: 180px; border-radius: 50%; position: relative; display: grid; place-items: center; }
.pie-hole { width: 120px; height: 120px; background: var(--white); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.pie-hole b { font-size: 1.7rem; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.pie-hole span { font-size: 0.64rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); }
.pie-legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; width: 100%; max-width: 260px; }
.pie-legend li { display: grid; grid-template-columns: 10px 1fr auto auto; align-items: center; gap: 0.6rem; font-size: 0.82rem; color: var(--text); }
.pie-legend .dot { width: 10px; height: 10px; border-radius: 3px; }
.pie-legend .n { color: var(--primary); font-weight: 700; font-variant-numeric: tabular-nums; }
.pie-legend .p { color: var(--text-muted); font-size: 0.74rem; font-weight: 500; font-variant-numeric: tabular-nums; min-width: 42px; text-align: right; }

.sheet-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-content: start; }
.skpi { background: var(--white); border: 1px solid var(--border); padding: 1.1rem 1.2rem; border-radius: 10px; display: flex; flex-direction: column; gap: 0.6rem; min-height: 118px; justify-content: space-between; }
.skpi .lbl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); }
.skpi b { font-size: clamp(1.4rem, 2.1vw, 1.85rem); font-weight: 800; color: var(--primary); letter-spacing: -0.025em; font-variant-numeric: tabular-nums; line-height: 1; }
.skpi small { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; line-height: 1.4; }

.subhead { font-size: 1rem; font-weight: 700; color: var(--primary); margin: 2.2rem 0 0.9rem; }

.ctbl td.date { font-weight: 600; color: var(--primary); font-variant-numeric: tabular-nums; width: 72px; }
.pill { display: inline-block; padding: 0.14rem 0.6rem; border-radius: 100px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.01em; }
.pill-conv { background: var(--conv-soft); color: var(--conv); }
.pill-eng { background: var(--eng-soft); color: #8a6d00; }
.pill-ok { background: var(--conv-soft); color: var(--secondary); }
.pill-off { background: var(--coral-soft); color: var(--coral); }
.pill-wait { background: var(--awa-soft); color: var(--awa); }
.pill-neutral { background: var(--border); color: var(--text-muted); }

.ctbl-interactive th.sort { cursor: pointer; user-select: none; }
.ctbl-interactive th.sort .sort-ico { display: inline-block; width: 10px; margin-left: 5px; opacity: 0.3; font-size: 0.75em; transition: opacity 0.15s; }
.ctbl-interactive th.sort .sort-ico::after { content: '↕'; }
.ctbl-interactive th.sort:hover .sort-ico { opacity: 0.7; }
.ctbl-interactive th.sort-asc .sort-ico { opacity: 1; color: var(--secondary); }
.ctbl-interactive th.sort-asc .sort-ico::after { content: '↑'; }
.ctbl-interactive th.sort-desc .sort-ico { opacity: 1; color: var(--secondary); }
.ctbl-interactive th.sort-desc .sort-ico::after { content: '↓'; }
.ctbl-interactive th.filterable { position: relative; }
.ctbl-interactive th.filterable .th-label { cursor: pointer; }
.ctbl-interactive .filter-btn { background: transparent; border: 0; cursor: pointer; margin-left: 4px; color: var(--text-muted); font-size: 0.68rem; padding: 1px 4px; border-radius: 3px; vertical-align: middle; }
.ctbl-interactive .filter-btn:hover { background: var(--border); color: var(--primary); }
.ctbl-interactive .filter-btn.on { background: var(--secondary); color: var(--white); }
.filter-pop { position: absolute; top: calc(100% + 4px); right: 0; z-index: 20; background: var(--white); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.1); padding: 0.4rem; min-width: 220px; max-height: 280px; overflow-y: auto; text-transform: none; letter-spacing: 0; }
.filter-pop label { display: flex; align-items: center; gap: 0.55rem; padding: 0.35rem 0.5rem; font-size: 0.78rem; color: var(--text); cursor: pointer; font-weight: 500; border-radius: 4px; }
.filter-pop label:hover { background: var(--light); }
.filter-pop label input { margin: 0; cursor: pointer; }
.filter-pop .fp-actions { display: flex; justify-content: space-between; padding: 0.5rem 0.5rem 0.1rem; border-top: 1px solid var(--border); margin-top: 0.4rem; font-size: 0.72rem; }
.filter-pop .fp-actions a { color: var(--secondary); cursor: pointer; text-decoration: none; font-weight: 600; }
.filter-pop .fp-actions a:hover { text-decoration: underline; }

.modal-root { position: fixed; inset: 0; z-index: 100; display: none; align-items: center; justify-content: center; padding: clamp(16px, 4vw, 2rem); background: rgba(18, 28, 37, 0.55); backdrop-filter: blur(5px); }
.modal-root.show { display: flex; }
.modal { background: var(--white); border: 1px solid var(--border); border-radius: 12px; max-width: 720px; width: 100%; max-height: 88vh; overflow-y: auto; padding: clamp(1.5rem, 3vw, 2.1rem); position: relative; box-shadow: 0 20px 60px rgba(18,28,37,0.25); }
.modal .mclose { position: absolute; top: 1rem; right: 1.1rem; width: 32px; height: 32px; background: var(--light); border: 1px solid var(--border); border-radius: 50%; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
.modal .mclose:hover { background: var(--border); color: var(--primary); }
.modal h3.mtitle { font-size: 1.35rem; font-weight: 800; color: var(--primary); margin-bottom: 0.3rem; padding-right: 3rem; line-height: 1.2; }
.modal .mcat { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1.2rem; }
.modal .mkpis { display: flex; flex-wrap: wrap; gap: 0; margin: 1.2rem 0 1.5rem; padding: 1rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.modal .mkpis > div { flex: 1 1 25%; display: flex; flex-direction: column; align-items: center; padding: 0.5rem 0.6rem; text-align: center; border-left: 1px solid var(--border); min-width: 0; }
.modal .mkpis > div:first-child { border-left: 0; }
.modal .mkpis b { font-size: 1.05rem; font-weight: 800; color: var(--primary); line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.modal .mkpis span { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 0.4rem; }
.modal .msec { margin-top: 1.6rem; }
.modal .msec h4 { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--secondary); margin-bottom: 0.65rem; }
.modal .msec p, .modal .msec li { font-size: 0.9rem; color: var(--text); line-height: 1.6; }
.modal .msec p + p { margin-top: 0.6rem; }
.modal .msec ul { margin: 0; padding-left: 1.2rem; }
.modal .msec li + li { margin-top: 0.35rem; }
.modal .msec strong { color: var(--primary); font-weight: 700; }
.modal .msec code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.82rem; background: var(--light); padding: 0.1rem 0.35rem; border-radius: 3px; }

@media (max-width: 900px) {
  .ctx { display: none; }
  .ikpis { grid-template-columns: 1fr 1fr; }
  .wcards { grid-template-columns: 1fr; }
  table.ctbl { font-size: 0.78rem; }
  table.ctbl th, table.ctbl td { padding: 0.6rem; }
}
@media (max-width: 560px) {
  .ikpis { grid-template-columns: 1fr; }
}
`;

// Totales calculados: inv $697.651, leads 43, convs WA 176, contactos totales 219 (43+176)
// Costo por contacto = $697.651 / 219 = $3.185
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Azahares del Paraná · Estrategia de marketing</title>
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
    <span class="ctx">Resumen estrategia de marketing</span>
  </nav>
</div>

<section class="slide">
  <div class="inner">
    <span class="stag">Azahares del Paraná · 1 al 18 de octubre 2026</span>
    <h1>Resumen de la<br><span class="accent">estrategia de marketing</span></h1>
    <p class="lede">Campañas Meta Ads activas con inversión en octubre, agrupadas por objetivo. Hoy la pauta corre únicamente en Meta Ads — Google Ads tiene sus 4 campañas pausadas.</p>

    <div class="ikpis">
      <div class="ikpi total">
        <span class="lbl">Inversión</span>
        <b>$ 697.651</b>
        <small>1-18 oct 2026 · Meta Ads · 3 campañas</small>
      </div>
      <div class="ikpi">
        <span class="lbl">Contactos comerciales</span>
        <b>219</b>
        <small>43 leads form + 176 conversaciones WA</small>
      </div>
      <div class="ikpi">
        <span class="lbl">Costo por contacto</span>
        <b>$ 3.185</b>
        <small>Inversión total ÷ contactos</small>
      </div>
    </div>

    <div class="block">
      <div class="phead">
        <div class="plogo">${META_LOGO}</div>
        <h3>Meta Ads</h3>
        <span class="psub">Cuenta act_2347584838876950 · 3 campañas activas · 1 → 18 oct 2026</span>
      </div>
      <table class="ctbl">
        <thead>
          <tr>
            <th style="width:36%">Campaña</th>
            <th style="width:16%">Objetivo</th>
            <th style="width:22%">Resultado</th>
            <th class="n" style="width:11%">Costo / resultado</th>
            <th class="n" style="width:9%">Inversión</th>
            <th class="n" style="width:6%">% total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="name"><a class="cname" data-modal="m-trafico-clarin">Azahares - tráfico hacia la nota del Clarín</a></td>
            <td><span class="cat awa"><span class="dot"></span>Tráfico</span></td>
            <td class="kpi"><b>9.924</b><span class="k">(Clics al enlace)</span></td>
            <td class="n">$ 18,90</td>
            <td class="n">$ 187.506</td>
            <td class="n">26,9%</td>
          </tr>
          <tr>
            <td class="name"><a class="cname" data-modal="m-comunidad">Azahares - comunidad mensajería optimizada</a></td>
            <td><span class="cat eng"><span class="dot"></span>Mensajería</span></td>
            <td class="kpi"><b>123</b><span class="k">(Conversaciones WA)</span></td>
            <td class="n">$ 1.015</td>
            <td class="n">$ 124.946</td>
            <td class="n">17,9%</td>
          </tr>
          <tr>
            <td class="name"><a class="cname" data-modal="m-reposicionamiento">Azahares - leads whatsapp reposicionamiento</a></td>
            <td><span class="cat conv"><span class="dot"></span>Conversión</span></td>
            <td class="kpi"><b>43</b><span class="k">(Clientes potenciales)</span></td>
            <td class="n">$ 8.958</td>
            <td class="n">$ 385.199</td>
            <td class="n">55,2%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">Total Meta Ads</td>
            <td class="n">$ 697.651</td>
            <td class="n">100%</td>
          </tr>
        </tfoot>
      </table>
      <p class="foot-note"><strong>Lectura:</strong> la estrategia está balanceada en 3 patas: la de <strong>conversión</strong> (reposicionamiento) absorbe 55% del presupuesto y genera 43 leads directos + 50 conversaciones WA. La de <strong>tráfico</strong> lleva ~10k visitas a una nota del Clarín (prueba social de medio reconocido). La de <strong>mensajería</strong> genera 123 conversaciones de WhatsApp a $1.015 cada una — muy eficiente. En total <strong>219 contactos comerciales a $3.185 cada uno</strong>. Google Ads tiene 4 campañas (3 Search + 1 Display Remarketing) todas pausadas: decidir si se reactiva la Search de marca o se descarta formalmente del plan.</p>
    </div>

    <div class="section-divider"></div>

    <div class="block">
      <div class="block-head">
        <h2>Seguimiento comercial · Google Sheet</h2>
      </div>
      <p class="foot-note" style="border-top:0;padding-top:0;margin-top:0;max-width:72ch">El equipo registra las interacciones en un Google Sheet (jun → 19 oct 2026). <strong>271 interacciones</strong> sobre <strong>231 contactos únicos</strong>. La estructura es un diario de intercambios, no un embudo con tareas y tiempos.</p>

      <div class="sheet-grid">
        <div class="pie-wrap">
          <div class="pie" style="background:conic-gradient(#d4a85a 0 59.3%, #3aa676 59.3% 74.9%, #93a1bd 74.9% 87.5%, #d4cfc5 87.5% 98.7%, #057488 98.7% 99.6%, #c0526a 99.6% 100%)">
            <div class="pie-hole"><b>231</b><span>leads únicos</span></div>
          </div>
          <ul class="pie-legend">
            <li><span class="dot" style="background:#d4a85a"></span><span>En seguimiento</span><span class="n">137</span><span class="p">59%</span></li>
            <li><span class="dot" style="background:#3aa676"></span><span>Pipeline activo</span><span class="n">36</span><span class="p">16%</span></li>
            <li><span class="dot" style="background:#93a1bd"></span><span>Sin respuesta</span><span class="n">29</span><span class="p">13%</span></li>
            <li><span class="dot" style="background:#d4cfc5"></span><span>Sin etapa</span><span class="n">26</span><span class="p">11%</span></li>
            <li><span class="dot" style="background:#057488"></span><span>Ganado</span><span class="n">2</span><span class="p">0,9%</span></li>
            <li><span class="dot" style="background:#c0526a"></span><span>Perdido</span><span class="n">1</span><span class="p">0,4%</span></li>
          </ul>
        </div>

        <div class="sheet-kpis">
          <div class="skpi">
            <span class="lbl">Pipeline activo</span>
            <b>36</b>
            <small>Oportunidad, Negociación, Presupuesto, Lead calificado, Visita, Quiere conocer</small>
          </div>
          <div class="skpi">
            <span class="lbl">Cierres confirmados</span>
            <b>2</b>
            <small>Mauricio Fortino · entrega USD 10.500 (3-oct) + agenda de firma</small>
          </div>
          <div class="skpi">
            <span class="lbl">Canal dominante</span>
            <b>85%</b>
            <small>WhatsApp (231 de 271). Instagram y llamadas marginales.</small>
          </div>
          <div class="skpi">
            <span class="lbl">Teléfono registrado</span>
            <b>29%</b>
            <small>71% de las filas no tienen contacto cargado — imposible automatizar follow-ups.</small>
          </div>
          <div class="skpi">
            <span class="lbl">Valor potencial cargado</span>
            <b>1%</b>
            <small>El campo "$ valor potencial" prácticamente no se usa — sin forecast ni calificación por ticket.</small>
          </div>
          <div class="skpi">
            <span class="lbl">Octubre vs septiembre</span>
            <b>33 / 164</b>
            <small>Caída fuerte en el registro (al 19-oct). Investigar si bajó la actividad o solo el registro.</small>
          </div>
        </div>
      </div>

      <p class="foot-note"><strong>Lectura:</strong> el pipeline real es chico pero no fantasmal — 36 leads vivos y 2 cierres confirmados en 4 meses sobre 231 contactos. El problema no es la cantidad sino la <strong>trazabilidad</strong>: la mayoría del embudo cae en "En seguimiento" sin próxima acción cargada, el mismo contacto se registra múltiples veces como filas sueltas (16 teléfonos duplicados con hasta 9 entradas cada uno) y campos clave como valor, avance y próxima acción están prácticamente vacíos. Es lo que Kommo resuelve de fábrica.</p>

      <h3 class="subhead">Interacciones de octubre (33)</h3>
      <table class="ctbl ctbl-interactive" id="tbl-oct">
        <thead>
          <tr>
            <th class="sort" data-key="fecha" style="width:72px" onclick="octSort(this,'fecha','date')">Fecha<span class="sort-ico"></span></th>
            <th class="sort" data-key="lead" onclick="octSort(this,'lead','text')">Lead<span class="sort-ico"></span></th>
            <th class="sort" data-key="canal" style="width:110px" onclick="octSort(this,'canal','text')">Canal<span class="sort-ico"></span></th>
            <th class="sort filterable" data-key="interaccion" style="width:220px">
              <span class="th-label" onclick="octSort(this.parentElement,'interaccion','text')">Interacción<span class="sort-ico"></span></span>
              <button type="button" class="filter-btn" data-filter="interaccion" onclick="octOpenFilter(event,this,'interaccion')" title="Filtrar">▾</button>
            </th>
            <th class="sort filterable" data-key="etapa" style="width:200px">
              <span class="th-label" onclick="octSort(this.parentElement,'etapa','text')">Etapa<span class="sort-ico"></span></span>
              <button type="button" class="filter-btn" data-filter="etapa" onclick="octOpenFilter(event,this,'etapa')" title="Filtrar">▾</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr data-fecha="2026-10-02" data-lead="Alicia Nuñez" data-canal="Instagram" data-interaccion="Primer contacto" data-etapa="Lead calificado"><td class="date">02/10</td><td class="name">Alicia Nuñez</td><td>Instagram</td><td>Primer contacto</td><td><span class="pill pill-conv">Lead calificado</span></td></tr>
          <tr data-fecha="2026-10-02" data-lead="Alicia Nuñez" data-canal="WhatsApp" data-interaccion="Segundo contacto" data-etapa="Presupuesto enviado"><td class="date">02/10</td><td class="name">Alicia Nuñez</td><td>WhatsApp</td><td>Segundo contacto</td><td><span class="pill pill-eng">Presupuesto enviado</span></td></tr>
          <tr data-fecha="2026-10-05" data-lead="Alicia Nuñez" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="En validación"><td class="date">05/10</td><td class="name">Alicia Nuñez</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-wait">En validación</span></td></tr>
          <tr data-fecha="2026-10-05" data-lead="Daniel - Amstrong" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Quiere conocer"><td class="date">05/10</td><td class="name">Daniel - Amstrong</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-eng">Quiere conocer</span></td></tr>
          <tr data-fecha="2026-10-05" data-lead="Dr marcelo rondina 5/10" data-canal="Instagram" data-interaccion="Seguimiento" data-etapa="—"><td class="date">05/10</td><td class="name">Dr marcelo rondina 5/10</td><td>Instagram</td><td>Seguimiento</td><td><span class="pill pill-neutral">—</span></td></tr>
          <tr data-fecha="2026-10-06" data-lead="Julian Lequio 1/12" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Volver a contactar"><td class="date">06/10</td><td class="name">Julian Lequio 1/12</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-06" data-lead="Victor Amarra" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Oportunidad"><td class="date">06/10</td><td class="name">Victor Amarra</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-conv">Oportunidad</span></td></tr>
          <tr data-fecha="2026-10-06" data-lead="Pedro" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Oportunidad"><td class="date">06/10</td><td class="name">Pedro</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-conv">Oportunidad</span></td></tr>
          <tr data-fecha="2026-10-07" data-lead="Victor Amarra" data-canal="WhatsApp" data-interaccion="Envío de presupuesto" data-etapa="En validación"><td class="date">07/10</td><td class="name">Victor Amarra</td><td>WhatsApp</td><td>Envío de presupuesto</td><td><span class="pill pill-wait">En validación</span></td></tr>
          <tr data-fecha="2026-10-07" data-lead="Pedro" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Sin respuesta"><td class="date">07/10</td><td class="name">Pedro</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-08" data-lead="Victor Amarra" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Stand by"><td class="date">08/10</td><td class="name">Victor Amarra</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-off">Stand by</span></td></tr>
          <tr data-fecha="2026-10-09" data-lead="Camilo Soto" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Sin respuesta"><td class="date">09/10</td><td class="name">Camilo Soto</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Daniel" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Quiere conocer"><td class="date">13/10</td><td class="name">Daniel</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-eng">Quiere conocer</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Daniel" data-canal="WhatsApp" data-interaccion="Coordinar visita" data-etapa="Volver a contactar"><td class="date">13/10</td><td class="name">Daniel</td><td>WhatsApp</td><td>Coordinar visita</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Lucas troncoso" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Stand by"><td class="date">13/10</td><td class="name">Lucas troncoso</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-off">Stand by</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Camilo Soto" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Sin respuesta"><td class="date">13/10</td><td class="name">Camilo Soto</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Gustavo Perez" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Sin respuesta"><td class="date">13/10</td><td class="name">Gustavo Perez</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Julio Lovey" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Sin respuesta"><td class="date">13/10</td><td class="name">Julio Lovey</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Alicia Nuñez" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Oportunidad"><td class="date">13/10</td><td class="name">Alicia Nuñez</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-conv">Oportunidad</span></td></tr>
          <tr data-fecha="2026-10-13" data-lead="Ramiro Arballo" data-canal="WhatsApp" data-interaccion="Coordinar visita" data-etapa="Volver a contactar"><td class="date">13/10</td><td class="name">Ramiro Arballo</td><td>WhatsApp</td><td>Coordinar visita</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-14" data-lead="Hernan Stebano" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Sin respuesta"><td class="date">14/10</td><td class="name">Hernan Stebano</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-14" data-lead="Danilo Galicio - DEPTOS" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Volver a contactar"><td class="date">14/10</td><td class="name">Danilo Galicio - DEPTOS</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-14" data-lead="Emanuel" data-canal="WhatsApp" data-interaccion="Segundo contacto" data-etapa="Quiere conocer"><td class="date">14/10</td><td class="name">Emanuel</td><td>WhatsApp</td><td>Segundo contacto</td><td><span class="pill pill-eng">Quiere conocer</span></td></tr>
          <tr data-fecha="2026-10-15" data-lead="Camilo Soto 27/10" data-canal="WhatsApp" data-interaccion="Coordinar visita" data-etapa="Volver a contactar"><td class="date">15/10</td><td class="name">Camilo Soto 27/10</td><td>WhatsApp</td><td>Coordinar visita</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-15" data-lead="Emanuel" data-canal="WhatsApp" data-interaccion="Envío de presupuesto" data-etapa="Sin respuesta"><td class="date">15/10</td><td class="name">Emanuel</td><td>WhatsApp</td><td>Envío de presupuesto</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-15" data-lead="Mauricio Fortino" data-canal="WhatsApp" data-interaccion="Cierre" data-etapa="Agenda reunion"><td class="date">15/10</td><td class="name">Mauricio Fortino</td><td>WhatsApp</td><td>Cierre</td><td><span class="pill pill-conv">Agenda reunion</span></td></tr>
          <tr data-fecha="2026-10-15" data-lead="Alicia Nuñez" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="Sin respuesta"><td class="date">15/10</td><td class="name">Alicia Nuñez</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-off">Sin respuesta</span></td></tr>
          <tr data-fecha="2026-10-16" data-lead="Luis Londres" data-canal="WhatsApp" data-interaccion="Primer contacto" data-etapa="Volver a contactar"><td class="date">16/10</td><td class="name">Luis Londres</td><td>WhatsApp</td><td>Primer contacto</td><td><span class="pill pill-wait">Volver a contactar</span></td></tr>
          <tr data-fecha="2026-10-19" data-lead="Daniel - Amstrong" data-canal="WhatsApp" data-interaccion="Coordinar visita" data-etapa="—"><td class="date">19/10</td><td class="name">Daniel - Amstrong</td><td>WhatsApp</td><td>Coordinar visita</td><td><span class="pill pill-neutral">—</span></td></tr>
          <tr data-fecha="2026-10-19" data-lead="Julio Lovey" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="—"><td class="date">19/10</td><td class="name">Julio Lovey</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-neutral">—</span></td></tr>
          <tr data-fecha="2026-10-19" data-lead="Ramiro Arballo" data-canal="WhatsApp" data-interaccion="Coordinar visita" data-etapa="—"><td class="date">19/10</td><td class="name">Ramiro Arballo</td><td>WhatsApp</td><td>Coordinar visita</td><td><span class="pill pill-neutral">—</span></td></tr>
          <tr data-fecha="2026-10-19" data-lead="Hernan Stebano" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="—"><td class="date">19/10</td><td class="name">Hernan Stebano</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-neutral">—</span></td></tr>
          <tr data-fecha="2026-10-19" data-lead="Luis Londres" data-canal="WhatsApp" data-interaccion="Seguimiento" data-etapa="—"><td class="date">19/10</td><td class="name">Luis Londres</td><td>WhatsApp</td><td>Seguimiento</td><td><span class="pill pill-neutral">—</span></td></tr>
        </tbody>
      </table>
    </div>

    <div class="section-divider"></div>

    <div class="block">
      <div class="block-head">
        <h2>Principales puntos</h2>
      </div>
      <div class="wcards">

        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></div>
          <div class="wbody">
            <h4>Mover el seguimiento del Sheet a Kommo</h4>
            <p>El seguimiento vive hoy en un <strong>Google Sheet</strong>: alcanza para registrar, pero no muestra etapas, tareas ni tiempos de respuesta. Kommo ya está instalado — queda <strong>trasladar esa dinámica</strong> cargando cada lead con sus tareas y notas, para ganar trazabilidad del embudo y medir calidad además de volumen.</p>
          </div>
        </div>

        <div class="wcard">
          <div class="wicon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg></div>
          <div class="wbody">
            <h4>Capitalizar la nota del Clarín</h4>
            <p>La campaña de tráfico ya llevó <strong>9.924 clics a una nota del Clarín</strong>. Esa audiencia (expuesta a prensa validada + visitó la landing) es base ideal para <strong>Custom Audience + Lookalike</strong> alimentando reposicionamiento. Hoy esa inversión no se está retroalimentando al embudo de conversión.</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</section>

<!-- MODALES -->
<div class="modal-root" id="modal-root">

  <div class="modal" data-modal-id="m-reposicionamiento" style="display:none">
    <button class="mclose" aria-label="Cerrar">×</button>
    <h3 class="mtitle">Azahares - leads whatsapp reposicionamiento</h3>
    <div class="mcat">Conversión · Activa</div>
    <div class="mkpis">
      <div><b>43</b><span>Clientes potenciales</span></div>
      <div><b>$ 8.958</b><span>Costo / lead</span></div>
      <div><b>$ 385.199</b><span>Inversión 1-18 oct</span></div>
      <div><b>55,2%</b><span>% del total</span></div>
    </div>
    <div class="msec">
      <h4>Configuración</h4>
      <p>Objetivo <strong>OUTCOME_LEADS</strong>. Ancla del embudo de conversión. Alcance 36.468 personas · 67.910 impresiones · 1.097 clics al enlace. Además de los 43 leads directos, generó 50 conversaciones de WhatsApp.</p>
    </div>
    <div class="msec">
      <h4>Hallazgos</h4>
      <p>Es la campaña que explica más de la mitad del gasto y es la que efectivamente califica leads para el equipo comercial. <strong>CPL $8.958 ARS (~USD 8)</strong> — muy saludable para real estate (benchmark industria USD 15-40). Hay margen para escalar inversión sin perder eficiencia.</p>
    </div>
  </div>

  <div class="modal" data-modal-id="m-trafico-clarin" style="display:none">
    <button class="mclose" aria-label="Cerrar">×</button>
    <h3 class="mtitle">Azahares - tráfico hacia la nota del Clarín</h3>
    <div class="mcat">Tráfico · Activa</div>
    <div class="mkpis">
      <div><b>9.924</b><span>Clics al enlace</span></div>
      <div><b>$ 18,90</b><span>Costo / clic</span></div>
      <div><b>$ 187.506</b><span>Inversión 1-18 oct</span></div>
      <div><b>26,9%</b><span>% del total</span></div>
    </div>
    <div class="msec">
      <h4>Configuración</h4>
      <p>Objetivo <strong>LINK_CLICKS</strong>. Lleva tráfico a una nota del Clarín sobre el barrio — contenido editorial de un medio reconocido, aporta credibilidad externa. Alcance 97.208 personas · 156.759 impresiones.</p>
    </div>
    <div class="msec">
      <h4>Hallazgos</h4>
      <p>CPC bajo y volumen fuerte de audiencia expuesta a prensa validada. No convierte directo (3 WA residuales) pero construye <strong>una base enorme de Custom Audience</strong> ideal para remarketing hacia la campaña de reposicionamiento.</p>
    </div>
  </div>

  <div class="modal" data-modal-id="m-comunidad" style="display:none">
    <button class="mclose" aria-label="Cerrar">×</button>
    <h3 class="mtitle">Azahares - comunidad mensajería optimizada</h3>
    <div class="mcat">Mensajería · Activa</div>
    <div class="mkpis">
      <div><b>123</b><span>Conversaciones WA</span></div>
      <div><b>$ 1.015</b><span>Costo / conv</span></div>
      <div><b>$ 124.946</b><span>Inversión 1-18 oct</span></div>
      <div><b>17,9%</b><span>% del total</span></div>
    </div>
    <div class="msec">
      <h4>Configuración</h4>
      <p>Objetivo <strong>OUTCOME_ENGAGEMENT</strong> con destino click-to-WhatsApp. Alcance más chico (9.634 personas · 15.136 impresiones) pero muy enfocado — alta tasa de conversión a conversación.</p>
    </div>
    <div class="msec">
      <h4>Hallazgos</h4>
      <p><strong>$ 1.015 por conversación WA</strong> — es la campaña más eficiente en generar contacto directo. Rol complementario a la de reposicionamiento: mientras una captura leads estructurados por form, ésta abre conversación informal con el equipo comercial para calificar en vivo.</p>
    </div>
  </div>

</div>

<script>
(function(){
  const root = document.getElementById('modal-root');
  if(!root) return;
  const modals = Array.from(root.querySelectorAll('.modal'));
  const byId = Object.fromEntries(modals.map((m) => [m.dataset.modalId, m]));
  function open(id){ const m = byId[id]; if(!m) return; modals.forEach((x) => (x.style.display = 'none')); m.style.display = 'block'; root.classList.add('show'); document.body.style.overflow = 'hidden'; }
  function close(){ root.classList.remove('show'); document.body.style.overflow = ''; }
  document.querySelectorAll('a.cname[data-modal]').forEach((a) => { a.addEventListener('click', (e) => { e.preventDefault(); open(a.dataset.modal); }); });
  root.addEventListener('click', (e) => { if(e.target === root) close(); });
  root.querySelectorAll('.mclose').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
})();

// ─── Tabla interacciones de octubre: sort + filter ──────────────
(function(){
  const tbl = document.getElementById('tbl-oct');
  if(!tbl) return;
  const tbody = tbl.querySelector('tbody');
  const allRows = Array.from(tbody.rows);
  const filters = { interaccion: null, etapa: null };
  let sortKey = null, sortDir = null;

  function applyFilters(){
    for(const r of allRows){
      let ok = true;
      for(const [k, set] of Object.entries(filters)){
        if(!set) continue;
        const v = r.dataset[k] || '';
        if(!set.has(v)){ ok = false; break; }
      }
      r.style.display = ok ? '' : 'none';
    }
  }

  function sortRows(){
    const visible = allRows.filter((r) => r.style.display !== 'none');
    const hidden = allRows.filter((r) => r.style.display === 'none');
    if(sortKey){
      visible.sort((a, b) => {
        const va = a.dataset[sortKey] || '';
        const vb = b.dataset[sortKey] || '';
        const cmp = va.localeCompare(vb, 'es', { numeric: true, sensitivity: 'base' });
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    tbody.innerHTML = '';
    for(const r of visible) tbody.appendChild(r);
    for(const r of hidden) tbody.appendChild(r);
  }

  window.octSort = function(th, key, _type){
    const headers = tbl.querySelectorAll('th');
    if(sortKey === key){ sortDir = sortDir === 'asc' ? 'desc' : (sortDir === 'desc' ? null : 'asc'); }
    else { sortKey = key; sortDir = 'asc'; }
    if(sortDir === null) sortKey = null;
    headers.forEach((h) => { h.classList.remove('sort-asc', 'sort-desc'); });
    if(sortKey) th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    sortRows();
  };

  function uniqueValues(key){
    const s = new Set();
    for(const r of allRows) s.add(r.dataset[key] || '');
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
  }

  function closeFilter(){
    document.querySelectorAll('.filter-pop').forEach((el) => el.remove());
    document.querySelectorAll('.filter-btn.open').forEach((b) => b.classList.remove('open'));
  }

  window.octOpenFilter = function(ev, btn, key){
    ev.stopPropagation();
    if(btn.classList.contains('open')){ closeFilter(); return; }
    closeFilter();
    btn.classList.add('open');
    const values = uniqueValues(key);
    const active = filters[key] || new Set(values);
    const pop = document.createElement('div');
    pop.className = 'filter-pop';
    pop.onclick = (e) => e.stopPropagation();
    pop.innerHTML = values.map((v) => '<label><input type="checkbox" data-v="' + v.replace(/"/g,'&quot;') + '" ' + (active.has(v) ? 'checked' : '') + '> ' + (v || '—') + '</label>').join('') + '<div class="fp-actions"><a data-act="all">Todos</a><a data-act="none">Ninguno</a></div>';
    btn.parentElement.appendChild(pop);
    pop.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const checked = Array.from(pop.querySelectorAll('input:checked')).map((i) => i.dataset.v);
        if(checked.length === values.length){ filters[key] = null; btn.classList.remove('on'); }
        else { filters[key] = new Set(checked); btn.classList.add('on'); }
        applyFilters();
        sortRows();
      });
    });
    pop.querySelector('[data-act="all"]').addEventListener('click', () => {
      pop.querySelectorAll('input').forEach((i) => i.checked = true);
      filters[key] = null; btn.classList.remove('on');
      applyFilters(); sortRows();
    });
    pop.querySelector('[data-act="none"]').addEventListener('click', () => {
      pop.querySelectorAll('input').forEach((i) => i.checked = false);
      filters[key] = new Set(); btn.classList.add('on');
      applyFilters(); sortRows();
    });
  };

  document.addEventListener('click', closeFilter);
})();
</script>
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

const init = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'azahares-strat', version: '0' } } });
const published = await mcp({
  jsonrpc: '2.0', id: 2, method: 'tools/call',
  params: { name: 'publish_report', arguments: {
    client: 'azahares',
    slug: 'estrategia',
    title: 'Resumen estrategia de marketing',
    description: 'Azahares del Paraná · barrio náutico consolidado sobre el Paraná (Fighiera). Campañas Meta Ads activas, costo por contacto comercial, puntos estratégicos y recomendaciones.',
    sources: [
      { platform: 'meta', account_id: 'act_2347584838876950', label: 'Meta Ads · Azahares', period: '2026-10-01 → 2026-10-18' },
      { platform: 'other', label: 'Kommo · azaharesdelparan.kommo.com', period: '2026-10-01 → 2026-10-18' },
    ],
    html,
  } },
}, init.sid);
console.log(parseSse(published.text).content[0].text);
