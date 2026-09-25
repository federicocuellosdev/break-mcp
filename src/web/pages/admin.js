import { esc, FONT_LINK, FAVICON } from './common.js';

const CSS = `
:root{
  --black:#1B1B1D; --ink:#1a1a1e; --white:#FFFFFF;
  --bg:#f4f4f6; --card:#ffffff; --line:#e2e2e8; --soft:#f4f4f7;
  --muted:#6b6b80; --text-soft:#8a8a95;
  --pink:#E8177A; --pink-soft:#fce8f1;
  --grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%);
  --w-dim:rgba(255,255,255,.6); --w-faint:rgba(255,255,255,.1);
  --green:#0f8a5f; --coral:#c81c40; --coral-soft:#fdecef;
  --sidebar-w:240px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scrollbar-gutter:stable}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;display:flex;min-height:100vh}

/* ── Sidebar ─────────────────────────────────────────────────────────── */
.sidebar{width:var(--sidebar-w);background:var(--black);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:10}
.gb{height:2px;background:var(--grad)}
.sidebar-logo{display:flex;align-items:baseline;gap:.7rem;padding:1.6rem 1.5rem;border-bottom:1px solid var(--w-faint)}
.sidebar-logo .word{color:var(--white);font-size:1.15rem;font-weight:400;letter-spacing:-.01em}
.sidebar-logo .dot{display:inline-block;width:6px;height:6px;background:var(--grad);border-radius:50%;vertical-align:super}
.sidebar-logo .kicker{color:var(--w-dim);font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.sidebar-who{padding:1.1rem 1.5rem;border-bottom:1px solid var(--w-faint)}
.sidebar-who .name{color:var(--white);font-size:.95rem;font-weight:600}
.sidebar-who .role{display:inline-block;margin-top:.35rem;font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim)}
nav{flex:1;padding:1rem 0;display:flex;flex-direction:column;gap:2px}
.nav-item{display:block;padding:.85rem 1.5rem;color:rgba(255,255,255,.7);text-decoration:none;font-size:.92rem;font-weight:500;transition:all .18s;border-left:3px solid transparent;position:relative}
.nav-item:hover{color:var(--white);background:var(--w-faint)}
.nav-item.active{color:var(--white);background:var(--w-faint)}
.nav-item.active::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--grad)}
.sidebar-footer{padding:1.2rem 1.5rem;border-top:1px solid var(--w-faint)}
.btn-logout{width:100%;background:rgba(255,255,255,.08);color:var(--white);border:1px solid var(--w-faint);border-radius:100px;padding:.55rem 1.1rem;font:600 .72rem 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:background .2s}
.btn-logout:hover{background:rgba(255,255,255,.18)}

/* ── Main ────────────────────────────────────────────────────────────── */
.main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-width:0}
.topbar{background:var(--card);border-bottom:1px solid var(--line);padding:1.15rem 2rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5;min-height:64px}
.topbar-title{font-size:1.05rem;font-weight:600;color:var(--ink)}
.topbar-actions{display:flex;align-items:center;gap:.75rem}

/* ── Sections ────────────────────────────────────────────────────────── */
.section{padding:2rem}
h1{font-size:1.85rem;font-weight:800;letter-spacing:-.02em;margin-bottom:.35rem;line-height:1.1}
h1 .grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.sub{color:var(--muted);font-size:.95rem;margin-bottom:1.6rem;max-width:60ch}

/* ── Filtros toolbar ─────────────────────────────────────────────────── */
.filtros{display:flex;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap;align-items:stretch}
.input-search,.select{padding:.65rem 1.15rem;border:1px solid var(--line);border-radius:100px;font-family:inherit;font-size:.88rem;color:var(--ink);outline:none;background:var(--card);transition:border-color .2s,box-shadow .2s}
.input-search{flex:1;min-width:220px}
.input-search:focus,.select:focus{border-color:var(--pink);box-shadow:0 0 0 3px rgba(232,23,122,.1)}
.select{appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='%236b6b80'><path fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708'/></svg>");background-repeat:no-repeat;background-position:right 14px center;background-color:var(--card);padding-right:36px;cursor:pointer;min-width:170px}
.select:hover{border-color:#bdbdbd}
.btn-fab{width:44px;height:44px;flex-shrink:0;border-radius:50%;border:none;background:var(--ink);color:var(--white);font-size:1.4rem;font-weight:300;cursor:pointer;transition:transform .1s,background .2s;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.btn-fab:hover{background:var(--pink);transform:translateY(-1px)}
.btn-fab:active{transform:translateY(0)}
.filtros .spacer{flex:1}

/* ── Stats grid (dashboard) ──────────────────────────────────────────── */
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.6rem}
.stat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:1.3rem 1.4rem}
.stat b{display:block;font-size:2.1rem;font-weight:800;letter-spacing:-.03em;line-height:1}
.stat span{display:block;margin-top:.55rem;font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.stat.win b{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}

/* ── Card genérica ───────────────────────────────────────────────────── */
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:1.5rem 1.7rem;margin-bottom:1rem}
.card h2{font-size:1.05rem;font-weight:700;letter-spacing:-.005em;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between}
.card h2 .tag{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:var(--pink-soft);color:var(--pink);padding:.28rem .6rem;border-radius:20px}

/* ── Table wrap ──────────────────────────────────────────────────────── */
.table-wrap{background:var(--card);border-radius:16px;border:1px solid var(--line);overflow:hidden;overflow-x:auto}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--bg);border-bottom:2px solid var(--line)}
th{padding:.9rem 1rem;text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);white-space:nowrap;font-weight:700}
tbody tr{border-bottom:1px solid var(--line);transition:background .15s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--bg)}
td{padding:.95rem 1rem;font-size:.9rem;vertical-align:middle}
td:first-child{font-weight:600}
td .muted{color:var(--muted)}
td code{background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:1.5px 6px;font-size:.78rem;font-family:'SF Mono',Menlo,Consolas,monospace}

/* ── Pills / badges ──────────────────────────────────────────────────── */
.pill{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.25rem .6rem;border-radius:100px}
.pill.admin{background:var(--ink);color:var(--white)}
.pill.analyst{background:var(--soft);color:var(--muted)}
.pill.ok{background:#e6f6ee;color:var(--green)}
.pill.warn{background:var(--coral-soft);color:var(--coral)}
.pill.all{background:var(--pink-soft);color:var(--pink)}

/* ── Row actions ─────────────────────────────────────────────────────── */
.row-actions{display:flex;gap:.4rem;justify-content:flex-end;flex-wrap:nowrap}
.row-actions form{margin:0;display:inline}
.btn-row{padding:.4rem .85rem;font:600 .68rem 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:100px;cursor:pointer;text-decoration:none;transition:all .15s;display:inline-block;white-space:nowrap}
.btn-row:hover{border-color:var(--ink)}
.btn-row.danger{color:var(--coral);border-color:#f5c8d1}
.btn-row.danger:hover{background:var(--coral-soft);border-color:var(--coral)}

/* ── Botones topbar / genéricos ──────────────────────────────────────── */
.btn{padding:.55rem 1.1rem;font:600 .72rem 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:100px;cursor:pointer;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:.35rem}
.btn:hover{border-color:var(--ink)}
.btn.primary{background:var(--ink);color:var(--white);border-color:var(--ink)}
.btn.primary:hover{background:var(--pink);border-color:var(--pink)}
.btn.grad{background:var(--grad);color:var(--white);border-color:transparent}
.btn.grad:hover{filter:brightness(1.1)}
.btn.danger{background:var(--card);color:var(--coral);border-color:#f5c8d1}
.btn.danger:hover{background:var(--coral);color:var(--white);border-color:var(--coral)}
.btn.ghost{background:transparent;border-color:var(--line);color:var(--muted)}
.btn.ghost:hover{background:var(--bg);color:var(--ink)}

/* ── Flash ───────────────────────────────────────────────────────────── */
.flash{padding:.9rem 1.15rem;border-radius:100px;margin-bottom:1.4rem;font-size:.87rem;display:flex;align-items:center;gap:.7rem;font-weight:500;max-width:fit-content}
.flash.ok{background:#e6f6ee;color:#0f6045;border:1px solid #b3e0c8}
.flash.err{background:var(--coral-soft);color:#8a1230;border:1px solid #f0c0cc}

/* ── Modal ───────────────────────────────────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(20,20,25,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:2rem;animation:fadeIn .2s ease}
.modal-overlay[hidden]{display:none}
.modal{background:var(--card);border-radius:20px;padding:1.75rem 1.9rem;max-width:560px;width:100%;max-height:calc(100vh - 4rem);overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,.25);animation:modalIn .25s cubic-bezier(.16,1,.3,1)}
.modal h3{font-size:1.25rem;font-weight:800;letter-spacing:-.015em;margin-bottom:.35rem}
.modal .modal-sub{color:var(--muted);font-size:.88rem;margin-bottom:1.3rem}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}

/* ── Form ────────────────────────────────────────────────────────────── */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem 1rem}
.field{display:flex;flex-direction:column}
.field.full{grid-column:1/-1}
.field label{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem}
.field input,.field textarea{width:100%;background:var(--card);border:1px solid var(--line);border-radius:100px;color:var(--ink);font:400 .9rem 'Inter',sans-serif;padding:.65rem 1.05rem;outline:none;transition:border-color .15s,box-shadow .15s}
.field textarea{border-radius:14px;padding:.75rem 1rem}
.field input:focus,.field textarea:focus{border-color:var(--pink);box-shadow:0 0 0 3px rgba(232,23,122,.1)}
.field input[readonly]{background:var(--bg);color:var(--muted)}
.field .hint{font-size:.72rem;color:var(--muted);margin-top:.35rem;line-height:1.4}
.field .hint code{background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:1.5px 5px;font-size:.72rem;font-family:'SF Mono',Menlo,Consolas,monospace;color:var(--ink)}
.form-actions{display:flex;gap:.6rem;margin-top:1.4rem;padding-top:1.2rem;border-top:1px solid var(--line)}
.form-actions .spacer{flex:1}

/* ── Switch ──────────────────────────────────────────────────────────── */
.switch{position:relative;display:inline-block;width:38px;height:22px;vertical-align:middle}
.switch input{opacity:0;width:0;height:0;position:absolute}
.switch-slider{position:absolute;cursor:pointer;inset:0;background:#cfcfd6;transition:background .25s;border-radius:34px}
.switch-slider::before{position:absolute;content:"";height:16px;width:16px;left:3px;top:3px;background:white;transition:transform .25s;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.switch input:checked + .switch-slider{background:var(--grad)}
.switch input:checked + .switch-slider::before{transform:translateX(16px)}
.switch input:focus + .switch-slider{box-shadow:0 0 0 3px rgba(232,23,122,.15)}
.switch-form{display:inline-block;margin:0}

/* ── Platform cards ──────────────────────────────────────────────────── */
.platforms-title{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:1.4rem 0 .75rem}
.platforms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem}
.platform-card{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:1rem .8rem 0.9rem;text-align:center;cursor:pointer;transition:all .18s;position:relative;font-family:inherit}
.platform-card:hover{border-color:var(--pink);transform:translateY(-2px);box-shadow:0 6px 18px rgba(232,23,122,.08)}
.platform-card.active{border-color:var(--pink);background:var(--pink-soft)}
.platform-icon{width:60px;height:44px;margin:0 auto .6rem;display:flex;align-items:center;justify-content:center}
.platform-icon svg,.platform-icon img{display:block;max-width:100%;max-height:100%;object-fit:contain}
.platform-icon svg{height:100%;width:auto}
.platform-icon img{height:100%;width:auto;filter:grayscale(1);opacity:.65;transition:filter .2s,opacity .2s}
.platform-icon img[alt="Meta Ads"]{height:32px}
.platform-card:hover .platform-icon img,.platform-card.active .platform-icon img,.platform-card.has-access .platform-icon img{filter:none;opacity:1}
.platform-name{font-size:.78rem;font-weight:700;color:var(--ink);letter-spacing:-.005em;line-height:1.15}
.platform-count{margin-top:.35rem;font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.platform-count.has{color:var(--pink)}

.accounts-modal-head{display:flex;flex-direction:column;gap:.9rem;margin-bottom:1rem}
.accounts-modal-title{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.accounts-modal-title h3{font-size:1.2rem;font-weight:800;letter-spacing:-.015em;margin:0;color:var(--ink)}
.accounts-modal-title h3 span{color:inherit}
.btn-close{width:36px;height:36px;flex-shrink:0;border-radius:50%;border:none;background:var(--ink);color:var(--white);font-size:1rem;line-height:1;cursor:pointer;transition:background .2s,transform .1s;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit}
.btn-close:hover{background:var(--pink);transform:scale(1.05)}
.accounts-divider{height:1px;background:var(--line);margin:0}
.accounts-modal-note{color:var(--muted);font-size:.85rem;line-height:1.5;margin:0}
.accounts-panel-actions{display:flex;justify-content:flex-end;gap:1rem;padding:.4rem 0 .8rem}
.accounts-panel-actions button{background:none;border:none;color:var(--muted);font:600 .68rem 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;padding:.2rem .4rem;transition:color .15s}
.accounts-panel-actions button:hover{color:var(--pink)}
.accounts-panel-list{max-height:340px;overflow-y:auto}
.accounts-loading{padding:1.4rem .8rem;text-align:center;color:var(--muted);font-size:.85rem}
.accounts-loading.err{color:var(--coral)}
.accounts-loading.warn{color:#8a6d00;background:#fff8e1;border-radius:8px}
.account-row{display:flex;align-items:center;gap:1rem;padding:.9rem .4rem;cursor:pointer;transition:background .12s;font-size:.9rem;border-bottom:1px solid var(--line)}
.account-row:last-child{border-bottom:none}
.account-row:hover{background:var(--soft)}
.account-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--pink);cursor:pointer;flex-shrink:0;margin:0}
.account-row .a-name{flex:1;font-weight:600;color:var(--ink)}
.account-row .a-id{color:var(--muted);font-size:.78rem;font-family:'SF Mono',Menlo,Consolas,monospace;flex-shrink:0}
.account-row .a-badge{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.15rem .45rem;border-radius:100px;background:var(--pink-soft);color:var(--pink)}

/* ── Profile display (read-only) ─────────────────────────────────────── */
.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;align-items:stretch}
.profile-item{display:flex;flex-direction:column;gap:.7rem;padding:.2rem 1.4rem;border-right:1px solid var(--line);min-height:96px;justify-content:flex-start}
.profile-item:first-child{padding-left:0}
.profile-item:last-child{border-right:none;padding-right:0}
.profile-label{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.profile-value{font-size:.95rem;font-weight:500;color:var(--ink)}

/* ── Custom select (pill dropdown) ───────────────────────────────────── */
.cs-wrap{position:relative;display:flex;flex-direction:column}
.cs-btn{width:100%;padding:.65rem 1.05rem;padding-right:2.5rem;border:1px solid var(--line);border-radius:100px;font-family:inherit;font-size:.9rem;outline:none;background:var(--card);cursor:pointer;color:var(--ink);text-align:left;display:inline-flex;align-items:center;justify-content:space-between;gap:.6rem;transition:all .15s;min-height:38px}
.cs-btn:hover{border-color:#bdbdbd}
.cs-wrap.open .cs-btn{border-color:var(--pink);box-shadow:0 0 0 3px rgba(232,23,122,.1)}
.cs-value{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cs-chevron{width:12px;height:12px;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236b6b80'><path fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708'/></svg>") center/contain no-repeat;transition:transform .2s;flex-shrink:0}
.cs-wrap.open .cs-chevron{transform:rotate(180deg)}
.cs-panel{position:absolute;top:calc(100% + 4px);left:0;right:0;min-width:100%;background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.08);padding:.3rem;z-index:200;max-height:280px;overflow-y:auto}
.cs-panel[hidden]{display:none}
.cs-opt{padding:.65rem .9rem;border-radius:10px;cursor:pointer;font-size:.88rem;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:.6rem;transition:background .12s,color .12s}
.cs-opt:hover{background:var(--pink-soft);color:var(--pink)}
.cs-opt.selected{color:var(--pink);font-weight:700}
.cs-opt.selected::after{content:"";width:14px;height:14px;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23E8177A'><path d='M13.485 1.929a.75.75 0 0 1 .086 1.056l-7.5 9a.75.75 0 0 1-1.113.056l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.92 3.918 6.99-8.388a.75.75 0 0 1 1.057-.082'/></svg>") center/contain no-repeat;flex-shrink:0}

/* ── Config MD box ───────────────────────────────────────────────────── */
.md-box{background:var(--ink);color:#e8e8ec;border-radius:14px;padding:1.4rem 1.6rem;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.8rem;line-height:1.55;white-space:pre-wrap;overflow-x:auto;max-height:500px;overflow-y:auto}
.actions{display:flex;gap:.6rem;margin-top:1rem}
.token-box{background:var(--soft);border:1px solid var(--line);border-radius:100px;padding:.6rem 1rem;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.78rem;word-break:break-all;color:var(--ink);margin-top:.35rem}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width:900px){
  body{flex-direction:column}
  .sidebar{position:static;width:100%;height:auto}
  nav{flex-direction:row;overflow-x:auto;padding:.5rem}
  .nav-item{border-left:none;border-bottom:3px solid transparent;padding:.6rem 1rem;white-space:nowrap;flex-shrink:0}
  .nav-item.active::before{display:none}
  .nav-item.active{border-bottom-color:var(--pink)}
  .main{margin-left:0}
  .section{padding:1.4rem}
  .form-grid{grid-template-columns:1fr}
}
`;

