const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[-￿]/g, (c) => `&#${c.charCodeAt(0)};`);

const num = (v) => (typeof v === 'number' ? v.toLocaleString('es-AR') : String(v ?? ''));

const CSS = `
:root{
  --bg:#F5F3F7; --black:#1B1B1D; --dark:#2A292A; --gray:#656467; --light:#DDDDDD; --white:#FFFFFF; --border:#DDDDDD;
  --blue:#0087F2; --purple:#BF4FCD; --pink:#E13B7D; --coral:#EE394D;
  --grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%);
  --w-dim:rgba(255,255,255,.45); --w-faint:rgba(255,255,255,.14);
  color-scheme:light;
}
*{box-sizing:border-box}img{max-width:100%}[hidden]{display:none!important}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--black);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.gb{height:2px;background:var(--grad)}
.top{position:fixed;inset:0 0 auto 0;z-index:50}
nav{display:flex;justify-content:space-between;align-items:center;padding:.9rem clamp(16px,4vw,3rem);background:rgba(245,243,247,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--border)}
.logo{font-size:1.2rem;font-weight:400;letter-spacing:-.01em;color:var(--black)}
.dot{display:inline-block;width:6px;height:6px;background:var(--grad);border-radius:50%;margin-left:1px;vertical-align:super}
.brand{display:flex;align-items:center;gap:.9rem}
.brand .x{color:var(--gray);font-size:.8rem}
.ctx{font-size:.66rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);padding-left:.9rem;border-left:1px solid var(--border)}
.pager{display:flex;gap:6px}
.pager a{width:22px;height:3px;background:#B9B5BF;display:block;transition:background .25s}
.pager a.on{background:var(--grad)}
.slide{min-height:100svh;scroll-snap-align:start;padding:clamp(88px,11vh,116px) clamp(16px,5vw,4.5rem) clamp(40px,6vh,60px);display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
.inner{max-width:1180px;width:100%;margin:0 auto;position:relative}
.s-black{background:var(--black);color:var(--white)}
.s-white{background:var(--white)}
.s-bg{background:var(--bg)}
.stag{display:block;font-size:.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);margin-bottom:1rem}
.s-black .stag{color:var(--w-dim)}
h1,h2,h3{margin:0;text-wrap:balance}
h1{font-size:clamp(2.6rem,6.6vw,6rem);font-weight:900;letter-spacing:-.045em;line-height:.93}
h2{font-size:clamp(1.9rem,3.8vw,3.2rem);font-weight:800;letter-spacing:-.035em;line-height:1.04}
h3{font-size:1.02rem;font-weight:700;letter-spacing:-.01em}
.grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.lede{font-size:clamp(1rem,1.3vw,1.12rem);font-weight:300;color:var(--gray);max-width:56ch;margin:1.2rem 0 0}
.s-black .lede{color:var(--w-dim)}
.num{font-variant-numeric:tabular-nums}
.orb{position:absolute;border-radius:50%;background:var(--grad);opacity:.14;filter:blur(90px);pointer-events:none}
.pnum{position:absolute;right:clamp(16px,5vw,4.5rem);bottom:clamp(18px,4vh,34px);font-size:.66rem;font-weight:600;letter-spacing:.16em;color:var(--gray)}
.s-black .pnum{color:var(--w-dim)}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes drop{from{opacity:.001;transform:translateY(-8px)}to{opacity:1;transform:none}}

.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--w-faint);border:1px solid var(--w-faint);margin-top:clamp(2.2rem,6vh,3.6rem)}
.kpi{background:var(--black);padding:1.5rem 1.5rem 1.3rem}
.kpi b{display:block;font-size:clamp(2.2rem,4.2vw,3.8rem);font-weight:900;letter-spacing:-.045em;line-height:1}
.kpi span{display:block;margin-top:.7rem;font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim)}
.kpi small{display:block;margin-top:.3rem;font-size:.8rem;color:rgba(255,255,255,.7)}
.kpi.win{background:#221f25}

.funnel-wrap{display:grid;grid-template-columns:1fr minmax(0,560px) 1fr;column-gap:clamp(1rem,3vw,2.5rem);margin-top:1.8rem;align-items:stretch}
.f-bands{display:grid;grid-auto-rows:62px;row-gap:5px}
.band{margin:0 auto;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--white);animation:drop .6s ease both}
.band b{font-size:1.55rem;font-weight:900;letter-spacing:-.035em;line-height:1}
.band span{font-size:.64rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase;opacity:.86;margin-top:.25rem}
.band.l{color:var(--black)}
.f-cost,.f-conv{display:grid;grid-auto-rows:62px;row-gap:5px}
.f-cost div{display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right;border-right:1px solid var(--border);padding-right:1rem}
.f-cost small,.f-conv small{font-size:.64rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--gray)}
.f-cost strong{font-size:.95rem;font-weight:700}
.f-conv div{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;border-left:1px solid var(--border);padding-left:1rem}
.f-conv strong{font-size:1.15rem;font-weight:800;letter-spacing:-.02em}
.f-head{font-size:.64rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);margin-bottom:.5rem}
.f-head.r{text-align:right;padding-right:1rem}
.f-head.lft{padding-left:1rem}
.f-head.c{text-align:center}
.f-conv .bad strong{color:var(--coral)}
.f-conv .good strong{color:var(--purple)}
.take{display:flex;gap:1.2rem;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:1.4rem;font-size:.95rem;color:var(--gray);text-align:center}
.take strong{color:var(--black);font-weight:700}
.pill{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:.35rem .6rem;color:var(--white);background:var(--coral)}

.cbar{padding:1rem 0;border-top:1px solid var(--border)}
.cbar:last-child{border-bottom:1px solid var(--border)}
.cbar .row{display:flex;justify-content:space-between;align-items:baseline;gap:1rem}
.cbar .row strong{font-weight:600;font-size:.98rem}
.cbar .row b{font-size:1.4rem;font-weight:900;letter-spacing:-.03em;white-space:nowrap}
.cbar .tr{height:10px;background:rgba(27,27,29,.06);margin-top:.55rem}
.cbar .tr div{height:100%;background:var(--black);transform-origin:left;animation:grow 1.2s cubic-bezier(.16,1,.3,1) both}
.cbar.best .tr div{background:var(--grad)}
.cbar.worst .tr div{background:var(--coral)}
.cbar .meta{font-size:.78rem;color:var(--gray);margin-top:.45rem}

.timeline{display:grid;grid-template-columns:repeat(6,1fr);margin-top:2.4rem;position:relative}
.timeline::before{content:"";position:absolute;left:0;right:0;top:7px;height:2px;background:var(--light)}
.tl{position:relative;padding-right:1rem}
.tl i{display:block;width:16px;height:16px;border-radius:50%;background:var(--bg);border:2px solid var(--black);position:relative;z-index:1}
.tl.end i{background:var(--grad);border:none}
.tl .d{display:block;margin-top:1rem;font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--gray)}
.tl .t{display:block;margin-top:.35rem;font-weight:600;font-size:.92rem;line-height:1.35}
.tl.end .t{font-weight:800}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);margin-top:2.4rem}
.fact{background:var(--white);padding:1.4rem 1.5rem 1.3rem}
.fact b{display:block;font-size:clamp(2.1rem,3.6vw,3rem);font-weight:900;letter-spacing:-.045em;line-height:1}
.fact span{display:block;margin-top:.55rem;font-size:.85rem;color:var(--gray)}

.pipe{display:grid;grid-template-columns:1.25fr 1fr 1fr 1fr;gap:1px;background:var(--w-faint);border:1px solid var(--w-faint);margin-top:2.2rem}
.col{background:var(--black);padding:1.4rem 1.3rem 1.5rem;display:flex;flex-direction:column;gap:.9rem}
.col.hot{background:#232026;position:relative}
.col.hot::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:var(--grad)}
.colh{display:flex;align-items:baseline;justify-content:space-between;gap:.5rem}
.colh span{font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim)}
.colh b{font-size:2.4rem;font-weight:900;letter-spacing:-.04em;line-height:1}
.lead{font-size:.86rem;line-height:1.4}
.lead strong{display:block;font-weight:600;color:var(--white)}
.lead em{font-style:normal;color:rgba(255,255,255,.55)}

.acts{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(2rem,4vw,3.5rem);margin-top:1.6rem}
.acts h3{font-size:.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);margin-bottom:.8rem}
.act{display:grid;grid-template-columns:5.2rem 1fr;gap:1rem;padding:.65rem 0;border-top:1px solid var(--border)}
.act:last-child{border-bottom:1px solid var(--border)}
.act .when{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--purple);padding-top:.2rem}
.act strong{display:block;font-weight:600;font-size:.95rem}
.act span{display:block;font-size:.82rem;color:var(--gray);line-height:1.4}
.dec{background:var(--black);color:var(--white);padding:1.5rem 1.6rem 1.3rem}
.dec h3{color:var(--w-dim)}
.q{padding:.85rem 0;border-top:1px solid var(--w-faint)}
.q strong{display:block;font-weight:600;font-size:.95rem}
.q span{display:block;font-size:.82rem;color:rgba(255,255,255,.55);margin-top:.25rem}

@media (max-width:900px){
  html{scroll-snap-type:none}
  .slide{min-height:auto;padding-block:96px 64px}
  .ctx{display:none}
  .kpis{grid-template-columns:1fr 1fr}
  .acts{grid-template-columns:1fr}
  .pipe{grid-template-columns:1fr 1fr}
  .timeline{grid-template-columns:1fr 1fr 1fr;row-gap:1.8rem}
  .timeline::before{display:none}
  .facts{grid-template-columns:1fr}
  .funnel-wrap{grid-template-columns:1fr 7.5rem;column-gap:.8rem}
  .f-cost,.f-head.r{display:none}
  .pnum{display:none}
}
@media (max-width:540px){.pipe{grid-template-columns:1fr}.timeline{grid-template-columns:1fr 1fr}.pager{display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
`;

