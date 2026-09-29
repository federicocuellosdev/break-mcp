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
:root{--bg:#F5F3F7;--ink:#1B1B1D;--muted:#656467;--card:#FFFFFF;--line:#DDDDDD;--pink:#E13B7D;--soft:#F5F3F7;--dark:#1B1B1D;--w-dim:rgba(255,255,255,.55);--w-faint:rgba(255,255,255,.10);--grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex}
.gb{height:2px;background:var(--grad);position:fixed;top:0;left:0;right:0;z-index:100}
aside.sidebar{width:250px;flex-shrink:0;background:var(--dark);color:#fff;display:flex;flex-direction:column;min-height:100vh;position:sticky;top:0;padding-top:2px}
.sidebar-logo{display:flex;align-items:baseline;gap:.7rem;padding:1.6rem 1.5rem;border-bottom:1px solid var(--w-faint)}
.sidebar-logo .word{color:#fff;font-size:1.15rem;font-weight:400;letter-spacing:-.01em}
.sidebar-logo .dot{display:inline-block;width:6px;height:6px;background:var(--grad);border-radius:50%;vertical-align:super}
.sidebar-who{padding:1.1rem 1.5rem;border-bottom:1px solid var(--w-faint);display:flex;align-items:center;justify-content:space-between;gap:.6rem}
.sidebar-who .name{color:#fff;font-size:.95rem;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-who .role{flex-shrink:0;font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim);padding:.2rem .55rem;border:1px solid var(--w-faint);border-radius:100px}
nav.side-nav{flex:1;padding:1rem 0;display:flex;flex-direction:column;gap:2px}
.nav-item{display:block;padding:.85rem 1.5rem;color:rgba(255,255,255,.7);text-decoration:none;font-size:.92rem;font-weight:500;transition:all .18s;border-left:3px solid transparent;position:relative}
.nav-item:hover{color:#fff;background:var(--w-faint)}
.nav-item.active{color:#fff;background:var(--w-faint)}
.nav-item.active::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--grad)}
.nav-item.sub{padding-left:2.2rem;font-size:.82rem;color:rgba(255,255,255,.55);font-weight:400}
.nav-item.sub:hover{color:#fff}
.sidebar-footer{padding:1.2rem 1.5rem;border-top:1px solid var(--w-faint);font-size:.7rem;color:var(--w-dim);letter-spacing:.05em;line-height:1.5}
.sidebar-footer a{color:var(--w-dim);text-decoration:none}
.sidebar-footer a:hover{color:#fff}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:1.1rem clamp(1rem,4vw,2rem);border-bottom:1px solid var(--line);background:var(--card)}
.topbar-title{font-weight:700;color:var(--ink);letter-spacing:-.01em}
.section{padding:clamp(1.4rem,4vh,2.4rem) clamp(1rem,4vw,2rem)}
.eyebrow{font-size:.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:.6rem}
h1{font-size:clamp(2rem,4.6vw,3.4rem);font-weight:900;letter-spacing:-.03em;line-height:1;text-wrap:balance}
.grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.lede{font-size:1rem;color:var(--muted);margin-top:1rem;max-width:56ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;margin-top:1.8rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:1.4rem 1.5rem;text-decoration:none;color:inherit;transition:transform .15s,border-color .15s,box-shadow .15s;display:flex;flex-direction:column;gap:.5rem;min-height:172px}
.card:hover{border-color:var(--pink);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.06)}
.card .kicker{font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.card h3{font-size:1.1rem;font-weight:700;letter-spacing:-.005em;color:var(--ink);margin:0}
.card p{font-size:.86rem;color:var(--muted);margin:.15rem 0 0;flex:1}
.card .sources{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem}
.card .src-chip{font-size:.62rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:.2rem .5rem;border-radius:100px;background:var(--soft);color:var(--muted);border:1px solid var(--line)}
.card .meta{display:flex;align-items:center;justify-content:space-between;font-size:.72rem;color:var(--muted);margin-top:auto;padding-top:.6rem;border-top:1px solid var(--line)}
.card .meta strong{font-weight:600;color:var(--ink);font-size:.75rem}
.empty{background:var(--card);border:1px dashed var(--line);border-radius:16px;padding:2.4rem 1.6rem;text-align:center;color:var(--muted);margin-top:1.8rem;min-height:120px;display:flex;align-items:center;justify-content:center}
@media (max-width:800px){body{flex-direction:column}aside.sidebar{width:100%;min-height:auto;position:relative}nav.side-nav{flex-direction:row;overflow-x:auto;padding:.5rem}.nav-item{border-left:none;border-bottom:3px solid transparent;white-space:nowrap;padding:.7rem 1rem}.nav-item.active::before{top:auto;left:0;right:0;bottom:0;width:auto;height:3px}}
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
<div class="gb"></div>
<aside class="sidebar">
  <div class="sidebar-logo"><span class="word">break<span class="dot"></span></span></div>
  <div class="sidebar-who">
    <div class="name">${esc(client.name)}</div>
    <span class="role">Cliente</span>
  </div>
  <nav class="side-nav">
    <a class="nav-item active" href="/${esc(client.slug)}">Todos los informes</a>
    ${reports.map((r) => `<a class="nav-item sub" href="/${esc(client.slug)}/${esc(r.slug)}">${esc(r.title)}</a>`).join('')}
  </nav>
  <div class="sidebar-footer">Powered by <a href="https://breakmkt.com.ar" target="_blank" rel="noopener">break</a></div>
</aside>
<div class="main">
  <header class="topbar"><div class="topbar-title">Informes</div></header>
  <section class="section">
    <span class="eyebrow">Informes publicados</span>
    <h1>${esc(client.name)} &#183; <span class="grad-text">Informes</span></h1>
    <p class="lede">Espacio p&#250;blico para ver los informes que Break publica para ${esc(client.name)}. Se actualiza cada vez que se genera un informe nuevo.</p>
    ${reports.length ? `<div class="grid">${items}</div>` : '<div class="empty">Todav&#237;a no hay informes publicados para este cliente.</div>'}
  </section>
</div>
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