const CLIENT_JS = `
(function(){
  window.openModal=function(id){var el=document.getElementById(id);if(el){el.hidden=false;document.body.style.overflow='hidden'}};
  window.closeModal=function(id){var el=document.getElementById(id);if(el){el.hidden=true;document.body.style.overflow=''}};
  document.addEventListener('click',function(e){
    if(e.target.classList.contains('modal-overlay'))closeModal(e.target.id);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){document.querySelectorAll('.modal-overlay:not([hidden])').forEach(function(m){closeModal(m.id)})}
  });

  // Filter search: id=search targets [data-searchable] rows in the next table
  var s=document.getElementById('search');
  if(s){s.addEventListener('input',function(){
    var q=s.value.toLowerCase().trim();
    document.querySelectorAll('[data-searchable]').forEach(function(row){
      var t=(row.textContent||'').toLowerCase();
      row.style.display=(!q||t.indexOf(q)!==-1)?'':'none';
    });
  })}

  // Custom select (pill dropdown replacement)
  document.querySelectorAll('.cs-wrap').forEach(function(wrap){
    var btn=wrap.querySelector('.cs-btn');
    var panel=wrap.querySelector('.cs-panel');
    var value=wrap.querySelector('.cs-value');
    var input=wrap.querySelector('input[type=hidden]');
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var open=wrap.classList.toggle('open');
      panel.hidden=!open;
      document.querySelectorAll('.cs-wrap.open').forEach(function(w){if(w!==wrap){w.classList.remove('open');w.querySelector('.cs-panel').hidden=true}});
    });
    panel.querySelectorAll('.cs-opt').forEach(function(opt){
      opt.addEventListener('click',function(){
        panel.querySelectorAll('.cs-opt').forEach(function(o){o.classList.remove('selected')});
        opt.classList.add('selected');
        value.textContent=opt.dataset.label||opt.textContent;
        if(input)input.value=opt.dataset.value||'';
        wrap.classList.remove('open');panel.hidden=true;
      });
    });
  });
  document.addEventListener('click',function(){
    document.querySelectorAll('.cs-wrap.open').forEach(function(w){w.classList.remove('open');w.querySelector('.cs-panel').hidden=true});
  });

  var PLATFORM_LABELS={meta:'Meta Ads',gads:'Google Ads',ga4:'Google Analytics 4'};

  function containerOf(el){return el.closest('[data-user-id]')}
  function getSelected(container,platform){
    var raw=container.dataset['accounts'+platform.charAt(0).toUpperCase()+platform.slice(1)]||'';
    return new Set(raw.split(',').filter(Boolean));
  }
  function setSelected(container,platform,set){
    container.dataset['accounts'+platform.charAt(0).toUpperCase()+platform.slice(1)]=[...set].join(',');
    var count=set.size;
    var card=container.querySelector('.platform-card[data-p="'+platform+'"]');
    if(card){
      var countEl=card.querySelector('.platform-count');
      if(countEl){
        countEl.textContent=count?(count+' '+(count===1?'cuenta':'cuentas')):'sin acceso';
        countEl.classList.toggle('has',count>0);
      }
      card.classList.toggle('has-access',count>0);
    }
  }

  window.loadAccountsPicker=async function(cardBtn){
    var container=containerOf(cardBtn);
    var platform=cardBtn.dataset.p;
    var modal=document.getElementById('accounts-modal');
    modal.dataset.platform=platform;
    var list=modal.querySelector('.accounts-panel-list');
    var title=modal.querySelector('.accounts-modal-title h3 span');
    container.querySelectorAll('.platform-card').forEach(function(c){c.classList.remove('active')});
    cardBtn.classList.add('active');
    title.textContent=PLATFORM_LABELS[platform];
    openModal('accounts-modal');
    list.innerHTML='<div class="accounts-loading">Cargando cuentas de '+PLATFORM_LABELS[platform]+'...</div>';
    try{
      var r=await fetch('/admin/api/'+platform+'-accounts',{headers:{Accept:'application/json'}});
      var data=await r.json();
      if(!r.ok||data.error){list.innerHTML='<div class="accounts-loading err">Error: '+(data.error||r.status)+'</div>';return}
      var accounts=data.accounts||[];
      if(!accounts.length){list.innerHTML='<div class="accounts-loading warn">'+(data.notice||'No hay cuentas disponibles.')+'</div>';return}
      var sel=getSelected(container,platform);
      list.innerHTML=accounts.map(function(a){
        var badge=a.kind==='owned'?'<span class="a-badge">owned</span>':'';
        return '<label class="account-row">'
          +'<input type="checkbox" value="'+a.id+'" '+(sel.has(String(a.id))?'checked':'')+'>'
          +'<span class="a-name">'+(a.name||'sin nombre')+'</span>'
          +badge
          +'<span class="a-id">'+a.id+'</span>'
          +'</label>';
      }).join('');
      list.querySelectorAll('input[type=checkbox]').forEach(function(cb){
        cb.addEventListener('change',function(){
          var s=getSelected(container,platform);
          if(cb.checked)s.add(cb.value);else s.delete(cb.value);
          setSelected(container,platform,s);
        });
      });
    }catch(e){list.innerHTML='<div class="accounts-loading err">Error: '+e.message+'</div>'}
  };

  window.pickerToggleAll=function(btn,checked){
    var modal=document.getElementById('accounts-modal');
    if(!modal||modal.hidden)return;
    var container=document.querySelector('[data-user-id]');
    var platform=modal.dataset.platform;
    if(!container||!platform)return;
    var s=getSelected(container,platform);
    modal.querySelectorAll('.accounts-panel-list input[type=checkbox]').forEach(function(cb){
      cb.checked=checked;
      if(checked)s.add(cb.value);else s.delete(cb.value);
    });
    setSelected(container,platform,s);
  };

  window.saveUserForm=async function(form,userId,ev){
    ev.preventDefault();
    var modal=form.closest('[data-user-id]');
    var btn=form.querySelector('button[type=submit]');
    if(btn){btn.disabled=true;btn.textContent='Guardando...'}
    var fd=new FormData(form);
    var params=new URLSearchParams();
    for(var pair of fd.entries())params.append(pair[0],pair[1]);
    try{
      var r=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'text/html'},body:params,redirect:'manual'});
      if(!r.ok&&r.status!==0&&r.status<300){
        throw new Error('Error al guardar datos básicos ('+r.status+')');
      }
      for(var p of ['meta','gads','ga4']){
        var ids=getSelected(modal,p);
        await fetch('/admin/users/'+userId+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:p,ids:[...ids]})});
      }
      window.location.href='/admin/users?ok='+encodeURIComponent('Cambios guardados.');
    }catch(e){
      alert('Error: '+e.message);
      if(btn){btn.disabled=false;btn.textContent='Guardar cambios'}
    }
    return false;
  };
})();
`;

