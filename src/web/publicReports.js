import { Router } from 'express';
import { readdirSync, existsSync, statSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { getClient } from '../clients.js';
import { esc, FONT_LINK, FAVICON } from './pages/common.js';

const REPORTS_DIR = process.env.REPORTS_DIR
  ? resolve(process.env.REPORTS_DIR)
  : resolve(process.cwd(), 'public', 'reports');

export function clientReportsPath(slug) {
  return join(REPORTS_DIR, slug);
}

export function ensureClientFolder(slug) {
  const dir = clientReportsPath(slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function safeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function humanize(s) {
  return String(s || '').replace(/[-_]+/g, ' ').replace(/\b(\w)/g, (m) => m.toUpperCase());
}

export function reportsForClient(slug) {
  const dir = clientReportsPath(slug);
  if (!existsSync(dir)) return [];
  const items = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const reportSlug = entry.name;
      const htmlPath = join(dir, reportSlug, 'index.html');
      if (!existsSync(htmlPath)) continue;
      const metaPath = join(dir, reportSlug, 'metadata.json');
      let meta = {};
      if (existsSync(metaPath)) {
        try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); } catch {}
      }
      const st = statSync(htmlPath);
      items.push({
        slug: reportSlug,
        title: meta.title || humanize(reportSlug),
        description: meta.description || '',
        author_name: meta.author_name || meta.author_id || '',
        sources: Array.isArray(meta.sources) ? meta.sources : [],
        published_at: meta.published_at || st.mtime.toISOString(),
        mtime: st.mtime,
      });
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const reportSlug = entry.name.replace(/\.html$/, '');
      const st = statSync(join(dir, entry.name));
      items.push({
        slug: reportSlug,
        title: humanize(reportSlug),
        description: '',
        author_name: '',
        published_at: st.mtime.toISOString(),
        mtime: st.mtime,
        legacy: true,
      });
    }
  }
  return items.sort((a, b) => b.mtime - a.mtime);
}

function serveReport(clientSlug, reportSlug) {
  const dir = clientReportsPath(clientSlug);
  const folderPath = join(dir, reportSlug, 'index.html');
  if (existsSync(folderPath)) return readFileSync(folderPath);
  const legacyPath = join(dir, reportSlug + '.html');
  if (existsSync(legacyPath)) return readFileSync(legacyPath);
  return null;
}

const GALLERY_CSS = `
:root{
  --bg:#F5F3F7; --black:#1B1B1D; --gray:#656467; --light:#DDDDDD; --white:#FFFFFF; --border:#DDDDDD;
  --blue:#0087F2; --purple:#BF4FCD; --pink:#E13B7D;
  --grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%);
  color-scheme:light;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--black);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100vh}
.gb{height:2px;background:var(--grad)}
.top{position:fixed;inset:0 0 auto 0;z-index:50}
nav.tnav{display:flex;justify-content:space-between;align-items:center;padding:.9rem clamp(16px,4vw,3rem);background:rgba(245,243,247,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:.9rem;min-width:0}
.logo{font-size:1.2rem;font-weight:400;letter-spacing:-.01em;color:var(--black);text-decoration:none;white-space:nowrap}
.dot{display:inline-block;width:6px;height:6px;background:var(--grad);border-radius:50%;margin-left:1px;vertical-align:super}
.brand .x{color:var(--gray);font-size:.8rem}
.ctx{font-size:.66rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);padding-left:.9rem;border-left:1px solid var(--border);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.role{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gray);padding:.28rem .6rem;border:1px solid var(--border)}

.slide{min-height:100svh;padding:clamp(96px,12vh,132px) clamp(16px,5vw,4.5rem) clamp(40px,6vh,60px);display:flex;flex-direction:column;position:relative;overflow:hidden}
.inner{max-width:1180px;width:100%;margin:0 auto;position:relative}
.stag{display:block;font-size:.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);margin-bottom:1rem}
h1{font-size:clamp(2.4rem,5.6vw,4.6rem);font-weight:900;letter-spacing:-.045em;line-height:.95;text-wrap:balance;margin:0}
.grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.lede{font-size:clamp(1rem,1.3vw,1.12rem);font-weight:300;color:var(--gray);max-width:60ch;margin:1.2rem 0 0}
.orb{position:absolute;border-radius:50%;background:var(--grad);opacity:.09;filter:blur(90px);pointer-events:none}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);margin-top:clamp(2.2rem,6vh,3.4rem)}
.card{background:var(--white);padding:1.6rem 1.7rem 1.5rem;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:.55rem;min-height:198px;transition:background .18s}
.card:hover{background:#FAF8FC}
.card:hover h3{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.card .kicker{font-size:.64rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gray)}
.card h3{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:var(--black);margin:0}
.card p{font-size:.88rem;color:var(--gray);margin:.15rem 0 0;flex:1;font-weight:300}
.card .sources{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.4rem}
.card .src-chip{font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.28rem .55rem;color:var(--gray);border:1px solid var(--border)}
.card .meta{display:flex;align-items:center;justify-content:space-between;font-size:.72rem;color:var(--gray);margin-top:auto;padding-top:.8rem;border-top:1px solid var(--border);letter-spacing:.02em}
.card .meta strong{font-weight:700;color:var(--black);font-size:.74rem;letter-spacing:0}
.empty{background:var(--white);border:1px solid var(--border);padding:3rem 1.6rem;text-align:center;color:var(--gray);margin-top:clamp(2.2rem,6vh,3.4rem);min-height:140px;display:flex;align-items:center;justify-content:center;font-size:.95rem}

@media (max-width:800px){
  .ctx{display:none}
  .role{display:none}
  .slide{padding-top:clamp(88px,11vh,112px)}
}
`;

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