const FAVICON =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%230087F2%22/%3E%3Cstop offset=%22.5%22 stop-color=%22%23BF4FCD%22/%3E%3Cstop offset=%221%22 stop-color=%22%23E13B7D%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%231B1B1D%22/%3E%3Ccircle cx=%2216%22 cy=%2216%22 r=%228%22 fill=%22url(%23g)%22/%3E%3C/svg%3E';

const gradText = (s) => `<span class="grad-text">${esc(s)}</span>`;
const titleTwo = (title = []) => {
  const [a, b] = Array.isArray(title) ? title : [title];
  return `${esc(a || '')}${b ? `<br>${gradText(b)}` : ''}`;
};

function renderPortada(s, idx, total) {
  const bg = s.background || 's-black';
  const kpis = (s.kpis || [])
    .map(
      (k) => `
      <div class="kpi${k.win ? ' win' : ''}">
        <b${k.win ? ' class="grad-text"' : ''}>${esc(k.value)}</b>
        <span>${esc(k.label)}</span>
        ${k.sub ? `<small>${esc(k.sub)}</small>` : ''}
      </div>`,
    )
    .join('');
  return `
<section class="slide ${bg}" id="s${idx}">
  ${bg === 's-black' ? `<div class="orb" style="width:520px;height:520px;right:-140px;top:-120px"></div><div class="orb" style="width:360px;height:360px;left:-120px;bottom:-160px;opacity:.09"></div>` : ''}
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h1>${titleTwo(s.title)}</h1>
    ${s.lede ? `<p class="lede">${esc(s.lede)}</p>` : ''}
    ${kpis ? `<div class="kpis num">${kpis}</div>` : ''}
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

function renderEmbudo(s, idx, total) {
  const bg = s.background || 's-bg';
  const bandColors = ['#E4DFEA', '#D2C9DC', '#0087F2', '#5B6FE6', '#9658D6', '#C44BB8', '#E13B7D'];
  const bands = (s.bands || [])
    .map((b, i) => {
      const width = b.width ?? Math.max(30, 100 - i * 12);
      const color = b.color || bandColors[i] || bandColors[bandColors.length - 1];
      const light = i < 2 ? ' l' : '';
      const shrink = 7 + Math.min(6, i);
      return `<div class="band${light}" style="width:${width}%;background:${color};clip-path:polygon(0 0,100% 0,${100 - shrink}% 100%,${shrink}% 100%);animation-delay:${(i * 0.06).toFixed(2)}s"><b>${num(b.value)}</b><span>${esc(b.label)}</span></div>`;
    })
    .join('');
  const costs = (s.costs || [])
    .map((c) => `<div><small>${esc(c.label)}</small><strong>${esc(c.value)}</strong></div>`)
    .join('');
  const convs = (s.conversions || [])
    .map(
      (c) =>
        `<div class="${c.tone || ''}"><small>${esc(c.label)}</small><strong>${esc(c.value)}</strong></div>`,
    )
    .join('');
  const headers = s.headers || {};
  const hCost = headers.costs ?? (costs ? 'Costo de pauta por etapa' : '');
  const hBands = headers.bands ?? 'Etapa';
  const hConv = headers.conversions ?? (convs ? 'Paso' : '');
  const take = s.key
    ? `<div class="take">${s.key.pill ? `<span class="pill">${esc(s.key.pill)}</span>` : ''}<span>${renderInlineMarkdown(s.key.text || '')}</span></div>`
    : '';
  return `
<section class="slide ${bg}" id="s${idx}">
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h2>${titleTwo(s.title)}</h2>
    <div class="funnel-wrap num">
      ${hCost ? `<div class="f-head r">${esc(hCost)}</div>` : '<div></div>'}
      <div class="f-head c">${esc(hBands)}</div>
      ${hConv ? `<div class="f-head lft">${esc(hConv)}</div>` : '<div></div>'}
      <div class="f-cost">${costs}</div>
      <div class="f-bands">${bands}</div>
      <div class="f-conv">${convs}</div>
    </div>
    ${take}
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

function renderInlineMarkdown(text) {
  return esc(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderPauta(s, idx, total) {
  const bg = s.background || 's-bg';
  const bars = (s.bars || [])
    .map(
      (b) => `
      <div class="cbar ${b.variant || ''}">
        <div class="row"><strong>${esc(b.name)}</strong><b>${b.prefix ? `<small>${esc(b.prefix)}</small>` : ''}${esc(b.value)}</b></div>
        <div class="tr"><div style="width:${b.pct ?? 100}%"></div></div>
        ${b.meta ? `<div class="meta">${esc(b.meta)}</div>` : ''}
      </div>`,
    )
    .join('');
  return `
<section class="slide ${bg}" id="s${idx}">
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h2>${titleTwo(s.title)}</h2>
    <div class="num" style="margin-top:2rem">${bars}</div>
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

function renderVenta(s, idx, total) {
  const bg = s.background || 's-white';
  const timeline = (s.timeline || [])
    .map(
      (t, i, arr) => `
      <div class="tl${i === arr.length - 1 ? ' end' : ''}"><i></i><span class="d">${esc(t.date)}</span><span class="t">${esc(t.text)}</span></div>`,
    )
    .join('');
  const facts = (s.facts || [])
    .map(
      (f) => `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`,
    )
    .join('');
  return `
<section class="slide ${bg}" id="s${idx}">
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h2>${titleTwo(s.title)}</h2>
    ${timeline ? `<div class="timeline">${timeline}</div>` : ''}
    ${facts ? `<div class="facts num">${facts}</div>` : ''}
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

function renderPipeline(s, idx, total) {
  const bg = s.background || 's-black';
  const cols = (s.columns || [])
    .map(
      (c) => `
      <div class="col${c.hot ? ' hot' : ''}">
        <div class="colh"><span>${esc(c.label)}</span><b>${num(c.count)}</b></div>
        ${(c.leads || [])
          .map(
            (l) =>
              `<div class="lead"><strong>${esc(l.name)}</strong>${l.detail ? `<em>${esc(l.detail)}</em>` : ''}</div>`,
          )
          .join('')}
      </div>`,
    )
    .join('');
  return `
<section class="slide ${bg}" id="s${idx}">
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h2>${titleTwo(s.title)}</h2>
    <div class="pipe num">${cols}</div>
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

function renderProximos(s, idx, total) {
  const bg = s.background || 's-white';
  const acts = (s.actions || [])
    .map(
      (a) => `
      <div class="act"><span class="when">${esc(a.when)}</span><div><strong>${esc(a.title)}</strong>${a.detail ? `<span>${esc(a.detail)}</span>` : ''}</div></div>`,
    )
    .join('');
  const decisions = (s.decisions || [])
    .map(
      (d) => `<div class="q"><strong>${esc(d.title)}</strong>${d.detail ? `<span>${esc(d.detail)}</span>` : ''}</div>`,
    )
    .join('');
  return `
<section class="slide ${bg}" id="s${idx}">
  <div class="inner">
    ${s.eyebrow ? `<span class="stag">${esc(s.eyebrow)}</span>` : ''}
    <h2>${titleTwo(s.title)}</h2>
    <div class="acts">
      <div>
        <h3>Próximos pasos</h3>
        ${acts}
      </div>
      <div class="dec">
        <h3>Decisiones abiertas</h3>
        ${decisions}
      </div>
    </div>
  </div>
  <span class="pnum">${String(idx).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
</section>`;
}

const RENDERERS = {
  portada: renderPortada,
  embudo: renderEmbudo,
  pauta: renderPauta,
  venta: renderVenta,
  pipeline: renderPipeline,
  proximos: renderProximos,
};

const PAGER_SCRIPT = `
<script>
(function(){
  const slides=[...document.querySelectorAll('.slide')];
  const pager=document.getElementById('pager');
  if(!pager||!slides.length)return;
  pager.innerHTML=slides.map((s,i)=>'<a href="#'+s.id+'" data-i="'+i+'"></a>').join('');
  const links=[...pager.children];
  const set=(i)=>links.forEach((l,j)=>l.classList.toggle('on',i===j));
  set(0);
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting)set(slides.indexOf(e.target))})},{threshold:0.55});
  slides.forEach(s=>io.observe(s));
})();
</script>`;

export function renderReport(spec) {
  const cliente = spec.cliente || { slug: 'cliente', name: 'Cliente' };
  const contexto = spec.contexto || 'Informe';
  const title = spec.title || `${cliente.name} · ${contexto}`;
  const slides = spec.slides || [];
  const total = slides.length;

  const body = slides
    .map((s, i) => {
      const fn = RENDERERS[s.kind];
      if (!fn) throw new Error(`Unknown slide kind: ${s.kind}`);
      return fn(s, i + 1, total);
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">
<link rel="icon" href="${FAVICON}">
<style>${CSS}</style>
</head>
<body>
<div class="top">
  <div class="gb"></div>
  <nav>
    <div class="brand">
      <span class="logo">${esc(cliente.slug)}<span class="dot"></span></span>
      <span class="x">&#215;</span>
      <span class="logo">break<span class="dot"></span></span>
      <span class="ctx">${esc(contexto)}</span>
    </div>
    <div class="pager" id="pager" aria-label="Diapositivas"></div>
  </nav>
</div>
${body}
${PAGER_SCRIPT}
</body>
</html>`;
}