function flashBanner(flash) {
  if (!flash) return '';
  const type = flash.type === 'err' ? 'err' : 'ok';
  return `<div class="flash ${type}"><strong>${type === 'ok' ? '&#10003;' : '&#33;'}</strong> ${esc(flash.text || '')}</div>`;
}

function sidebar(user, active) {
  const nav = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin' },
    { key: 'users', label: 'Usuarios', href: '/admin/users', admin: true },
    { key: 'clients', label: 'Clientes', href: '/admin/clients' },
    { key: 'config', label: 'Mi config MCP', href: '/admin/config' },
  ];
  const items = nav
    .filter((n) => !n.admin || user.role === 'admin')
    .map(
      (n) =>
        `<a href="${n.href}" class="nav-item ${n.key === active ? 'active' : ''}">${esc(n.label)}</a>`,
    )
    .join('');
  return `
    <aside class="sidebar">
      <div class="gb"></div>
      <div class="sidebar-logo"><span class="word">break<span class="dot"></span></span><span class="kicker">MCP Admin</span></div>
      <div class="sidebar-who">
        <div class="name">${esc(user.name)}</div>
        <span class="role">${esc(user.role)}</span>
      </div>
      <nav>${items}</nav>
      <div class="sidebar-footer">
        <form method="POST" action="/logout" style="margin:0"><button class="btn-logout" type="submit">Salir</button></form>
      </div>
    </aside>`;
}