const PLATFORM_LABELS = { meta: 'Meta Ads', gads: 'Google Ads', ga4: 'GA4', sheets: 'Sheets', other: 'Otro' };

function renderGallery(client, reports) {
  const items = reports
    .map((r) => {
      const uniquePlatforms = [...new Set((r.sources || []).map((s) => s.platform))];
      const chips = uniquePlatforms.length
        ? `<div class="sources">${uniquePlatforms.map((p) => `<span class="src-chip">${esc(PLATFORM_LABELS[p] || p)}</span>`).join('')}</div>`
        : '';
      return `
      <a class="card" href="/${esc(client.slug)}/${esc(r.slug)}">
        <div class="kicker">Informe</div>
        <h3>${esc(r.title)}</h3>
        ${r.description ? `<p>${esc(r.description)}</p>` : '<p></p>'}
        ${chips}
        <div class="meta">
          <span>${esc(fmtDate(r.published_at))}</span>
          ${r.author_name ? `<strong>${esc(r.author_name)}</strong>` : ''}
        </div>
      </a>`;
    })
    .join('');
  const clientLogoTxt = String(client.name || client.slug || '').toLowerCase();
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(client.name)} &#183; Informes</title>
${FONT_LINK}
${FAVICON}
<style>${GALLERY_CSS}</style>
</head>
<body>
<div class="top">
  <div class="gb"></div>
  <nav class="tnav">
    <div class="brand">
      <a class="logo" href="/${esc(client.slug)}">${esc(clientLogoTxt)}<span class="dot"></span></a>
      <span class="x">&#215;</span>
      <a class="logo" href="https://breakmkt.com.ar" target="_blank" rel="noopener">break<span class="dot"></span></a>
      <span class="ctx">Informes publicados</span>
    </div>
    <span class="role">Cliente</span>
  </nav>
</div>
<section class="slide">
  <div class="orb" style="width:520px;height:520px;right:-160px;top:-140px"></div>
  <div class="orb" style="width:360px;height:360px;left:-140px;bottom:-160px;opacity:.07"></div>
  <div class="inner">
    <span class="stag">Informes publicados</span>
    <h1>${esc(client.name)} &#183; <span class="grad-text">Informes</span></h1>
    <p class="lede">Espacio p&#250;blico para ver los informes que Break publica para ${esc(client.name)}. Se actualiza cada vez que se genera un informe nuevo.</p>
    ${reports.length ? `<div class="grid">${items}</div>` : '<div class="empty">Todav&#237;a no hay informes publicados para este cliente.</div>'}
  </div>
</section>
</body>
</html>`;
}

export function createPublicReportsRouter() {
  const router = Router();

  router.get('/:slug', (req, res, next) => {
    const slug = req.params.slug;
    let client;
    try {
      client = { slug, ...getClient(slug) };
    } catch {
      return next();
    }
    const reports = reportsForClient(slug);
    res.set('Content-Type', 'text/html; charset=utf-8').send(renderGallery(client, reports));
  });

  router.get('/:slug/:report', (req, res, next) => {
    const { slug, report } = req.params;
    try { getClient(slug); } catch { return next(); }
    const safe = safeSlug(report);
    if (!safe) return next();
    const html = serveReport(slug, safe);
    if (!html) return next();
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  });

  return router;
}

export function saveReport({ clientSlug, reportSlug, title, description, sources, html, author }) {
  const safeReport = safeSlug(reportSlug);
  if (!safeReport) throw new Error('reportSlug inválido');
  const dir = ensureClientFolder(clientSlug);
  const reportDir = join(dir, safeReport);
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

  let existing = {};
  const metaPath = join(reportDir, 'metadata.json');
  if (existsSync(metaPath)) {
    try { existing = JSON.parse(readFileSync(metaPath, 'utf8')); } catch {}
  }

  const now = new Date().toISOString();
  const metadata = {
    title: title || existing.title || humanize(safeReport),
    description: description || existing.description || '',
    author_id: (author && author.id) || existing.author_id || '',
    author_name: (author && author.name) || existing.author_name || '',
    sources: Array.isArray(sources) && sources.length ? sources : existing.sources || [],
    published_at: existing.published_at || now,
    updated_at: now,
  };

  writeFileSync(join(reportDir, 'index.html'), html, 'utf8');
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');

  return { slug: safeReport, metadata };
}
