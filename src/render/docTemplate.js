const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[-￿]/g, (c) => `&#${c.charCodeAt(0)};`);

const CSS = `
:root{
  --pink:#E8177A; --pink-soft:#fce8f1; --ink:#1a1a1e; --muted:#6b6b76;
  --bg:#fafafa; --card:#ffffff; --line:#e8e8ec; --soft:#f4f4f7; --ok:#0f8a5f;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65;padding:0 20px 80px}
.wrap{max-width:860px;margin:0 auto}
header{padding:56px 0 28px}
.kicker{color:var(--pink);font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
h1{font-size:34px;font-weight:800;letter-spacing:-.02em;margin:10px 0 8px}
.sub{color:var(--muted);font-size:16px;max-width:640px}
.tabs{display:flex;gap:6px;margin:34px 0 26px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.tab{border:none;background:none;font:inherit;font-weight:600;font-size:14.5px;color:var(--muted);padding:10px 14px;cursor:pointer;border-bottom:2.5px solid transparent;margin-bottom:-1px}
.tab.active{color:var(--ink);border-color:var(--pink)}
.panel{display:none}.panel.active{display:block}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px 26px;margin-bottom:18px}
h2{font-size:21px;font-weight:750;letter-spacing:-.01em;margin-bottom:10px}
h3{font-size:16px;font-weight:700;margin:18px 0 6px}
p{margin-bottom:10px}
.callout{border-left:3px solid var(--pink);background:var(--soft);border-radius:0 10px 10px 0;padding:14px 18px;margin:16px 0;font-size:14.5px}
.callout strong{color:var(--pink)}
.flow{display:flex;align-items:stretch;gap:0;flex-wrap:wrap;margin:18px 0}
.node{flex:1;min-width:150px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:14px;text-align:center}
.node b{display:block;font-size:14px}
.node span{font-size:12.5px;color:var(--muted)}
.arrow{display:flex;align-items:center;padding:0 10px;color:var(--pink);font-weight:800;font-size:18px}
.step{display:flex;gap:16px;padding:18px 0;border-bottom:1px solid var(--line)}
.step:last-child{border-bottom:none}
.num{flex:0 0 34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px}
.step h3{margin:2px 0 6px}
.step p,.step li{font-size:14.8px}
ul,ol{padding-left:20px;margin:8px 0}
li{margin-bottom:6px}
code{background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:1.5px 6px;font-size:13px;font-family:"SF Mono",Menlo,Consolas,monospace}
table{width:100%;border-collapse:collapse;font-size:13.8px;margin:12px 0}
th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:2px solid var(--line);padding:8px 10px}
td{border-bottom:1px solid var(--line);padding:9px 10px;vertical-align:top}
td:first-child{font-weight:600;white-space:nowrap}
.tag{display:inline-block;background:var(--pink-soft);color:var(--pink);font-size:11.5px;font-weight:700;border-radius:20px;padding:2px 10px;margin-left:6px;vertical-align:middle}
.ok{color:var(--ok);font-weight:700}
footer{margin-top:40px;color:var(--muted);font-size:13px;text-align:center}
`;

const TABS_JS = `<script>
function show(i,btn){
  const wrap = btn.closest('.tabs-block');
  wrap.querySelectorAll('.panel').forEach((p,idx)=>p.classList.toggle('active',idx===i));
  wrap.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
}
</script>`;

function renderBody(body) {
  if (!body) return '';
  if (typeof body === 'string') return `<p>${esc(body)}</p>`;
  if (Array.isArray(body)) return body.map(renderBlock).join('');
  return renderBlock(body);
}

function renderBlock(b) {
  if (typeof b === 'string') return `<p>${esc(b)}</p>`;
  switch (b.kind) {
    case 'p':
      return `<p>${esc(b.text)}</p>`;
    case 'ul':
      return `<ul>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
    case 'h3':
      return `<h3>${esc(b.text)}</h3>`;
    case 'code':
      return `<p><code>${esc(b.text)}</code></p>`;
    case 'callout':
      return renderCallout(b);
    default:
      return `<p>${esc(JSON.stringify(b))}</p>`;
  }
}

function renderCallout(s) {
  const strong = s.strong ? `<strong>${esc(s.strong)}</strong> ` : '';
  return `<div class="callout">${strong}${esc(s.text || '')}</div>`;
}

function renderCard(s) {
  const titleTag = s.tag ? ` <span class="tag">${esc(s.tag)}</span>` : '';
  const title = s.title ? `<h2>${esc(s.title)}${titleTag}</h2>` : '';
  const body = renderBody(s.body);
  return `<div class="card">${title}${body}</div>`;
}

function renderFlow(s) {
  const nodes = (s.nodes || [])
    .map((n) => `<div class="node"><b>${esc(n.title)}</b><span>${esc(n.sub || '')}</span></div>`)
    .join('<div class="arrow">&#8594;</div>');
  return `<div class="card">${s.title ? `<h2>${esc(s.title)}</h2>` : ''}<div class="flow">${nodes}</div>${
    s.note ? `<p>${esc(s.note)}</p>` : ''
  }</div>`;
}

function renderSteps(s) {
  const items = (s.items || [])
    .map((it, i) => {
      const body = it.body
        ? Array.isArray(it.body)
          ? it.body.map(renderBlock).join('')
          : `<p>${esc(it.body)}</p>`
        : '';
      return `<div class="step"><div class="num">${i + 1}</div><div><h3>${esc(it.title)}</h3>${body}</div></div>`;
    })
    .join('');
  return `<div class="card">${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${items}</div>`;
}

function renderTable(s) {
  const head = s.headers
    ? `<tr>${s.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`
    : '';
  const rows = (s.rows || [])
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="card">${s.title ? `<h2>${esc(s.title)}</h2>` : ''}<table>${head}${rows}</table>${
    s.note ? `<p>${esc(s.note)}</p>` : ''
  }</div>`;
}

function renderSection(s) {
  switch (s.kind) {
    case 'card':
      return renderCard(s);
    case 'callout':
      return renderCallout(s);
    case 'flow':
      return renderFlow(s);
    case 'steps':
      return renderSteps(s);
    case 'table':
      return renderTable(s);
    case 'tabs':
      return renderTabs(s);
    default:
      throw new Error(`Unknown doc section kind: ${s.kind}`);
  }
}

function renderTabs(s) {
  const tabsHtml = (s.items || [])
    .map(
      (t, i) =>
        `<button class="tab${i === 0 ? ' active' : ''}" onclick="show(${i},this)">${esc(t.label)}</button>`,
    )
    .join('');
  const panelsHtml = (s.items || [])
    .map(
      (t, i) =>
        `<section class="panel${i === 0 ? ' active' : ''}">${(t.sections || []).map(renderSection).join('')}</section>`,
    )
    .join('');
  return `<div class="tabs-block"><div class="tabs">${tabsHtml}</div>${panelsHtml}</div>`;
}

export function renderDoc(spec) {
  const kicker = spec.kicker || `Break · ${spec.cliente?.name || 'Sistema'}`;
  const title = spec.title || 'Documento';
  const sub = spec.sub || '';
  const sections = spec.sections || [];
  const footer = spec.footer || `Break · ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`;
  const docTitle = spec.doc_title || title;

  const body = sections.map(renderSection).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(docTitle)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">${esc(kicker)}</div>
    <h1>${esc(title)}</h1>
    ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
  </header>
  ${body}
  <footer>${esc(footer)}</footer>
</div>
${TABS_JS}
</body>
</html>`;
}