function layout({ user, active, title, actions = '', body, flash }) {
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Break &#183; MCP Admin${title ? ` &#8212; ${esc(title)}` : ''}</title>
${FONT_LINK}
${FAVICON}
<style>${CSS}</style>
</head><body>
${sidebar(user, active)}
<main class="main">
  <header class="topbar">
    <div class="topbar-title">${esc(title || '')}</div>
    <div class="topbar-actions">${actions}</div>
  </header>
  <section class="section">
    ${flashBanner(flash)}
    ${body}
  </section>
</main>
<script>${CLIENT_JS}</script>
</body></html>`;
}

/* ─────────── Dashboard ─────────── */
export function renderDashboard({ user, stats }) {
  const firstName = user.name.split(' ')[0];
  const body = `
    <h1>Hola, <span class="grad">${esc(firstName)}</span>.</h1>
    <p class="sub">Consola de break-mcp. Desde ac&#225; controlamos usuarios, clientes y la configuraci&#243;n MCP de cada uno.</p>
    <div class="grid">
      <div class="stat"><b>${stats.users}</b><span>Usuarios</span></div>
      <div class="stat"><b>${stats.clients}</b><span>Clientes en registry</span></div>
      <div class="stat win"><b>${stats.tools}</b><span>Tools MCP activas</span></div>
      <div class="stat"><b>${stats.role === 'admin' ? '&#8734;' : (Array.isArray(stats.myClients) ? stats.myClients.length : stats.clients)}</b><span>Clientes que puedo ver</span></div>
    </div>
    <div class="card">
      <h2>Datos que puedo consultar <span class="tag">tiempo real</span></h2>
      <p style="color:var(--muted)">Meta Ads &#183; Google Ads &#183; Google Analytics 4 &#183; Google Sheets. Cada tool valida permisos por cliente antes de consultar la API.</p>
    </div>`;
  return layout({ user, active: 'dashboard', title: 'Dashboard', body });
}

/* ─────────── Users ─────────── */
function roleSelectCS(currentRole) {
  const opts = [
    { value: 'analyst', label: 'Analyst' },
    { value: 'admin', label: 'Admin' },
  ];
  const cur = opts.find((o) => o.value === currentRole) || opts[0];
  return `
    <div class="cs-wrap">
      <button type="button" class="cs-btn"><span class="cs-value">${esc(cur.label)}</span><span class="cs-chevron"></span></button>
      <input type="hidden" name="role" value="${esc(cur.value)}">
      <div class="cs-panel" hidden>
        ${opts.map((o) => `<div class="cs-opt ${o.value === cur.value ? 'selected' : ''}" data-value="${esc(o.value)}" data-label="${esc(o.label)}">${esc(o.label)}</div>`).join('')}
      </div>
    </div>`;
}

const META_ICON = `<img src="/public/img/platforms/meta-ads.png" alt="Meta Ads">`;
const GADS_ICON = `<img src="/public/img/platforms/google-ads.svg" alt="Google Ads">`;
const GA4_ICON = `<img src="/public/img/platforms/google-analytics-4.svg" alt="Google Analytics 4">`;

const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads', icon: META_ICON },
  { key: 'gads', label: 'Google Ads', icon: GADS_ICON },
  { key: 'ga4', label: 'Google Analytics 4', icon: GA4_ICON },
];

function platformCards(accounts) {
  return PLATFORMS.map((p) => {
    const count = (accounts?.[p.key] || []).length;
    const countText = count ? `${count} ${count === 1 ? 'cuenta' : 'cuentas'}` : 'sin acceso';
    return `
      <button type="button" class="platform-card ${count ? 'has-access' : ''}" data-p="${p.key}" onclick="loadAccountsPicker(this)">
        <div class="platform-icon">${p.icon}</div>
        <div class="platform-name">${esc(p.label)}</div>
        <div class="platform-count ${count ? 'has' : ''}">${countText}</div>
      </button>`;
  }).join('');
}

function userModal({ mode, target, availableClients }) {
  const isEdit = mode === 'edit';
  const t = target || {};
  const modalId = isEdit ? `modal-user-${t.id}` : 'modal-user-new';
  const acc = t.accounts || { meta: [], gads: [], ga4: [] };
  const dataAttrs = isEdit
    ? `data-user-id="${esc(t.id)}" data-accounts-meta="${(acc.meta || []).join(',')}" data-accounts-gads="${(acc.gads || []).join(',')}" data-accounts-ga4="${(acc.ga4 || []).join(',')}"`
    : '';
  return `
<div class="modal-overlay" id="${modalId}" hidden ${dataAttrs}>
  <div class="modal" style="max-width:640px">
    <h3>${isEdit ? 'Editar' : 'Nuevo'} usuario</h3>
    <p class="modal-sub">${isEdit ? `Datos y accesos de <code>${esc(t.id || '')}</code>.` : 'El bearer token se genera autom&#225;ticamente.'}</p>
    <form method="POST" action="${isEdit ? `/admin/users/${esc(t.id)}` : '/admin/users'}" ${isEdit ? `onsubmit="return saveUserForm(this,'${esc(t.id)}','${modalId}',event)"` : ''}>
      <div class="form-grid">
        ${
          !isEdit
            ? `<div class="field">
          <label>ID</label>
          <input name="id" type="text" required autofocus pattern="[a-zA-Z0-9_-]+" placeholder="fede">
        </div>
        <div class="field">
          <label>Nombre</label>
          <input name="name" type="text" required placeholder="Federico Cuellos">
        </div>`
            : `<div class="field">
          <label>Nombre</label>
          <input name="name" type="text" value="${esc(t.name || '')}" required placeholder="Federico Cuellos">
        </div>
        <div class="field">
          <label>Email</label>
          <input name="email" type="email" value="${esc(t.email || '')}" placeholder="fede@break.agency">
        </div>`
        }
        <div class="field">
          <label>Rol</label>
          ${roleSelectCS(t.role || 'analyst')}
        </div>
        <div class="field">
          <label>Contrase&#241;a ${isEdit ? '<span style="opacity:.6;text-transform:none;letter-spacing:0;font-weight:400"> &#183; opcional</span>' : ''}</label>
          <input name="password" type="password" ${isEdit ? '' : 'minlength="6"'} placeholder="${isEdit ? 'Dej&#225; en blanco para no cambiar' : 'M&#237;n. 6 caracteres'}">
        </div>
        ${
          !isEdit
            ? `<div class="field full">
          <label>Email</label>
          <input name="email" type="email" placeholder="fede@break.agency">
        </div>`
            : ''
        }
      </div>

      ${
        isEdit
          ? `
      <div class="platforms-title">Accesos por plataforma</div>
      <div class="platforms-grid">${platformCards(acc)}</div>
      <div class="accounts-panel" hidden>
        <div class="accounts-panel-head">
          <div class="accounts-panel-title">Cuentas de <span>&#8212;</span></div>
          <div class="accounts-panel-actions">
            <button type="button" onclick="pickerToggleAll(this,true)">Todas</button>
            <button type="button" onclick="pickerToggleAll(this,false)">Ninguna</button>
          </div>
        </div>
        <div class="accounts-panel-list"></div>
      </div>

      ${
        t.token
          ? `<div class="platforms-title" style="margin-top:1.4rem">Bearer token</div>
      <div class="token-box">${esc(t.token)}</div>
      <div class="actions"><form method="POST" action="/admin/users/${esc(t.id)}/regen-token" onsubmit="return confirm('Regenerar invalida el token actual. Continuar?')" style="margin:0"><button class="btn ghost" type="submit">Regenerar</button></form></div>`
          : ''
      }`
          : ''
      }

      <div class="form-actions">
        <button type="button" class="btn ghost" onclick="closeModal('${modalId}')">Cancelar</button>
        <div class="spacer"></div>
        <button class="btn primary" type="submit">${isEdit ? 'Guardar cambios' : 'Crear usuario'}</button>
      </div>
    </form>
  </div>
</div>`;
}

export function renderUsersView({ user, users, flash }) {
  const rows = users
    .map(
      (u) => `
      <tr data-searchable data-role="${esc(u.role)}">
        <td>
          <div style="font-weight:600">${esc(u.name)}</div>
          ${u.email ? `<div style="font-size:.75rem;color:var(--muted);margin-top:.15rem">${esc(u.email)}</div>` : ''}
        </td>
        <td><span class="pill ${u.role === 'admin' ? 'admin' : 'analyst'}">${esc(u.role)}</span></td>
        <td>
          <form class="switch-form" method="POST" action="/admin/users/${esc(u.id)}/active">
            <label class="switch" title="${u.active !== false ? 'Cuenta activa' : 'Cuenta desactivada'}">
              <input type="checkbox" name="active" value="true" ${u.active !== false ? 'checked' : ''} onchange="this.form.submit()">
              <span class="switch-slider"></span>
            </label>
          </form>
        </td>
        <td>
          <a class="btn-row" href="/admin/users/${esc(u.id)}/edit">Editar</a>
        </td>
        <td>
          ${
            u.id === user.id
              ? '<span class="muted" style="font-size:.75rem">&#8212;</span>'
              : `<form method="POST" action="/admin/users/${esc(u.id)}/delete" onsubmit="return confirm('Eliminar usuario &quot;${esc(u.id)}&quot;? No se puede deshacer.')" style="margin:0"><button class="btn-row danger" type="submit">Eliminar</button></form>`
          }
        </td>
      </tr>`,
    )
    .join('');

  const body = `
    <div class="filtros">
      <input type="text" id="search" class="input-search" placeholder="Buscar usuario...">
      <div class="spacer"></div>
      <a class="btn-fab" href="/admin/users/new" title="Nuevo usuario">+</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Rol</th><th style="width:80px">Cuenta</th><th style="width:100px">Editar</th><th style="width:100px">Eliminar</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  return layout({ user, active: 'users', title: 'Usuarios', body, flash });
}

/* ─────────── User edit (dedicated page, no modal) ─────────── */
export function renderUserEditView({ user, target, flash }) {
  const t = target || {};
  const acc = t.accounts || { meta: [], gads: [], ga4: [] };
  const dataAttrs = `data-user-id="${esc(t.id)}" data-accounts-meta="${(acc.meta || []).join(',')}" data-accounts-gads="${(acc.gads || []).join(',')}" data-accounts-ga4="${(acc.ga4 || []).join(',')}"`;

  const body = `
  <div id="user-editor" ${dataAttrs}>
    <form method="POST" action="/admin/users/${esc(t.id)}" onsubmit="return saveUserForm(this,'${esc(t.id)}',event)">
      <div class="card">
        <h2>Perfil</h2>
        <div class="profile-grid">
          <div class="profile-item">
            <div class="profile-label">Nombre completo</div>
            <div class="profile-value">${esc(t.name || '&#8212;')}</div>
          </div>
          <div class="profile-item">
            <div class="profile-label">Email</div>
            <div class="profile-value">${esc(t.email || '&#8212;')}</div>
          </div>
          <div class="profile-item">
            <div class="profile-label">Rol</div>
            ${roleSelectCS(t.role || 'analyst')}
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Accesos por plataforma</h2>
        <div class="platforms-grid">${platformCards(acc)}</div>
      </div>

      <div class="form-actions">
        <a class="btn ghost" href="/admin/users">Cancelar</a>
        <div class="spacer"></div>
        <button class="btn primary" type="submit">Guardar cambios</button>
      </div>
    </form>

    <div class="modal-overlay" id="accounts-modal" hidden>
      <div class="modal" style="max-width:640px">
        <div class="accounts-modal-head">
          <div class="accounts-modal-title">
            <h3>Cuentas de <span>&#8212;</span></h3>
            <button type="button" class="btn-close" onclick="closeModal('accounts-modal')" title="Cerrar" aria-label="Cerrar">&#215;</button>
          </div>
          <div class="accounts-divider"></div>
          <p class="accounts-modal-note">Solo se muestran cuentas activas. Para activar o desactivar una cuenta dirigite al administrador de Break en Google Ads.</p>
        </div>
        <div class="accounts-panel-actions">
          <button type="button" onclick="pickerToggleAll(this,true)">Todas</button>
          <button type="button" onclick="pickerToggleAll(this,false)">Ninguna</button>
        </div>
        <div class="accounts-panel-list"></div>
      </div>
    </div>
  </div>`;

  const actions = `<a class="btn" href="/admin/users">&#8592; Usuarios</a>`;
  return layout({
    user,
    active: 'users',
    title: t.name || '',
    actions,
    body,
    flash,
  });
}

/* ─────────── User new (dedicated page) ─────────── */
export function renderUserNewView({ user, flash }) {
  const body = `
    <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1rem">
      <a href="/admin/users" class="btn ghost" style="padding:.4rem .8rem">&#8592; Usuarios</a>
    </div>
    <h1>Nuevo usuario</h1>
    <p class="sub">Cre&#225; la cuenta. El bearer token se genera solo. Despu&#233;s del alta pod&#233;s configurarle los accesos por plataforma.</p>

    <form method="POST" action="/admin/users">
      <div class="card" style="max-width:640px">
        <h2>Datos b&#225;sicos</h2>
        <div class="form-grid">
          <div class="field">
            <label>ID</label>
            <input name="id" type="text" required autofocus pattern="[a-zA-Z0-9_-]+" placeholder="fede">
            <span class="hint">Solo letras, n&#250;meros, guion y underscore.</span>
          </div>
          <div class="field">
            <label>Nombre</label>
            <input name="name" type="text" required placeholder="Federico Cuellos">
          </div>
          <div class="field">
            <label>Email</label>
            <input name="email" type="email" placeholder="fede@break.agency">
          </div>
          <div class="field">
            <label>Rol</label>
            ${roleSelectCS('analyst')}
          </div>
          <div class="field full">
            <label>Contrase&#241;a</label>
            <input name="password" type="password" minlength="6" placeholder="M&#237;n. 6 caracteres">
            <span class="hint">Necesaria para entrar al panel. Sin contrase&#241;a igual funciona el MCP con el bearer.</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <a class="btn ghost" href="/admin/users">Cancelar</a>
        <div class="spacer"></div>
        <button class="btn primary" type="submit">Crear usuario</button>
      </div>
    </form>`;

  return layout({ user, active: 'users', title: 'Nuevo usuario', body, flash });
}

/* ─────────── Clients ─────────── */
function clientModal({ mode, target }) {
  const isEdit = mode === 'edit';
  const t = target || {};
  const modalId = isEdit ? `modal-client-${t.slug}` : 'modal-client-new';
  return `
<div class="modal-overlay" id="${modalId}" hidden>
  <div class="modal">
    <h3>${isEdit ? 'Editar' : 'Nuevo'} cliente</h3>
    <p class="modal-sub">${isEdit ? `Modific&#225; los datos de <code>${esc(t.slug || '')}</code>.` : 'Registr&#225; un cliente con sus ids por plataforma.'}</p>
    <form method="POST" action="${isEdit ? `/admin/clients/${esc(t.slug)}` : '/admin/clients'}">
      <div class="form-grid">
        <div class="field">
          <label>Slug</label>
          <input name="slug" type="text" value="${esc(t.slug || '')}" ${isEdit ? 'readonly' : 'required autofocus pattern="[a-z0-9-]+"'} placeholder="preston">
        </div>
        <div class="field">
          <label>Nombre</label>
          <input name="name" type="text" value="${esc(t.name || '')}" required placeholder="Preston">
        </div>
        <div class="field">
          <label>Meta &#183; ad account id</label>
          <input name="meta_ad_account_id" type="text" value="${esc(t.meta_ad_account_id || '')}" placeholder="act_1234567890">
        </div>
        <div class="field">
          <label>Google Ads &#183; customer id</label>
          <input name="gads_customer_id" type="text" value="${esc(t.gads_customer_id || '')}" placeholder="123-456-7890">
        </div>
        <div class="field full">
          <label>GA4 &#183; property id</label>
          <input name="ga4_property_id" type="text" value="${esc(t.ga4_property_id || '')}" placeholder="123456789">
          <span class="hint">La Service Account tiene que estar como <em>Viewer</em> en esa property.</span>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn ghost" onclick="closeModal('${modalId}')">Cancelar</button>
        <div class="spacer"></div>
        <button class="btn primary" type="submit">${isEdit ? 'Guardar cambios' : 'Crear cliente'}</button>
      </div>
    </form>
  </div>
</div>`;
}

export function renderClientsView({ user, clients, allowedForUser, flash }) {
  const isAdmin = user.role === 'admin';
  const rows = clients
    .map((c) => {
      const mine =
        allowedForUser === null || allowedForUser.includes(c.slug)
          ? '<span class="pill ok">s&#237;</span>'
          : '<span class="pill warn">no</span>';
      return `
      <tr data-searchable>
        <td>${esc(c.name)}</td>
        <td><code>${esc(c.slug)}</code></td>
        <td>${c.meta_ad_account_id ? `<code>${esc(c.meta_ad_account_id)}</code>` : '<span class="muted">&#8212;</span>'}</td>
        <td>${c.gads_customer_id ? `<code>${esc(c.gads_customer_id)}</code>` : '<span class="muted">&#8212;</span>'}</td>
        <td>${c.ga4_property_id ? `<code>${esc(c.ga4_property_id)}</code>` : '<span class="muted">&#8212;</span>'}</td>
        <td>${mine}</td>
        ${
          isAdmin
            ? `<td><div class="row-actions">
                <button class="btn-row" onclick="openModal('modal-client-${esc(c.slug)}')" type="button">Editar</button>
                <form method="POST" action="/admin/clients/${esc(c.slug)}/delete" onsubmit="return confirm('Eliminar cliente &quot;${esc(c.slug)}&quot;? Los usuarios que lo ten&#237;an asignado quedan sin ese acceso.')"><button class="btn-row danger" type="submit">Eliminar</button></form>
              </div></td>`
            : ''
        }
      </tr>`;
    })
    .join('');

  const editModals = isAdmin ? clients.map((c) => clientModal({ mode: 'edit', target: c })).join('') : '';
  const newModal = isAdmin ? clientModal({ mode: 'new', target: null }) : '';

  const body = `
    <div class="filtros">
      <input type="text" id="search" class="input-search" placeholder="Buscar cliente...">
      <div class="spacer"></div>
      ${isAdmin ? '<button type="button" class="btn-fab" onclick="openModal(\'modal-client-new\')" title="Nuevo cliente">+</button>' : ''}
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Slug</th><th>Meta act_id</th><th>Google Ads CID</th><th>GA4 property</th><th>Puedo ver</th>${isAdmin ? '<th style="text-align:right">Acciones</th>' : ''}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${newModal}
    ${editModals}`;

  const actions = isAdmin
    ? `<button class="btn primary" onclick="openModal('modal-client-new')" type="button">+ Nuevo cliente</button>`
    : '';

  return layout({ user, active: 'clients', title: 'Clientes', actions, body, flash });
}

/* ─────────── Config MD ─────────── */
export function renderConfigView({ user, md, mcpUrl }) {
  const body = `
    <h1>Tu archivo <span class="grad">break-mcp-${esc(user.id)}.md</span></h1>
    <p class="sub">Descargalo y guardalo en <code>~/.claude/</code>. Cont&#237;ene tu bearer token del MCP y las instrucciones de uso.</p>
    <div class="card">
      <h2>Contenido</h2>
      <div class="md-box">${esc(md)}</div>
      <div class="actions">
        <a class="btn primary" href="/admin/config.md" download="break-mcp-${esc(user.id)}.md">Descargar .md</a>
        <a class="btn" href="/admin/config.json" download="break-mcp-${esc(user.id)}.json">Descargar .json</a>
      </div>
      <p style="color:var(--muted);font-size:.85rem;margin-top:1rem">Endpoint MCP: <code>${esc(mcpUrl)}</code></p>
    </div>`;
  return layout({ user, active: 'config', title: 'Mi config MCP', body });
}

/* Compat: dedicated form pages (still used if you navigate directly) */
export function renderUserForm({ user, mode, target, availableClients, flash }) {
  return renderUsersView({
    user,
    users: [target].filter(Boolean),
    flash: flash || { type: 'ok', text: 'Us&#225; el modal desde la lista.' },
    availableClients,
  });
}

export function renderClientForm({ user, mode, target, flash }) {
  return renderClientsView({
    user,
    clients: [target].filter(Boolean),
    allowedForUser: null,
    flash: flash || { type: 'ok', text: 'Us&#225; el modal desde la lista.' },
  });
}
