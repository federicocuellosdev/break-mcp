import { esc, FONT_LINK, FAVICON } from './common.js';
import { listClients } from '../../clients.js';

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
.sidebar-who{padding:1.1rem 1.5rem;border-bottom:1px solid var(--w-faint);display:flex;align-items:center;justify-content:space-between;gap:.6rem}
.sidebar-who .name{color:var(--white);font-size:.95rem;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-who .role{flex-shrink:0;font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim);padding:.2rem .55rem;border:1px solid var(--w-faint);border-radius:100px}
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
.topbar{background:var(--card);border-bottom:1px solid var(--line);padding:0 2rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5;height:68px;flex-shrink:0}
.topbar-title{font-size:1.05rem;font-weight:600;color:var(--ink)}
.topbar-actions{display:flex;align-items:center;gap:.75rem;min-height:38px}
.btn-back{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem .5rem;background:transparent;border:none;color:var(--muted);font:600 .72rem 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;transition:color .15s;cursor:pointer;line-height:1}
.btn-back:hover{color:var(--ink)}
.btn-back svg,.btn-back .arrow{font-size:1rem;line-height:1}

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
.btn-fab{width:44px;height:44px;flex-shrink:0;border-radius:50%;border:none;background:var(--ink);color:var(--white);cursor:pointer;transition:transform .1s,background .2s;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.1);text-decoration:none;padding:0;font-family:inherit}
.btn-fab svg{width:20px;height:20px}
.btn-fab.txt{font-size:1.5rem;font-weight:500;line-height:1;padding-bottom:2px}
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

.accounts-modal-head{display:flex;flex-direction:column;gap:.7rem;margin-bottom:.5rem}
.accounts-modal-title{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.accounts-modal-title h3{font-size:1.2rem;font-weight:800;letter-spacing:-.015em;margin:0;color:var(--ink)}
.accounts-modal-title h3 span{color:inherit}
.modal-title-actions{display:flex;align-items:center;gap:.35rem;flex-shrink:0}
.btn-close,.btn-save-icon{width:32px;height:32px;flex-shrink:0;border-radius:50%;border:none;background:transparent;color:var(--muted);font-size:1.15rem;line-height:1;cursor:pointer;transition:background .18s,color .18s,opacity .18s,transform .18s;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit}
.btn-close:hover{background:var(--soft);color:var(--ink)}
.btn-close svg,.btn-save-icon svg{width:18px;height:18px}
.btn-save-icon{color:var(--white);background:var(--grad);opacity:0;transform:scale(.8);pointer-events:none}
.btn-save-icon.visible{opacity:1;transform:scale(1);pointer-events:auto}
.btn-save-icon:hover{filter:brightness(1.1)}
.accounts-divider{height:1px;background:var(--line);margin:0}
.accounts-modal-note{color:var(--muted);font-size:.85rem;line-height:1.5;margin:0}
.accounts-modal-columns{display:flex;align-items:center;gap:1rem;padding:.9rem 1rem;background:var(--bg);border-bottom:2px solid var(--line);border-radius:10px 10px 0 0;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap;margin-top:.4rem}
.accounts-modal-columns input[type=checkbox]{width:18px;height:18px;accent-color:var(--pink);cursor:pointer;flex-shrink:0;margin:0}
.accounts-modal-columns .col-name{flex:1}
.accounts-modal-columns .col-status{width:110px;flex-shrink:0}
.accounts-modal-columns .col-id{width:120px;flex-shrink:0;text-align:right}
.col-status-dropdown{position:relative;display:inline-flex}
.col-status-btn{display:inline-flex;align-items:center;gap:.3rem;background:none;border:none;padding:0;font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;cursor:pointer;outline:none;transition:color .15s}
.col-status-btn:hover,.col-status-dropdown.open .col-status-btn{color:var(--ink)}
.col-status-btn svg{width:14px;height:14px;flex-shrink:0;transition:transform .2s;color:var(--ink)}
.col-status-dropdown.open .col-status-btn svg{transform:rotate(180deg);color:var(--pink)}
.col-status-menu{position:absolute;top:calc(100% + .5rem);left:-.4rem;min-width:170px;background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.1);padding:.3rem;z-index:120}
.col-status-menu[hidden]{display:none}
.col-status-opt{padding:.6rem .8rem;border-radius:8px;cursor:pointer;font:600 .72rem 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;justify-content:space-between;gap:.6rem;transition:background .12s,color .12s;white-space:nowrap}
.col-status-opt:hover{background:var(--pink-soft);color:var(--pink)}
.col-status-opt.selected{color:var(--pink);font-weight:800}
.col-status-opt.selected::after{content:"";width:12px;height:12px;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23E8177A'><path d='M13.485 1.929a.75.75 0 0 1 .086 1.056l-7.5 9a.75.75 0 0 1-1.113.056l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.92 3.918 6.99-8.388a.75.75 0 0 1 1.057-.082'/></svg>") center/contain no-repeat;flex-shrink:0}
.accounts-panel-list{max-height:340px;overflow-y:auto;border:1px solid var(--line);border-top:none;border-radius:0 0 10px 10px}
.account-row .a-status{width:110px;flex-shrink:0}
.account-row .a-id{width:120px;flex-shrink:0;text-align:right}
.status-pill{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.18rem .5rem;border-radius:100px}
.status-pill.enabled{background:#e6f6ee;color:var(--green)}
.status-pill.canceled,.status-pill.closed{background:var(--soft);color:var(--muted)}
.status-pill.suspended{background:var(--coral-soft);color:var(--coral)}
.status-pill.unknown{background:var(--soft);color:var(--muted)}
.accounts-loading{padding:1.4rem .8rem;text-align:center;color:var(--muted);font-size:.85rem}
.accounts-loading.err{color:var(--coral)}
.accounts-loading.warn{color:#8a6d00;background:#fff8e1;border-radius:8px}
.account-row{display:flex;align-items:center;gap:1rem;padding:.9rem 1rem;cursor:pointer;transition:background .12s;font-size:.9rem;border-bottom:1px solid var(--line)}
.account-row:last-child{border-bottom:none}
.account-row:hover{background:var(--soft)}
.account-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--pink);cursor:pointer;flex-shrink:0;margin:0}
.account-row .a-name{flex:1;font-weight:600;color:var(--ink)}
.account-row .a-id{color:var(--muted);font-size:.78rem;font-family:'SF Mono',Menlo,Consolas,monospace;flex-shrink:0}
.account-row .a-badge{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.15rem .45rem;border-radius:100px;background:var(--pink-soft);color:var(--pink)}

/* ── Profile display (read-only) ─────────────────────────────────────── */
.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;align-items:stretch}
.profile-grid-4{grid-template-columns:repeat(4,1fr)}
.profile-item{display:flex;flex-direction:column;gap:.7rem;padding:.2rem 1.4rem;border-right:1px solid var(--line);min-height:96px;justify-content:flex-start}
.profile-item:first-child{padding-left:0}
.profile-item:last-child{border-right:none;padding-right:0}
.profile-label{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.profile-value{font-size:.95rem;font-weight:500;color:var(--ink)}
.regen-cred-btn{display:inline-flex;align-items:center;padding:.6rem 1.1rem;font-size:.78rem;letter-spacing:.06em;align-self:flex-start}

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

/* ── Client accounts list (per platform, 3-col grid) ─────────────────── */
.acc-list-container{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
.acc-list-block{border:1px solid var(--line);border-radius:14px;background:var(--card);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.acc-list-head{display:flex;align-items:center;gap:.7rem;padding:.7rem .9rem;background:var(--bg);border-bottom:1px solid var(--line)}
.acc-list-head-icon{height:22px;width:auto;max-width:36px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center}
.acc-list-head-icon img,.acc-list-head-icon svg{height:100%;width:auto;max-width:100%}
.acc-list-head-name{flex:1;font-weight:700;color:var(--ink);font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.acc-list-head .btn-row{padding:.3rem .6rem;font-size:.6rem}
.acc-list-rows{display:flex;flex-direction:column;min-height:60px}
.acc-list-row{display:flex;align-items:center;gap:.55rem;padding:.7rem .9rem;border-bottom:1px solid var(--line);transition:background .12s;min-width:0}
.acc-list-row:last-child{border-bottom:none}
.acc-list-row:hover{background:var(--soft)}
.acc-list-name{flex:1;font-weight:600;color:var(--ink);font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.acc-list-id-pill{display:inline-block;padding:.22rem .6rem;border-radius:100px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.7rem;background:var(--soft);color:var(--muted);flex-shrink:0;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acc-list-id-pill.enabled{background:#e6f6ee;color:var(--green)}
.acc-list-id-pill.suspended{background:var(--coral-soft);color:var(--coral)}
.acc-list-id-pill.canceled,.acc-list-id-pill.closed{background:var(--soft);color:var(--muted)}
.acc-list-empty{padding:1.2rem 1rem;text-align:center;color:var(--muted);font-size:.8rem;background:var(--soft);flex:1;display:flex;align-items:center;justify-content:center}
@media (max-width:1100px){.acc-list-container{grid-template-columns:1fr}}

/* ── Client access chips (per-client platform toggles) ───────────────── */
.clients-access-list{display:flex;flex-direction:column;gap:.5rem}
.client-access-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 1rem;border:1px solid var(--line);border-radius:12px;background:var(--card);transition:border-color .15s}
.client-access-row:hover{border-color:#d0d0d8}
.client-access-name{font-weight:600;color:var(--ink);font-size:.95rem;flex:1;min-width:0}
.client-access-chips{display:flex;gap:.4rem;flex-shrink:0}
.ct-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .75rem .35rem .5rem;border:1px solid var(--line);border-radius:100px;background:var(--card);color:var(--muted);font:600 .7rem 'Inter',sans-serif;letter-spacing:.04em;cursor:pointer;transition:all .15s;font-family:inherit}
.ct-chip:hover:not(.disabled){border-color:var(--ink);color:var(--ink)}
.ct-chip.active{background:var(--pink-soft);border-color:var(--pink);color:var(--pink)}
.ct-chip.active .ct-icon img,.ct-chip.active .ct-icon svg{filter:none;opacity:1}
.ct-chip.disabled{opacity:.4;cursor:not-allowed}
.ct-icon{width:18px;height:14px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.ct-icon img,.ct-icon svg{max-width:100%;max-height:100%;width:auto;height:100%;filter:grayscale(1);opacity:.55;transition:filter .18s,opacity .18s}
.ct-chip:hover:not(.disabled) .ct-icon img,.ct-chip:hover:not(.disabled) .ct-icon svg{filter:none;opacity:1}

/* ── Client budgets ──────────────────────────────────────────────────── */
.budget-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.budget-card{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:1rem 1.15rem;display:flex;flex-direction:column;gap:.75rem}
.budget-head{display:flex;align-items:center;gap:.6rem}
.budget-icon{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.budget-icon img,.budget-icon svg{width:100%;height:100%;object-fit:contain}
.budget-label{font:600 .9rem 'Inter',sans-serif;color:var(--ink)}
.budget-input-wrap{position:relative;display:flex;align-items:center;border:1px solid var(--line);border-radius:100px;padding:.35rem .55rem .35rem 1rem;transition:border-color .15s}
.budget-input-wrap:focus-within{border-color:var(--pink)}
.budget-input-wrap .prefix{color:var(--muted);font:600 .85rem 'Inter',sans-serif;letter-spacing:.02em;margin-right:.3rem}
.budget-input-wrap input{flex:1;border:none;outline:none;background:transparent;font:600 .95rem 'Inter',sans-serif;color:var(--ink);min-width:0;padding:.35rem 0;-moz-appearance:textfield}
.budget-input-wrap input::-webkit-outer-spin-button,.budget-input-wrap input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.budget-input-wrap .suffix{color:var(--muted);font:500 .72rem 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-left:.4rem}
.budget-field{display:flex;flex-direction:column;gap:.35rem}
.budget-sublabel{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.budget-hint{font-size:.72rem;color:var(--muted)}

/* ── Dashboard news feed ─────────────────────────────────────────────── */
.dash-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1.4rem;margin-top:2rem;align-items:start}
@media (max-width:1100px){.dash-layout{grid-template-columns:1fr}}
.dash-section{margin-bottom:1.8rem}
.dash-section:last-child{margin-bottom:0}
.dash-section-title{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:.8rem}
.news-feed{display:flex;flex-direction:column;gap:.9rem}
.news-item{display:flex;gap:1.1rem;padding:1.1rem 1.3rem;border:1px solid var(--line);border-radius:14px;background:var(--card);transition:border-color .15s,transform .15s}
.news-item:hover{border-color:var(--pink)}
.news-icon{width:44px;height:44px;flex-shrink:0;border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center}
.news-icon img,.news-icon svg{width:24px;height:24px;object-fit:contain}
.news-body{flex:1;min-width:0}
.news-head{display:flex;align-items:center;gap:.55rem;margin-bottom:.25rem}
.news-tag{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:.15rem .55rem;border-radius:100px;background:#e6f6ee;color:var(--green)}
.news-date{font-size:.72rem;color:var(--muted);letter-spacing:.04em}
.news-title{font-size:1rem;font-weight:700;color:var(--ink);letter-spacing:-.005em;margin:0}
.news-text{font-size:.85rem;color:var(--muted);margin-top:.3rem;line-height:1.5}
.dash-aside-wrap{position:sticky;top:1rem}
.dash-aside{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:1.2rem;display:flex;flex-direction:column;gap:1rem}
.aside-head{display:flex;align-items:center;gap:.6rem}
.aside-head .icon{width:56px;height:56px;border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.aside-head .icon svg,.aside-head .icon img{width:40px;height:40px;object-fit:contain}
.aside-head .titles h4{font-size:.9rem;font-weight:700;color:var(--ink);margin:0}
.aside-head .titles span{font-size:.68rem;color:var(--muted)}
.aside-hero-label{font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:.2rem}
.aside-hero-value{font:800 2.1rem 'Inter',sans-serif;color:var(--ink);letter-spacing:-.02em;line-height:1}
.aside-sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;padding-top:.7rem;border-top:1px solid var(--line)}
.aside-sub-cell{display:flex;flex-direction:column;gap:.15rem}
.aside-sub-label{font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.aside-sub-value{font:600 .95rem 'Inter',sans-serif;color:var(--ink);letter-spacing:-.01em}
.aside-foot{font-size:.68rem;color:var(--muted);line-height:1.4}
.alerts-empty{border:1px dashed var(--line);border-radius:14px;padding:1.2rem 1.3rem;color:var(--muted);font-size:.85rem;background:var(--card);min-height:80px;display:flex;align-items:center}
.alerts-list{display:flex;flex-direction:column;gap:.5rem}
.alert-item{display:flex;align-items:center;gap:.85rem;padding:.85rem 1rem;border:1px solid var(--line);border-radius:12px;background:var(--card);border-left-width:4px}
.alert-item.warn{border-left-color:#F6B40E}
.alert-item.over{border-left-color:var(--coral)}
.alert-item .alert-icon{width:32px;height:32px;border-radius:8px;background:var(--soft);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.alert-item .alert-icon img,.alert-item .alert-icon svg{width:20px;height:20px;object-fit:contain}
.alert-item .alert-body{flex:1;min-width:0}
.alert-item .alert-title{font-weight:600;font-size:.88rem;color:var(--ink)}
.alert-item .alert-text{font-size:.78rem;color:var(--muted);margin-top:.15rem}
.alert-item .alert-pill{font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.25rem .6rem;border-radius:100px;flex-shrink:0}
.alert-item .alert-pill.warn{background:#fff3d1;color:#8a6d00}
.alert-item .alert-pill.over{background:var(--coral-soft);color:var(--coral)}
.alert-loading{padding:.9rem 1rem;color:var(--muted);font-size:.8rem}

/* ── Investment section ─────────────────────────────────────────────── */
.inv-toolbar{display:flex;align-items:center;gap:.8rem;margin-bottom:1.4rem;flex-wrap:wrap}
.inv-toolbar .presets{display:flex;gap:.45rem}
.inv-preset{background:var(--card);border:1px solid var(--line);border-radius:100px;padding:.7rem 1.3rem;font:600 .74rem 'Inter',sans-serif;letter-spacing:.05em;color:var(--muted);cursor:pointer;transition:all .15s}
.inv-preset:hover{border-color:var(--ink);color:var(--ink)}
.inv-preset.active{background:var(--pink-soft);border-color:var(--pink);color:var(--pink)}
.rp{position:relative}
.rp-trigger{display:inline-flex;align-items:center;gap:.55rem;padding:.7rem 1.2rem;border:1px solid var(--line);border-radius:100px;background:var(--card);font:600 .78rem 'Inter',sans-serif;color:var(--ink);cursor:pointer;transition:border-color .15s}
.rp-trigger:hover{border-color:var(--ink)}
.rp-trigger.open{border-color:var(--pink)}
.rp-trigger svg{width:14px;height:14px;color:var(--muted)}
.rp-trigger .sep{color:var(--muted)}
.rp-panel{position:absolute;top:calc(100% + .5rem);right:0;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,.12);z-index:120;padding:1rem;min-width:640px}
.rp-panel[hidden]{display:none}
.rp-months{display:flex;gap:1.5rem}
.rp-cal{flex:1;min-width:260px}
.rp-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem;padding:0 .2rem}
.rp-cal-title{font:700 .82rem 'Inter',sans-serif;color:var(--ink);letter-spacing:-.005em;text-transform:capitalize}
.rp-nav{display:flex;gap:.2rem}
.rp-nav button{width:26px;height:26px;border:none;background:transparent;border-radius:50%;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
.rp-nav button:hover{background:var(--soft);color:var(--ink)}
.rp-nav button:disabled{opacity:.3;cursor:not-allowed}
.rp-nav svg{width:14px;height:14px}
.rp-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:0;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:0 .1rem .4rem}
.rp-dow span{text-align:center;padding:.2rem 0}
.rp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.rp-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font:500 .78rem 'Inter',sans-serif;color:var(--ink);cursor:pointer;border-radius:8px;transition:background .12s,color .12s;position:relative;user-select:none}
.rp-cell.out{color:var(--muted);opacity:.4}
.rp-cell:hover:not(.disabled):not(.out){background:var(--soft)}
.rp-cell.in-range{background:var(--pink-soft);border-radius:0;color:var(--pink)}
.rp-cell.start,.rp-cell.end{background:var(--pink);color:#fff;font-weight:700;border-radius:8px;z-index:1}
.rp-cell.start.has-range{border-radius:8px 0 0 8px}
.rp-cell.end.has-range{border-radius:0 8px 8px 0}
.rp-cell.today:not(.start):not(.end){box-shadow:inset 0 0 0 1px var(--ink)}
.rp-cell.disabled{opacity:.2;cursor:not-allowed}
.rp-foot{display:flex;align-items:center;justify-content:space-between;margin-top:.9rem;padding-top:.8rem;border-top:1px solid var(--line);gap:1rem}
.rp-info{font-size:.72rem;color:var(--muted)}
.rp-info strong{color:var(--ink);font-weight:600}
.rp-btns{display:flex;gap:.4rem}
.rp-btn{padding:.5rem 1rem;border-radius:100px;border:1px solid var(--line);background:var(--card);font:600 .72rem 'Inter',sans-serif;letter-spacing:.06em;color:var(--muted);cursor:pointer;transition:all .15s}
.rp-btn:hover{border-color:var(--ink);color:var(--ink)}
.rp-btn.primary{background:var(--pink);border-color:var(--pink);color:#fff}
.rp-btn.primary:hover{background:var(--pink);opacity:.9;color:#fff}
.rp-btn:disabled{opacity:.4;cursor:not-allowed}
.inv-list{display:flex;flex-direction:column;gap:.8rem}
.inv-card{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:1rem 1.2rem}
.inv-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;gap:.6rem}
.inv-card-title{font:700 .95rem 'Inter',sans-serif;color:var(--ink);letter-spacing:-.005em}
.inv-card-edit{width:30px;height:30px;border-radius:50%;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:background .15s,color .15s}
.inv-card-edit:hover{background:var(--soft);color:var(--pink)}
.inv-card-edit svg{width:15px;height:15px}
.inv-card-link{font-size:.72rem;color:var(--muted);text-decoration:none;letter-spacing:.04em}
.inv-card-link:hover{color:var(--pink)}
.inv-grid{display:grid;grid-template-columns:1fr 130px 130px 130px 240px;gap:1.4rem;align-items:center}
.inv-col-head{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:.35rem 0 .15rem}
.inv-col-head.right{text-align:right}
.inv-card-title-cell{display:flex;align-items:center;gap:.4rem;padding:.35rem 0 .15rem}
.inv-grid-divider{grid-column:1 / -1;height:1px;background:var(--line);margin:0}
.inv-plat-row{display:contents}
.inv-plat-row > *{padding:.55rem 0}
.inv-num.resto{color:var(--green)}
.inv-num.resto.over{color:var(--coral)}
.inv-plat-name{display:flex;align-items:center;gap:.55rem;font:600 .82rem 'Inter',sans-serif;color:var(--ink)}
.inv-plat-name .ic{width:18px;height:18px;display:inline-flex;flex-shrink:0}
.inv-plat-name .ic img,.inv-plat-name .ic svg{width:100%;height:100%;object-fit:contain}
.inv-num{text-align:right;font:600 .86rem 'Inter',sans-serif;color:var(--ink);font-variant-numeric:tabular-nums}
.inv-num.muted{color:var(--muted);font-weight:500}
.inv-consumo{display:flex;align-items:center;gap:.8rem;justify-content:flex-end}
.inv-bar-wrap{position:relative;background:var(--soft);border-radius:100px;height:8px;overflow:hidden;flex:1;max-width:220px}
.inv-bar-fill{position:absolute;top:0;left:0;bottom:0;background:var(--green);transition:width .3s}
.inv-bar-fill.warn{background:#F6B40E}
.inv-bar-fill.over{background:var(--coral)}
.inv-bar-fill.neutral{background:var(--line)}
.inv-pct{font:700 .78rem 'Inter',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.02em;min-width:52px;text-align:right}
.inv-pct.ok{color:var(--green)}
.inv-pct.warn{color:#8a6d00}
.inv-pct.over{color:var(--coral)}
.inv-pct.muted{color:var(--muted);font-weight:500;font-size:.7rem}
.inv-plat-empty{padding:.7rem 0;color:var(--muted);font-size:.82rem}
.inv-plat-empty a{color:var(--pink);text-decoration:none}
.inv-plat-empty a:hover{text-decoration:underline}
.inv-empty{border:1px dashed var(--line);border-radius:14px;padding:1.5rem;text-align:center;color:var(--muted);font-size:.85rem;background:var(--card)}
.inv-loading{padding:1.2rem;text-align:center;color:var(--muted);font-size:.8rem}

/* ── Credenciales one-shot ───────────────────────────────────────────── */
.creds-card{border-color:var(--pink);background:linear-gradient(180deg,var(--pink-soft) 0%,var(--card) 60%)}
.creds-grid{display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem}
.creds-row{display:flex;align-items:center;gap:1rem;padding:.6rem .9rem;background:var(--card);border:1px solid var(--line);border-radius:10px}
.creds-label{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700;width:110px;flex-shrink:0}
.creds-value{flex:1;min-width:0}
.creds-value code{font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.9rem;color:var(--ink);background:transparent;padding:0;word-break:break-all}
.creds-actions{display:flex;justify-content:flex-end}
.creds-actions .btn.primary{display:inline-flex;align-items:center}

/* ── Logs table ──────────────────────────────────────────────────────── */
.logs-table td{vertical-align:top}
.logs-table .log-date{font-size:.8rem;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.logs-table .log-hora{color:var(--ink);opacity:.55;margin-left:.35rem}
.logs-table .log-user-name{font-weight:600;color:var(--ink);font-size:.85rem}
.logs-table .log-user-id{font-size:.7rem;color:var(--muted);font-family:'SF Mono',Menlo,Consolas,monospace;margin-top:.1rem}
.logs-table .log-title{font-weight:600;color:var(--ink);font-size:.88rem;line-height:1.35}
.logs-table .log-desc{font-size:.82rem;color:var(--ink);opacity:.85;line-height:1.5;max-width:520px}
.logs-table .log-desc-text{white-space:pre-wrap;word-break:break-word}
.logs-table .log-actions{display:flex;gap:.35rem;align-items:center;padding-top:.9rem}

/* ── Users with access to a client ───────────────────────────────────── */
.users-access-list{display:flex;flex-direction:column;gap:.4rem}
.user-access-row{display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;border:1px solid var(--line);border-radius:12px;background:var(--card);transition:border-color .15s}
.user-access-row:hover{border-color:var(--pink)}
.user-access-info{flex:1;min-width:0}
.user-access-name-row{display:flex;align-items:center;gap:.5rem}
.user-access-name{font-weight:600;color:var(--ink);font-size:.92rem}
.user-access-email{font-size:.75rem;color:var(--muted);margin-top:.15rem}
.user-access-chips{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}

/* ── URL cell in clients table ───────────────────────────────────────── */
.url-cell-plain{display:inline-flex;align-items:center;gap:.4rem;max-width:100%}
.url-cell-plain a{font-family:'SF Mono',Menlo,Consolas,monospace;font-size:.82rem;color:var(--ink);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;transition:color .15s}
.url-cell-plain a:hover{color:var(--pink);text-decoration:underline}
.icon-btn-mini{width:26px;height:26px;flex-shrink:0;border-radius:50%;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:background .15s,color .15s;display:flex;align-items:center;justify-content:center;padding:0}
.icon-btn-mini:hover{background:var(--soft);color:var(--ink)}
.icon-btn-mini svg{width:14px;height:14px}

/* ── Icon actions (edit/delete in table) ─────────────────────────────── */
.icon-action{width:32px;height:32px;border-radius:50%;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:background .15s,color .15s;display:inline-flex;align-items:center;justify-content:center;padding:0;text-decoration:none}
.icon-action:hover{background:var(--soft);color:var(--ink)}
.icon-action.danger:hover{background:var(--coral-soft);color:var(--coral)}
.icon-action svg{width:16px;height:16px}

/* ── Wizard ──────────────────────────────────────────────────────────── */
.wizard-progress{display:flex;align-items:center;gap:.6rem;padding:.3rem .5rem .6rem;margin-top:.2rem}
.wp-step{width:34px;height:34px;border-radius:50%;background:var(--soft);color:var(--muted);font:700 .88rem 'Inter',sans-serif;display:flex;align-items:center;justify-content:center;transition:background .25s,color .25s,transform .2s;border:1.5px solid var(--line);flex-shrink:0}
.wp-step.active{background:var(--ink);color:var(--white);border-color:var(--ink);transform:scale(1.05)}
.wp-step.done{background:var(--grad);color:var(--white);border-color:transparent}
.wp-line{flex:1;height:2px;background:var(--line);border-radius:2px;transition:background .3s}
.wp-line.done{background:var(--grad)}

.wizard-body{padding:.2rem 0 .4rem;display:flex;flex-direction:column;justify-content:center}
.wizard-step{display:none;width:100%}
.wizard-step.active{display:block;animation:wizFade .25s ease}
@keyframes wizFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.wizard-input-label{display:block;font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:.55rem}
.wizard-input{width:100%;background:var(--card);border:1px solid var(--line);border-radius:100px;color:var(--ink);font:400 1rem 'Inter',sans-serif;padding:.75rem 1.15rem;outline:none;transition:border-color .15s,box-shadow .15s}
.wizard-input:focus{border-color:var(--pink);box-shadow:0 0 0 3px rgba(232,23,122,.1)}
.wizard-help{color:var(--muted);font-size:.88rem;margin:0 0 1rem;line-height:1.55}
.wizard-help strong{color:var(--ink)}

.wizard-picker{border:1px solid var(--line);border-radius:12px;overflow:hidden}
.wizard-picker-cols{display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;background:var(--bg);border-bottom:2px solid var(--line);font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.wizard-picker-cols .wpc-radio{width:16px;flex-shrink:0}
.wizard-picker-cols .wpc-name{flex:1}
.wizard-picker-cols .wpc-status{width:110px;flex-shrink:0}
.wizard-picker-cols .wpc-id{width:110px;flex-shrink:0;text-align:right}
.wizard-picker-list{max-height:280px;overflow-y:auto}
.wizard-picker-row{display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;cursor:pointer;transition:background .12s;border-bottom:1px solid var(--line);font-size:.9rem}
.wizard-picker-row:last-child{border-bottom:none}
.wizard-picker-row:hover{background:var(--soft)}
.wizard-picker-row.selected{background:var(--pink-soft)}
.wizard-picker-row input[type=radio]{width:16px;height:16px;accent-color:var(--pink);cursor:pointer;flex-shrink:0;margin:0}
.wizard-picker-row .wp-name{flex:1;font-weight:600;color:var(--ink)}
.wizard-picker-row .wp-status{width:110px;flex-shrink:0}
.wizard-picker-row .wp-id{color:var(--muted);font-size:.75rem;font-family:'SF Mono',Menlo,Consolas,monospace;flex-shrink:0;width:110px;text-align:right}

.wizard-footer{display:flex;gap:.6rem;padding-top:.9rem;border-top:1px solid var(--line);margin-top:.4rem;align-items:center;justify-content:space-between}
.wizard-footer .spacer{flex:1}
.wizard-footer-right{display:flex;gap:.6rem;align-items:center;margin-left:auto}

/* ── Icon buttons + mcp-url chip ─────────────────────────────────────── */
.h2-actions{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.mcp-url-chip{font:500 .7rem 'SF Mono',Menlo,Consolas,monospace;color:var(--muted);background:var(--soft);padding:.4rem .75rem;border-radius:100px;letter-spacing:0;text-transform:none;border:1px solid var(--line);white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
.icon-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .8rem;border:1px solid var(--line);border-radius:100px;background:var(--card);color:var(--ink);text-decoration:none;font:700 .68rem 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;transition:all .15s;cursor:pointer}
.icon-btn:hover{border-color:var(--ink);background:var(--soft)}
.icon-btn svg{width:14px;height:14px;flex-shrink:0}

/* ── Save toast ──────────────────────────────────────────────────────── */
.save-toast{position:fixed;bottom:2rem;right:2rem;padding:1.1rem 1.6rem;border-radius:100px;font:600 .82rem 'Inter',sans-serif;letter-spacing:.05em;box-shadow:0 8px 24px rgba(0,0,0,.1);z-index:200;animation:toastIn .25s ease;display:inline-flex;align-items:center;gap:.75rem}
.save-toast[hidden]{display:none}
.save-toast::before{content:"";width:20px;height:20px;flex-shrink:0;border-radius:50%;display:inline-block;background-position:center;background-repeat:no-repeat;background-size:11px 11px}
.save-toast.success{background:#e6f6ee;color:#0f6045;border:1px solid #b3e0c8}
.save-toast.success::before{background-color:var(--green);background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'><path d='M13.485 1.929a.75.75 0 0 1 .086 1.056l-7.5 9a.75.75 0 0 1-1.113.056l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.92 3.918 6.99-8.388a.75.75 0 0 1 1.057-.082'/></svg>")}
.save-toast.error{background:var(--coral-soft);color:#8a1230;border:1px solid #f0c0cc}
.save-toast.error::before{background-color:var(--coral);background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'><path d='M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z'/></svg>")}
.save-toast.info{background:var(--pink-soft);color:var(--pink);border:1px solid #f0c0cc}
.save-toast.info::before{background-color:var(--pink);background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'><path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/><path d='m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z'/></svg>")}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

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

  window.askConfirm=function(opts){
    document.getElementById('confirm-title').textContent=opts.title||'¿Confirmar?';
    document.getElementById('confirm-message').textContent=opts.message||'Esta acción no se puede deshacer.';
    var btn=document.getElementById('confirm-ok');
    btn.textContent=opts.confirmLabel||'Eliminar';
    btn.className='btn '+(opts.danger===false?'primary':'danger');
    btn.onclick=function(){closeModal('confirm-modal');if(typeof opts.onConfirm==='function')opts.onConfirm()};
    openModal('confirm-modal');
  };
  window.askConfirmForm=function(btn){
    var form=btn.closest('form');
    if(!form)return;
    askConfirm({
      title:form.dataset.confirmTitle||'¿Confirmar?',
      message:form.dataset.confirmMsg||'',
      confirmLabel:form.dataset.confirmLabel||'Eliminar',
      danger:form.dataset.confirmVariant!=='primary',
      onConfirm:function(){form.submit()}
    });
  };
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

  // ─── Client wizard ─────────────────────────────────────────────
  var wizState={step:1,name:'',gads:'',meta:'',ga4:''};
  window.openUserNewModal=function(){
    openModal('modal-user-new');
    setTimeout(function(){var f=document.querySelector('#modal-user-new input[name=name]');if(f)f.focus()},80);
  };
  window.openClientWizard=function(){
    wizState={step:1,name:'',gads:'',meta:'',ga4:''};
    // Reset UI
    document.querySelectorAll('.wizard-step').forEach(function(s){s.classList.toggle('active',s.dataset.step==='1')});
    document.querySelectorAll('.wp-step').forEach(function(s){s.classList.remove('active','done');if(s.dataset.idx==='1')s.classList.add('active')});
    document.getElementById('wz-name').value='';
    document.querySelectorAll('.wizard-picker-list').forEach(function(l){l.innerHTML=''});
    updateWizardButtons();
    openModal('wizard-modal');
    setTimeout(function(){document.getElementById('wz-name').focus()},100);
  };
  function updateWizardButtons(){
    var back=document.getElementById('wz-back');
    var skip=document.getElementById('wz-skip');
    var next=document.getElementById('wz-next');
    back.style.visibility=wizState.step>1?'visible':'hidden';
    skip.style.display=wizState.step>1?'':'none';
    next.textContent=wizState.step===4?'Crear cliente':'Siguiente';
  }
  function goToStep(n){
    wizState.step=n;
    document.querySelectorAll('.wizard-step').forEach(function(s){s.classList.toggle('active',parseInt(s.dataset.step,10)===n)});
    var steps=document.querySelectorAll('.wp-step');
    steps.forEach(function(s){
      var idx=parseInt(s.dataset.idx,10);
      s.classList.toggle('active',idx===n);
      s.classList.toggle('done',idx<n);
    });
    // Mark lines as done between done steps
    document.querySelectorAll('.wp-line').forEach(function(line,i){
      line.classList.toggle('done',i<n-1);
    });
    updateWizardButtons();
    // Load platform list if not loaded
    var platforms={2:'gads',3:'meta',4:'ga4'};
    var p=platforms[n];
    if(p){
      var list=document.querySelector('.wizard-picker-list[data-platform="'+p+'"]');
      if(list && !list.dataset.loaded)loadWizardPicker(p,list);
    }
  }
  var STATUS_LABEL={ENABLED:'Habilitada',SUSPENDED:'Suspendida',CANCELED:'Cancelada',CLOSED:'Cerrada'};
  async function loadWizardPicker(platform,list){
    list.dataset.loaded='1';
    list.innerHTML='<div class="accounts-loading" style="padding:1.4rem;text-align:center;color:var(--muted);font-size:.85rem">Cargando...</div>';
    try{
      var r=await fetch('/admin/api/'+platform+'-accounts',{headers:{Accept:'application/json'}});
      var data=await r.json();
      if(!r.ok||data.error){list.innerHTML='<div class="accounts-loading err" style="padding:1.4rem;text-align:center;color:var(--coral);font-size:.85rem">Error: '+(data.error||r.status)+'</div>';return}
      var accounts=data.accounts||[];
      if(!accounts.length){list.innerHTML='<div class="accounts-loading warn" style="padding:1.4rem;text-align:center;color:#8a6d00;font-size:.85rem;background:#fff8e1">'+(data.notice||'No hay cuentas disponibles.')+'</div>';return}
      list.innerHTML=accounts.map(function(a,i){
        var st=a.status||'';
        var stCell=st?'<span class="status-pill '+st.toLowerCase()+'">'+(STATUS_LABEL[st]||st)+'</span>':'<span class="muted" style="font-size:.75rem">&#8212;</span>';
        return '<label class="wizard-picker-row" data-status="'+st+'">'
          +'<input type="radio" name="wz-'+platform+'" value="'+a.id+'">'
          +'<span class="wp-name">'+(a.name||'sin nombre')+'</span>'
          +'<span class="wp-status">'+stCell+'</span>'
          +'<span class="wp-id">'+a.id+'</span>'
          +'</label>';
      }).join('');
      list.querySelectorAll('.wizard-picker-row').forEach(function(row){
        var input=row.querySelector('input[type=radio]');
        row.addEventListener('click',function(){
          list.querySelectorAll('.wizard-picker-row').forEach(function(r){r.classList.remove('selected')});
          row.classList.add('selected');
          if(input){
            input.checked=true;
            wizState[platform]=input.value;
          }
        });
        if(input){
          input.addEventListener('change',function(){wizState[platform]=input.value});
        }
      });
    }catch(e){list.innerHTML='<div class="accounts-loading err" style="padding:1.4rem;text-align:center;color:var(--coral)">Error: '+e.message+'</div>'}
  }

  window.wzToggleStatusDropdown=function(ev,btn){
    ev.stopPropagation();
    var d=btn.closest('.col-status-dropdown');
    if(!d)return;
    // Close others
    document.querySelectorAll('.col-status-dropdown.open').forEach(function(o){if(o!==d){o.classList.remove('open');o.querySelector('.col-status-menu').hidden=true}});
    var open=d.classList.toggle('open');
    d.querySelector('.col-status-menu').hidden=!open;
  };
  window.wzPickStatus=function(opt){
    var d=opt.closest('.col-status-dropdown');
    if(!d)return;
    d.querySelectorAll('.col-status-opt').forEach(function(o){o.classList.remove('selected')});
    opt.classList.add('selected');
    d.querySelector('.wz-status-label').textContent=opt.dataset.label||'Estado';
    d.classList.remove('open');d.querySelector('.col-status-menu').hidden=true;
    var status=opt.dataset.value||'';
    // Filter rows in the sibling list
    var picker=d.closest('.wizard-picker');
    if(picker){
      picker.querySelectorAll('.wizard-picker-row').forEach(function(row){
        var s=row.dataset.status||'';
        row.style.display=(!status||s===status)?'':'none';
      });
    }
  };
  window.wizardBack=function(){if(wizState.step>1)goToStep(wizState.step-1)};
  window.wizardSkip=function(){
    var m={2:'gads',3:'meta',4:'ga4'};
    if(m[wizState.step])wizState[m[wizState.step]]='';
    if(wizState.step===4)finishWizard();else goToStep(wizState.step+1);
  };
  window.wizardNext=async function(){
    if(wizState.step===1){
      var v=document.getElementById('wz-name').value.trim();
      if(!v){showSavedToast('Ingres&#225; un nombre','error');return}
      wizState.name=v;
      goToStep(2);return;
    }
    if(wizState.step<4){goToStep(wizState.step+1);return}
    finishWizard();
  };
  async function finishWizard(){
    var btn=document.getElementById('wz-next');
    btn.disabled=true;btn.textContent='Creando...';
    var body=new URLSearchParams();
    body.append('slug',wizState.name.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''));
    body.append('name',wizState.name);
    if(wizState.gads)body.append('gads_customer_id',wizState.gads);
    if(wizState.meta)body.append('meta_ad_account_id',wizState.meta);
    if(wizState.ga4)body.append('ga4_property_id',wizState.ga4);
    try{
      var r=await fetch('/admin/clients',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body,redirect:'manual'});
      if(r.ok||r.status===0||(r.status>=300&&r.status<400)){
        closeModal('wizard-modal');
        showSavedToast('Cliente "'+wizState.name+'" creado');
        setTimeout(function(){window.location.reload()},900);
      }else{
        var t=await r.text();
        showSavedToast('Error al crear','error');
        btn.disabled=false;btn.textContent='Crear cliente';
      }
    }catch(e){showSavedToast('Error: '+e.message,'error');btn.disabled=false;btn.textContent='Crear cliente'}
  }

  // ─── Enrich client account rows on load ───────────────────────
  var ENRICH_STATUS_LABEL={ENABLED:'Habilitada',SUSPENDED:'Suspendida',CANCELED:'Cancelada',CLOSED:'Cerrada'};
  async function enrichClientAccounts(){
    var blocks=document.querySelectorAll('.acc-list-block');
    blocks.forEach(async function(block){
      var platform=block.dataset.platform;
      var rows=block.querySelectorAll('.acc-list-row');
      if(!rows.length)return;
      try{
        var r=await fetch('/admin/api/'+platform+'-accounts',{headers:{Accept:'application/json'}});
        var data=await r.json();
        if(!r.ok||!data.accounts)return;
        var map=new Map(data.accounts.map(function(a){return [String(a.id),a]}));
        rows.forEach(function(row){
          var id=row.dataset.accountId;
          var a=map.get(String(id));
          var nameEl=row.querySelector('[data-role="name"]');
          var pillEl=row.querySelector('[data-role="id-pill"]');
          if(!a){
            if(nameEl)nameEl.innerHTML='<span class="muted" style="font-weight:400">Cuenta no visible</span>';
            return;
          }
          if(nameEl)nameEl.textContent=a.name||'sin nombre';
          if(pillEl && a.status){
            pillEl.classList.add(a.status.toLowerCase());
            pillEl.title=id+' · '+(ENRICH_STATUS_LABEL[a.status]||a.status);
          }
        });
      }catch(e){}
    });
  }
  if(document.querySelector('.acc-list-block')){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enrichClientAccounts);
    else enrichClientAccounts();
  }

  // ─── Client account picker (multi) ─────────────────────────────
  var PLATFORM_LABELS_CAP={meta:'Meta Ads',gads:'Google Ads',ga4:'Google Analytics 4'};
  var capState={platform:null,selected:new Set(),existing:new Set()};

  window.openClientAccountPicker=async function(platform){
    var container=document.querySelector('[data-client-slug]');
    if(!container){showSavedToast('Contexto no v&#225;lido','error');return}
    capState.platform=platform;
    capState.selected=new Set();
    // Collect existing account IDs for this platform (to prevent duplicates)
    var block=document.querySelector('.acc-list-block[data-platform="'+platform+'"]');
    capState.existing=new Set([].map.call(block.querySelectorAll('.acc-list-row'),function(r){return r.dataset.accountId}));
    document.getElementById('cap-platform-label').textContent=PLATFORM_LABELS_CAP[platform];
    var list=document.getElementById('cap-list');
    list.innerHTML='<div class="accounts-loading">Cargando cuentas...</div>';
    openModal('client-acc-modal');
    try{
      var r=await fetch('/admin/api/'+platform+'-accounts',{headers:{Accept:'application/json'}});
      var data=await r.json();
      if(!r.ok||data.error){list.innerHTML='<div class="accounts-loading err">Error: '+(data.error||r.status)+'</div>';return}
      var accounts=data.accounts||[];
      if(!accounts.length){list.innerHTML='<div class="accounts-loading warn">'+(data.notice||'No hay cuentas disponibles.')+'</div>';return}
      var STATUS_LABEL={ENABLED:'Habilitada',SUSPENDED:'Suspendida',CANCELED:'Cancelada',CLOSED:'Cerrada'};
      list.innerHTML=accounts.map(function(a){
        var isExisting=capState.existing.has(String(a.id));
        var st=a.status||'';
        var stCell=st?'<span class="status-pill '+st.toLowerCase()+'">'+(STATUS_LABEL[st]||st)+'</span>':'<span class="muted" style="font-size:.75rem">&#8212;</span>';
        return '<label class="account-row" data-status="'+st+'"'+(isExisting?' style="opacity:.5"':'')+'>'
          +'<input type="checkbox" value="'+a.id+'" '+(isExisting?'checked disabled':'')+' onchange="capOnCheck(this)">'
          +'<span class="a-name">'+(a.name||'sin nombre')+(isExisting?' <em style="color:var(--muted);font-style:normal;font-size:.72rem"> &#183; ya asociada</em>':'')+'</span>'
          +'<span class="a-status">'+stCell+'</span>'
          +'<span class="a-id">'+a.id+'</span>'
          +'</label>';
      }).join('');
    }catch(e){list.innerHTML='<div class="accounts-loading err">Error: '+e.message+'</div>'}
  };

  window.capOnCheck=function(cb){
    if(cb.checked)capState.selected.add(cb.value);else capState.selected.delete(cb.value);
    var master=document.getElementById('cap-select-all');
    var boxes=document.querySelectorAll('#cap-list input[type=checkbox]:not(:disabled)');
    var checked=document.querySelectorAll('#cap-list input[type=checkbox]:not(:disabled):checked');
    if(!master)return;
    if(boxes.length===0){master.checked=false;master.indeterminate=false}
    else if(checked.length===boxes.length){master.checked=true;master.indeterminate=false}
    else if(checked.length===0){master.checked=false;master.indeterminate=false}
    else{master.checked=false;master.indeterminate=true}
  };
  window.capToggleAll=function(checked){
    document.querySelectorAll('#cap-list .account-row').forEach(function(row){
      if(row.style.display==='none')return;
      var cb=row.querySelector('input[type=checkbox]');
      if(!cb||cb.disabled)return;
      cb.checked=checked;
      if(checked)capState.selected.add(cb.value);else capState.selected.delete(cb.value);
    });
  };

  window.saveClientAccounts=async function(){
    var container=document.querySelector('[data-client-slug]');
    if(!container||!capState.platform)return;
    var slug=container.dataset.clientSlug;
    var newIds=[...capState.existing,...capState.selected];
    var btn=document.getElementById('cap-save');
    btn.disabled=true;btn.textContent='Guardando...';
    try{
      var r=await fetch('/admin/clients/'+slug+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:capState.platform,ids:newIds})});
      if(!r.ok){var d=await r.json().catch(function(){return{}});throw new Error(d.error||r.status)}
      closeModal('client-acc-modal');
      showSavedToast('Cuentas actualizadas');
      setTimeout(function(){window.location.reload()},700);
    }catch(e){
      showSavedToast('Error: '+e.message,'error');
      btn.disabled=false;btn.textContent='Agregar seleccionadas';
    }
  };

  window.removeClientAccount=async function(btn,platform,accountId){
    askConfirm({
      title:'Quitar cuenta',
      message:'¿Desasociar la cuenta '+accountId+' de este cliente?',
      confirmLabel:'Quitar',
      danger:true,
      onConfirm:async function(){
        var container=document.querySelector('[data-client-slug]');
        if(!container)return;
        var slug=container.dataset.clientSlug;
        var block=document.querySelector('.acc-list-block[data-platform="'+platform+'"]');
        var remaining=[].map.call(block.querySelectorAll('.acc-list-row'),function(r){return r.dataset.accountId}).filter(function(id){return id!==accountId});
        try{
          var r=await fetch('/admin/clients/'+slug+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:platform,ids:remaining})});
          if(!r.ok){var d=await r.json().catch(function(){return{}});throw new Error(d.error||r.status)}
          showSavedToast('Cuenta desasociada');
          setTimeout(function(){window.location.reload()},700);
        }catch(e){showSavedToast('Error: '+e.message,'error')}
      }
    });
  };

  window.toggleClientAccess=async function(btn){
    if(btn.classList.contains('disabled'))return;
    var container=btn.closest('[data-user-id]');
    if(!container){showSavedToast('Contexto no v&#225;lido','error');return}
    var userId=container.dataset.userId;
    var platform=btn.dataset.platform;
    var accountId=btn.dataset.accountId;
    var key='accounts'+platform.charAt(0).toUpperCase()+platform.slice(1);
    var current=new Set((container.dataset[key]||'').split(',').filter(Boolean));
    var willActivate=!btn.classList.contains('active');
    if(willActivate)current.add(accountId);else current.delete(accountId);
    // Optimistic UI
    btn.classList.toggle('active',willActivate);
    try{
      var r=await fetch('/admin/users/'+userId+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:platform,ids:[...current]})});
      if(!r.ok){var d=await r.json().catch(function(){return{}});throw new Error(d.error||r.status)}
      container.dataset[key]=[...current].join(',');
      showSavedToast(willActivate?'Acceso agregado':'Acceso removido');
    }catch(e){
      // Revert
      btn.classList.toggle('active',!willActivate);
      showSavedToast('Error: '+e.message,'error');
    }
  };

  window.regenerateUserPassword=async function(userId,btn){
    if(!confirm('&#191;Regenerar la contrase&#241;a del usuario? La anterior deja de funcionar.'))return;
    var original=btn.innerHTML;
    btn.disabled=true;btn.textContent='Regenerando…';
    try{
      var r=await fetch('/admin/users/'+encodeURIComponent(userId)+'/regen-password',{method:'POST',headers:{'Accept':'application/json'}});
      var d=await r.json();
      if(!r.ok)throw new Error(d.error||r.status);
      window.location.href='/admin/users/'+encodeURIComponent(userId)+'/edit?ok='+encodeURIComponent('Contraseña regenerada. Copiala y compartila.')+'&pw='+encodeURIComponent(d.password);
    }catch(e){
      showSavedToast('Error: '+e.message,'error');
      btn.disabled=false;btn.innerHTML=original;
    }
  };

  window.debouncedSaveBudget=(function(){
    var timers=new WeakMap();
    return function(input){
      clearTimeout(timers.get(input));
      timers.set(input,setTimeout(function(){window.saveClientBudget(input)},300));
    };
  })();

  // Flush pending saves before leaving the page (unload / navigation)
  window.addEventListener('beforeunload',function(){
    document.querySelectorAll('input[data-role="amount"],input[data-role="alert_pct"]').forEach(function(i){
      if(i._last!==(i.value||'').trim().replace(/\./g,'').replace(/,/g,''))window.saveClientBudget(i);
    });
  });
  // Enter key triggers immediate save on budget fields
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter')return;
    var t=e.target;
    if(t&&t.tagName==='INPUT'&&(t.dataset.role==='amount'||t.dataset.role==='alert_pct')){e.preventDefault();window.saveClientBudget(t);t.blur();}
  });

  window.formatMoneyInput=function(input){
    var digits=(input.value||'').replace(/[^0-9]/g,'');
    var formatted=digits?Number(digits).toLocaleString('es-AR'):'';
    if(formatted!==input.value){
      var start=input.selectionStart;
      var before=input.value.slice(0,start).replace(/[^0-9]/g,'').length;
      input.value=formatted;
      var pos=0,seen=0;
      while(pos<formatted.length&&seen<before){if(/[0-9]/.test(formatted[pos]))seen++;pos++;}
      try{input.setSelectionRange(pos,pos)}catch(e){}
    }
  };

  window.handleBudgetInput=function(input){
    var oldValue=input.value||'';
    var oldCaret=input.selectionStart||0;
    var digits=oldValue.replace(/[^0-9]/g,'');
    var formatted=digits?Number(digits).toLocaleString('es-AR'):'';
    if(formatted!==oldValue){
      var digitsBefore=oldValue.slice(0,oldCaret).replace(/[^0-9]/g,'').length;
      input.value=formatted;
      var pos=0,count=0;
      while(pos<formatted.length&&count<digitsBefore){if(/[0-9]/.test(formatted[pos]))count++;pos++;}
      try{input.setSelectionRange(pos,pos)}catch(e){}
    }
    window.debouncedSaveBudget(input);
  };

  window.saveClientBudget=async function(input){
    var editor=document.getElementById('client-editor');
    if(!editor){return}
    var slug=editor.dataset.clientSlug;
    var platform=input.dataset.platform;
    var role=input.dataset.role||'amount';
    var raw=(input.value||'').trim().replace(/\./g,'').replace(/,/g,'');
    if(raw===''){return} // Empty → skip; don't accidentally delete on blur/tab
    if(input._last===raw)return;
    input._last=raw;
    var payload={platform:platform};
    var fmtN=function(n){return Number(n).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})};
    if(role==='alert_pct'){
      var pct=Number(raw);
      if(!Number.isFinite(pct)||pct<0||pct>100){showSavedToast('Porcentaje inv&#225;lido (0-100)','error');return}
      payload.alert_pct=pct;
    }else{
      var amount=Number(raw);
      if(!Number.isFinite(amount)||amount<0){showSavedToast('Monto inv&#225;lido','error');return}
      payload.amount=amount;
    }
    try{
      var r=await fetch('/admin/clients/'+slug+'/budget',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
      if(!r.ok){var d=await r.json().catch(function(){return{}});throw new Error(d.error||r.status)}
      showSavedToast(role==='alert_pct'?('Alerta al '+payload.alert_pct+'% guardada'):('Presupuesto guardado: $ '+fmtN(payload.amount)));
    }catch(e){showSavedToast('Error: '+e.message,'error')}
  };

  window.toggleUserPlatformForClient=async function(btn){
    if(btn.classList.contains('disabled'))return;
    var row=btn.closest('[data-user-id]');
    if(!row){showSavedToast('Contexto no v&#225;lido','error');return}
    var userId=row.dataset.userId;
    var platform=btn.dataset.platform;
    var clientIds=(btn.dataset.clientIds||'').split(',').filter(Boolean);
    var key='accounts'+platform.charAt(0).toUpperCase()+platform.slice(1);
    var current=new Set((row.dataset[key]||'').split(',').filter(Boolean));
    var willActivate=!btn.classList.contains('active');
    clientIds.forEach(function(id){if(willActivate)current.add(id);else current.delete(id)});
    btn.classList.toggle('active',willActivate);
    try{
      var r=await fetch('/admin/users/'+userId+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:platform,ids:[...current]})});
      if(!r.ok){var d=await r.json().catch(function(){return{}});throw new Error(d.error||r.status)}
      row.dataset[key]=[...current].join(',');
      showSavedToast(willActivate?'Acceso agregado':'Acceso removido');
    }catch(e){
      btn.classList.toggle('active',!willActivate);
      showSavedToast('Error: '+e.message,'error');
    }
  };

  window.copyText=async function(text,btn){
    try{
      await navigator.clipboard.writeText(text);
      showSavedToast('Copiado al portapapeles');
    }catch(e){
      var ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');showSavedToast('Copiado al portapapeles')}
      catch(e2){showSavedToast('No se pudo copiar','error')}
      document.body.removeChild(ta);
    }
  };
  window.copyMdToClipboard=async function(btn){
    var box=document.querySelector('.md-box');
    if(!box)return;
    var text=box.textContent||'';
    try{
      await navigator.clipboard.writeText(text);
      showSavedToast('Copiado al portapapeles');
    }catch(e){
      // Fallback for insecure contexts
      var ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');showSavedToast('Copiado al portapapeles')}
      catch(e2){showSavedToast('No se pudo copiar','error')}
      document.body.removeChild(ta);
    }
  };

  window.copyFromData=async function(btn){
    var text=(btn&&btn.getAttribute&&btn.getAttribute('data-copy'))||'';
    if(!text)return;
    try{
      await navigator.clipboard.writeText(text);
      showSavedToast('Copiado al portapapeles');
    }catch(e){
      var ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');showSavedToast('Copiado al portapapeles')}
      catch(e2){showSavedToast('No se pudo copiar','error')}
      document.body.removeChild(ta);
    }
  };

  window.showSavedToast=function(msg,type){
    var t=document.getElementById('save-toast');
    if(!t)return;
    t.className='save-toast '+(type||'success');
    t.textContent=msg||'Guardado';
    t.hidden=false;
    clearTimeout(t._h);
    t._h=setTimeout(function(){t.hidden=true},1800);
  };

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
      opt.addEventListener('click',async function(){
        panel.querySelectorAll('.cs-opt').forEach(function(o){o.classList.remove('selected')});
        opt.classList.add('selected');
        value.textContent=opt.dataset.label||opt.textContent;
        if(input)input.value=opt.dataset.value||'';
        wrap.classList.remove('open');panel.hidden=true;
        // Autosave if configured
        if(wrap.dataset.autosave==='1' && wrap.dataset.userId){
          var body=new URLSearchParams();
          body.append(input.name||'role',opt.dataset.value||'');
          try{
            var r=await fetch('/admin/users/'+wrap.dataset.userId,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:body,redirect:'manual'});
            if(r.ok||r.status===0||r.status>=300&&r.status<400)showSavedToast('Rol actualizado');
          }catch(e){}
        }
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

  window.savePickerAndClose=async function(){
    var modal=document.getElementById('accounts-modal');
    var container=document.querySelector('[data-user-id]');
    var platform=modal.dataset.platform;
    if(!container||!platform){closeModal('accounts-modal');return}
    var userId=container.dataset.userId;
    var ids=[...getSelected(container,platform)];
    try{
      var r=await fetch('/admin/users/'+userId+'/accounts',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({platform:platform,ids:ids})});
      if(r.ok){
        modal.dataset.initialSelection=ids.sort().join(',');
        document.getElementById('acc-save-icon').classList.remove('visible');
        showSavedToast('Accesos actualizados');
        closeModal('accounts-modal');
      }else{
        var d=await r.json().catch(function(){return{}});
        showSavedToast('Error: '+(d.error||r.status),'error');
      }
    }catch(e){showSavedToast('Error: '+e.message,'error')}
  };

  function updateSaveIconVisibility(){
    var modal=document.getElementById('accounts-modal');
    var container=document.querySelector('[data-user-id]');
    var platform=modal.dataset.platform;
    if(!container||!platform)return;
    var current=[...getSelected(container,platform)].sort().join(',');
    var initial=modal.dataset.initialSelection||'';
    var saveIcon=document.getElementById('acc-save-icon');
    if(!saveIcon)return;
    saveIcon.classList.toggle('visible',current!==initial);
  }

  window.loadAccountsPicker=async function(cardBtn){
    var container=containerOf(cardBtn);
    var platform=cardBtn.dataset.p;
    var modal=document.getElementById('accounts-modal');
    modal.dataset.platform=platform;
    // Snapshot initial state for dirty tracking
    modal.dataset.initialSelection=[...getSelected(container,platform)].sort().join(',');
    document.getElementById('acc-save-icon').classList.remove('visible');
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
      var STATUS_LABEL={ENABLED:'Habilitada',SUSPENDED:'Suspendida',CANCELED:'Cancelada',CLOSED:'Cerrada',UNKNOWN:'&#8212;'};
      list.innerHTML=accounts.map(function(a){
        var badge=a.kind==='owned'?'<span class="a-badge">owned</span>':'';
        var st=a.status||'UNKNOWN';
        var stLabel=STATUS_LABEL[st]||st;
        var stCls=st.toLowerCase();
        return '<label class="account-row" data-status="'+st+'">'
          +'<input type="checkbox" value="'+a.id+'" '+(sel.has(String(a.id))?'checked':'')+'>'
          +'<span class="a-name">'+(a.name||'sin nombre')+'</span>'
          +badge
          +'<span class="a-status"><span class="status-pill '+stCls+'">'+stLabel+'</span></span>'
          +'<span class="a-id">'+a.id+'</span>'
          +'</label>';
      }).join('');
      list.querySelectorAll('input[type=checkbox]').forEach(function(cb){
        cb.addEventListener('change',function(){
          var s=getSelected(container,platform);
          if(cb.checked)s.add(cb.value);else s.delete(cb.value);
          setSelected(container,platform,s);
          refreshSelectAll();
          updateSaveIconVisibility();
        });
      });
      refreshSelectAll();
      updateSaveIconVisibility();
    }catch(e){list.innerHTML='<div class="accounts-loading err">Error: '+e.message+'</div>'}
  };

  window.pickerToggleAll=function(checked){
    var modal=document.getElementById('accounts-modal');
    if(!modal||modal.hidden)return;
    var container=document.querySelector('[data-user-id]');
    var platform=modal.dataset.platform;
    if(!container||!platform)return;
    var s=getSelected(container,platform);
    // Only toggle visible rows (respect current filter)
    modal.querySelectorAll('.accounts-panel-list .account-row').forEach(function(row){
      if(row.style.display==='none')return;
      var cb=row.querySelector('input[type=checkbox]');
      if(!cb)return;
      cb.checked=checked;
      if(checked)s.add(cb.value);else s.delete(cb.value);
    });
    setSelected(container,platform,s);
    refreshSelectAll();
    updateSaveIconVisibility();
  };

  window.toggleStatusDropdown=function(ev){
    ev.stopPropagation();
    var d=document.getElementById('acc-status-dropdown');
    if(!d)return;
    var open=d.classList.toggle('open');
    d.querySelector('.col-status-menu').hidden=!open;
  };
  window.pickStatus=function(opt){
    var d=document.getElementById('acc-status-dropdown');
    if(!d)return;
    d.querySelectorAll('.col-status-opt').forEach(function(o){o.classList.remove('selected')});
    opt.classList.add('selected');
    document.getElementById('acc-status-label').textContent=opt.dataset.label||'Estado';
    d.classList.remove('open');
    d.querySelector('.col-status-menu').hidden=true;
    window.filterByStatus(opt.dataset.value||'');
  };
  document.addEventListener('click',function(e){
    var d=document.getElementById('acc-status-dropdown');
    if(!d||!d.classList.contains('open'))return;
    if(!d.contains(e.target)){d.classList.remove('open');d.querySelector('.col-status-menu').hidden=true}
  });

  window.filterByStatus=function(status){
    var modal=document.getElementById('accounts-modal');
    if(!modal||modal.hidden)return;
    modal.querySelectorAll('.accounts-panel-list .account-row').forEach(function(row){
      var s=row.dataset.status||'';
      row.style.display=(!status||s===status)?'':'none';
    });
    refreshSelectAll();
  };

  function refreshSelectAll(){
    var modal=document.getElementById('accounts-modal');
    var visible=[].filter.call(modal.querySelectorAll('.accounts-panel-list .account-row'),function(r){return r.style.display!=='none'});
    var boxes=visible.map(function(r){return r.querySelector('input[type=checkbox]')}).filter(Boolean);
    var sel=boxes.filter(function(b){return b.checked});
    var master=document.getElementById('acc-select-all');
    if(!master)return;
    if(boxes.length===0){master.checked=false;master.indeterminate=false;return}
    if(sel.length===boxes.length){master.checked=true;master.indeterminate=false}
    else if(sel.length===0){master.checked=false;master.indeterminate=false}
    else{master.checked=false;master.indeterminate=true}
  }

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
  const type = flash.type === 'err' ? 'error' : 'success';
  return `<script>window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(window.showSavedToast)showSavedToast(${JSON.stringify(flash.text || '')},'${type}')},50)});</script>`;
}

function sidebar(user, active) {
  const nav = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin' },
    { key: 'users', label: 'Usuarios', href: '/admin/users', admin: true },
    { key: 'clients', label: 'Clientes', href: '/admin/clients' },
    { key: 'investment', label: 'Inversión', href: '/admin/investment' },
    { key: 'logs', label: 'Logs', href: '/admin/logs', admin: true },
    { key: 'config', label: 'MCP', href: '/admin/config' },
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
      <div class="sidebar-logo"><span class="word">break<span class="dot"></span></span></div>
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

const CONFIRM_MODAL = `
<div class="modal-overlay" id="confirm-modal" hidden>
  <div class="modal" style="max-width:460px">
    <div class="accounts-modal-head">
      <div class="accounts-modal-title">
        <h3 id="confirm-title">&#191;Confirmar?</h3>
        <button type="button" class="btn-close" onclick="closeModal('confirm-modal')" title="Cerrar" aria-label="Cerrar">&#215;</button>
      </div>
      <div class="accounts-divider"></div>
      <p class="accounts-modal-note" id="confirm-message">Esta acci&#243;n no se puede deshacer.</p>
    </div>
    <div class="form-actions" style="border-top:none;padding-top:0;margin-top:1.4rem">
      <button type="button" class="btn ghost" onclick="closeModal('confirm-modal')">Cancelar</button>
      <div class="spacer"></div>
      <button type="button" class="btn danger" id="confirm-ok">Eliminar</button>
    </div>
  </div>
</div>`;

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
    ${body}
  </section>
  ${flashBanner(flash)}
  <div id="save-toast" class="save-toast" hidden></div>
</main>
${CONFIRM_MODAL}
<script>${CLIENT_JS}</script>
</body></html>`;
}

/* ─────────── Dashboard ─────────── */
const BCRA_LOGO = `<img src="/public/img/brand/bcra.png" alt="BCRA">`;

export function renderDashboard({ user }) {
  const firstName = user.name.split(' ')[0];
  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const body = `
    <h1>Hola, <span class="grad">${esc(firstName)}</span>.</h1>
    <div class="dash-layout">
      <div class="dash-main">
        <section class="dash-section">
          <div class="dash-section-title">Alertas</div>
          <div id="dash-alerts"><div class="alert-loading">Cargando alertas&#8230;</div></div>
        </section>
        <section class="dash-section">
          <div class="dash-section-title">Noticias</div>
          <div class="news-feed">
            <div class="news-item">
              <div class="news-icon">${GADS_ICON}</div>
              <div class="news-body">
                <div class="news-head">
                  <span class="news-tag">Nuevo</span>
                  <span class="news-date">${esc(today)}</span>
                </div>
                <h3 class="news-title">Google Ads ya est&#225; integrado</h3>
                <p class="news-text">Pod&#233;s asociar cuentas de Google Ads a cada cliente desde la ficha del cliente, y darle acceso por cuenta a cada usuario. Las consultas ya andan (campa&#241;as, performance y GAQL read-only).</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="dash-aside-wrap">
        <section class="dash-section">
          <div class="dash-section-title">D&#243;lar</div>
          <aside class="dash-aside" id="news-bcra">
            <div class="aside-head">
              <div class="icon">${BCRA_LOGO}</div>
              <div class="titles">
                <h4>BCRA &#183; D&#243;lar Oficial</h4>
                <span data-role="bcra-date">Actualizando&#8230;</span>
              </div>
            </div>
            <div>
              <div class="aside-hero-label">Promedio</div>
              <div class="aside-hero-value" data-role="bcra-promedio">&#8212;</div>
            </div>
            <div class="aside-sub-grid">
              <div class="aside-sub-cell">
                <span class="aside-sub-label">Compra</span>
                <span class="aside-sub-value" data-role="bcra-compra">&#8212;</span>
              </div>
              <div class="aside-sub-cell">
                <span class="aside-sub-label">Venta</span>
                <span class="aside-sub-value" data-role="bcra-venta">&#8212;</span>
              </div>
            </div>
            <div class="aside-foot">Fuente: Banco Naci&#243;n (oficial)</div>
          </aside>
        </section>
      </div>
    </div>
    <script>
    (function(){
      var card=document.getElementById('news-bcra');
      if(!card)return;
      fetch('/admin/api/bcra-usd').then(function(r){return r.json()}).then(function(d){
        if(d.error){card.querySelector('[data-role=bcra-date]').textContent='No disponible';return}
        var fmt=function(n){return '$ '+Number(n).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})};
        card.querySelector('[data-role=bcra-promedio]').textContent=fmt(d.promedio);
        card.querySelector('[data-role=bcra-compra]').textContent=fmt(d.compra);
        card.querySelector('[data-role=bcra-venta]').textContent=fmt(d.venta);
        if(d.fecha){
          var dt=new Date(d.fecha);
          card.querySelector('[data-role=bcra-date]').textContent=dt.toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
        }
      }).catch(function(){card.querySelector('[data-role=bcra-date]').textContent='No disponible'});
    })();
    (function(){
      var box=document.getElementById('dash-alerts');
      if(!box)return;
      var PLAT={meta:{label:'Meta Ads',icon:${JSON.stringify(META_ICON)}},gads:{label:'Google Ads',icon:${JSON.stringify(GADS_ICON)}}};
      function fmt(n){return '$ '+Number(n).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}
      function iso(d){return d.toISOString().slice(0,10)}
      var now=new Date();
      var from=iso(new Date(now.getFullYear(),now.getMonth(),1));
      var to=iso(now);
      fetch('/admin/api/investment?from='+from+'&to='+to).then(function(r){return r.json()}).then(function(d){
        if(d.error){box.innerHTML='<div class="alerts-empty">No se pudieron cargar las alertas: '+d.error+'</div>';return}
        var items=[];
        (d.clients||[]).forEach(function(c){
          Object.keys(c.platforms).forEach(function(pk){
            var p=c.platforms[pk];
            if(p.status!=='warn'&&p.status!=='over')return;
            var meta=PLAT[pk]||{label:pk,icon:''};
            var pct=p.pct==null?0:Math.round(p.pct);
            var txt;
            if(p.status==='over'){
              txt='Super&#243; el presupuesto del mes: '+fmt(p.spend)+' de '+fmt(p.budget)+' ('+pct+'%).';
            }else{
              txt='Consumo cerca del l&#237;mite: '+fmt(p.spend)+' de '+fmt(p.budget)+' ('+pct+'%).';
            }
            items.push({cls:p.status,slug:c.slug,name:c.name,plat:meta,txt:txt,pct:pct});
          });
        });
        if(!items.length){box.innerHTML='<div class="alerts-empty">Sin alertas.</div>';return}
        items.sort(function(a,b){return (b.cls==='over'?1:0)-(a.cls==='over'?1:0) || b.pct-a.pct});
        box.innerHTML='<div class="alerts-list">'+items.map(function(a){
          return '<a class="alert-item '+a.cls+'" href="/admin/clients/'+a.slug+'/edit" style="text-decoration:none">'
            +'<div class="alert-icon">'+a.plat.icon+'</div>'
            +'<div class="alert-body">'
            +'<div class="alert-title">'+a.name+' &#183; '+a.plat.label+'</div>'
            +'<div class="alert-text">'+a.txt+'</div>'
            +'</div>'
            +'<span class="alert-pill '+a.cls+'">'+(a.cls==='over'?'excedido':'alerta')+'</span>'
            +'</a>';
        }).join('')+'</div>';
      }).catch(function(e){box.innerHTML='<div class="alerts-empty">No se pudieron cargar las alertas: '+e.message+'</div>'});
    })();
    <\/script>`;
  return layout({ user, active: 'dashboard', title: 'Dashboard', body });
}

export function renderInvestment({ user }) {
  const body = `
    <div class="inv-toolbar">
      <div class="presets">
        <button type="button" class="inv-preset" data-preset="mtd">Mes actual</button>
        <button type="button" class="inv-preset" data-preset="7d">&#218;ltimos 7 d&#237;as</button>
        <button type="button" class="inv-preset" data-preset="30d">&#218;ltimos 30 d&#237;as</button>
        <button type="button" class="inv-preset" data-preset="prev">Mes anterior</button>
      </div>
      <div class="rp">
        <button type="button" class="rp-trigger" id="rp-trigger" onclick="rpToggle()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span data-role="from">&#8212;</span>
          <span class="sep">&#8594;</span>
          <span data-role="to">&#8212;</span>
        </button>
        <div class="rp-panel" id="rp-panel" hidden></div>
      </div>
      <input type="hidden" id="inv-from">
      <input type="hidden" id="inv-to">
    </div>
    <div id="inv-list" class="inv-list"><div class="inv-loading">Cargando&#8230;</div></div>
    <script>
    (function(){
      var list=document.getElementById('inv-list');
      if(!list)return;
      var fromEl=document.getElementById('inv-from');
      var toEl=document.getElementById('inv-to');
      function iso(d){var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+dd}
      function parseISO(s){var p=(s||'').split('-');return new Date(+p[0],+p[1]-1,+p[2])}
      function fmtDMY(iso){var p=(iso||'').split('-');return p[2]+'/'+p[1]+'/'+p[0]}

      // ─── Range picker ─────────────────────────────────────
      var trigger=document.getElementById('rp-trigger');
      var panel=document.getElementById('rp-panel');
      var DOW=['DO','LU','MA','MI','JU','VI','SA'];
      var MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      var rpState={from:null,to:null,leftMonth:null,pending:null};
      function sameDay(a,b){return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
      function ymd(d){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
      function inRange(d,a,b){if(!a||!b)return false;var x=ymd(d),lo=ymd(a),hi=ymd(b);if(lo>hi){var t=lo;lo=hi;hi=t}return x>lo&&x<hi}
      function today(){var t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
      function renderCal(baseDate,side){
        var y=baseDate.getFullYear(),m=baseDate.getMonth();
        var first=new Date(y,m,1);
        var startDow=first.getDay();
        var daysInMonth=new Date(y,m+1,0).getDate();
        var t=today();
        var cells=[];
        for(var i=0;i<startDow;i++){var prev=new Date(y,m,-startDow+i+1);cells.push({d:prev,out:true})}
        for(var d=1;d<=daysInMonth;d++)cells.push({d:new Date(y,m,d),out:false});
        while(cells.length%7!==0){var next=new Date(y,m+1,cells.length-startDow-daysInMonth+1);cells.push({d:next,out:true})}
        var from=rpState.pending||rpState.from,to=rpState.to;
        var html='<div class="rp-cal-head">'
          +'<div class="rp-cal-title">'+MONTHS[m]+' '+y+'</div>'
          +(side==='left'?'<div class="rp-nav"><button type="button" onclick="rpShift(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button></div>':'<div class="rp-nav"><button type="button" onclick="rpShift(1)" '+(y===t.getFullYear()&&m>=t.getMonth()?'disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button></div>')
          +'</div>'
          +'<div class="rp-dow">'+DOW.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div>'
          +'<div class="rp-grid">'
          +cells.map(function(c){
            var cls=['rp-cell'];
            if(c.out)cls.push('out');
            if(ymd(c.d)>ymd(t))cls.push('disabled');
            if(sameDay(c.d,t))cls.push('today');
            var isStart=sameDay(c.d,from),isEnd=sameDay(c.d,to);
            var hasRange=from&&to&&!sameDay(from,to);
            if(isStart)cls.push('start'+(hasRange?' has-range':''));
            if(isEnd)cls.push('end'+(hasRange?' has-range':''));
            if(inRange(c.d,from,to))cls.push('in-range');
            var attr=c.out||ymd(c.d)>ymd(t)?'':'onclick="rpPick(\\''+iso(c.d)+'\\')"';
            return '<div class="'+cls.join(' ')+'" '+attr+'>'+c.d.getDate()+'</div>';
          }).join('')
          +'</div>';
        return html;
      }
      function renderPanel(){
        var lm=rpState.leftMonth||new Date();
        var rm=new Date(lm.getFullYear(),lm.getMonth()+1,1);
        var pendingText=rpState.pending?'Seleccion&#225; el fin':(rpState.from&&rpState.to?fmtDMY(iso(rpState.from))+' &#8594; '+fmtDMY(iso(rpState.to)):'Eleg&#237; un rango');
        panel.innerHTML='<div class="rp-months">'
          +'<div class="rp-cal">'+renderCal(lm,'left')+'</div>'
          +'<div class="rp-cal">'+renderCal(rm,'right')+'</div>'
          +'</div>'
          +'<div class="rp-foot">'
          +'<div class="rp-info">'+pendingText+'</div>'
          +'<div class="rp-btns">'
          +'<button type="button" class="rp-btn" onclick="rpClose()">Cancelar</button>'
          +'<button type="button" class="rp-btn primary" onclick="rpApply()" '+(!rpState.from||!rpState.to||rpState.pending?'disabled':'')+'>Aplicar</button>'
          +'</div></div>';
      }
      window.rpToggle=function(){
        if(!panel.hidden){rpClose();return}
        rpState.pending=null;
        var base=rpState.from||new Date();
        rpState.leftMonth=new Date(base.getFullYear(),base.getMonth()-1,1);
        // Adjust so today's month is visible
        var t=today();
        if(rpState.leftMonth.getFullYear()>t.getFullYear()||(rpState.leftMonth.getFullYear()===t.getFullYear()&&rpState.leftMonth.getMonth()>t.getMonth())){
          rpState.leftMonth=new Date(t.getFullYear(),t.getMonth()-1,1);
        }
        renderPanel();
        panel.hidden=false;
        trigger.classList.add('open');
      };
      window.rpClose=function(){panel.hidden=true;trigger.classList.remove('open');rpState.pending=null};
      window.rpShift=function(n){var d=rpState.leftMonth;rpState.leftMonth=new Date(d.getFullYear(),d.getMonth()+n,1);renderPanel()};
      window.rpPick=function(isoStr){
        var d=parseISO(isoStr);
        if(!rpState.pending&&(!rpState.from||rpState.to)){rpState.pending=d;rpState.from=d;rpState.to=null;renderPanel();return}
        var start=rpState.pending||rpState.from;
        if(ymd(d)<ymd(start)){rpState.from=d;rpState.to=start}else{rpState.from=start;rpState.to=d}
        rpState.pending=null;renderPanel();
      };
      window.rpApply=function(){
        if(!rpState.from||!rpState.to)return;
        fromEl.value=iso(rpState.from);toEl.value=iso(rpState.to);
        updateTrigger();setActive('');reload();rpClose();
      };
      function updateTrigger(){
        trigger.querySelector('[data-role=from]').textContent=fromEl.value?fmtDMY(fromEl.value):'&#8212;';
        trigger.querySelector('[data-role=to]').textContent=toEl.value?fmtDMY(toEl.value):'&#8212;';
      }
      document.addEventListener('click',function(e){
        if(!panel.hidden&&!panel.contains(e.target)&&!trigger.contains(e.target))rpClose();
      });
      function computePreset(k){
        var now=new Date();
        var y=now.getFullYear(),m=now.getMonth();
        if(k==='mtd')return {from:iso(new Date(y,m,1)),to:iso(now)};
        if(k==='7d'){var f=new Date(now);f.setDate(f.getDate()-6);return {from:iso(f),to:iso(now)}}
        if(k==='30d'){var f2=new Date(now);f2.setDate(f2.getDate()-29);return {from:iso(f2),to:iso(now)}}
        if(k==='prev'){var pm=new Date(y,m-1,1);var end=new Date(y,m,0);return {from:iso(pm),to:iso(end)}}
        return {from:iso(new Date(y,m,1)),to:iso(now)};
      }
      function setActive(k){
        document.querySelectorAll('.inv-preset').forEach(function(b){b.classList.toggle('active',b.dataset.preset===k)});
      }
      function fmt(n){return '$ '+Number(n).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}
      var PLAT={meta:{label:'Meta Ads',icon:${JSON.stringify(META_ICON)}},gads:{label:'Google Ads',icon:${JSON.stringify(GADS_ICON)}}};
      function render(data){
        if(!data.clients||!data.clients.length){
          list.innerHTML='<div class="inv-empty">No hay clientes registrados todav&#237;a.</div>';
          return;
        }
        var EDIT_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        list.innerHTML=data.clients.map(function(c){
          var pks=Object.keys(c.platforms).filter(function(pk){return c.platforms[pk].status!=='no-account'});
          var platRows=pks.map(function(pk){
            var p=c.platforms[pk];
            var meta=PLAT[pk]||{label:pk,icon:''};
            var pctNum=p.pct==null?0:Math.min(100,Math.round(p.pct));
            var barCls=p.status==='over'?'over':(p.status==='warn'?'warn':(p.status==='no-budget'||p.status==='error'?'neutral':''));
            var pctLabel=p.status==='error'||p.status==='no-budget'?'muted':(p.status==='over'?'over':(p.status==='warn'?'warn':'ok'));
            var pctText;
            if(p.status==='error')pctText='sin datos';
            else if(p.status==='no-budget')pctText='sin presup.';
            else pctText=(p.pct==null?'&#8212;':Math.round(p.pct)+'%');
            var spendText=p.spend==null?'&#8212;':fmt(p.spend);
            var budgetText=p.budget?fmt(p.budget):'&#8212;';
            var restoText='&#8212;',restoCls='';
            if(p.budget&&p.spend!=null){
              var diff=p.budget-p.spend;
              restoText=(diff<0?'-':'')+fmt(Math.abs(diff));
              if(diff<0)restoCls=' over';
            }
            return '<div class="inv-plat-row">'
              +'<div class="inv-plat-name"><span class="ic">'+meta.icon+'</span><span>'+meta.label+'</span></div>'
              +'<div class="inv-num">'+spendText+'</div>'
              +'<div class="inv-num muted">'+budgetText+'</div>'
              +'<div class="inv-num resto'+restoCls+'">'+restoText+'</div>'
              +'<div class="inv-consumo"><div class="inv-bar-wrap"><div class="inv-bar-fill '+barCls+'" style="width:'+pctNum+'%"></div></div><span class="inv-pct '+pctLabel+'">'+pctText+'</span></div>'
              +'</div>';
          }).join('<div class="inv-grid-divider"></div>');
          var rows='<div class="inv-grid">'
            +'<div class="inv-card-title-cell"><span class="inv-card-title">'+c.name+'</span><a class="inv-card-edit" href="/admin/clients/'+c.slug+'/edit" title="Editar cliente">'+EDIT_ICON+'</a></div>'
            +'<div class="inv-col-head right">Inversi&#243;n</div>'
            +'<div class="inv-col-head right">Presupuesto</div>'
            +'<div class="inv-col-head right">Resto</div>'
            +'<div class="inv-col-head right">Consumo</div>'
            +'<div class="inv-grid-divider"></div>'
            +platRows
            +'</div>';
          if(!pks.length){
            rows='<div class="inv-card-head"><div class="inv-card-title">'+c.name+'</div><a class="inv-card-edit" href="/admin/clients/'+c.slug+'/edit" title="Editar cliente">'+EDIT_ICON+'</a></div><div class="inv-plat-empty">Sin plataformas configuradas. Cargalas desde <a href="/admin/clients/'+c.slug+'/edit">la ficha del cliente</a>.</div>';
          }
          return '<div class="inv-card">'+rows+'</div>';
        }).join('');
      }
      function reload(){
        var from=fromEl.value,to=toEl.value;
        if(!from||!to)return;
        list.innerHTML='<div class="inv-loading">Cargando&#8230;</div>';
        fetch('/admin/api/investment?from='+from+'&to='+to).then(function(r){return r.json()}).then(function(d){
          if(d.error){list.innerHTML='<div class="inv-empty">Error: '+d.error+'</div>';return}
          render(d);
        }).catch(function(e){list.innerHTML='<div class="inv-empty">Error: '+e.message+'</div>'});
      }
      document.querySelectorAll('.inv-preset').forEach(function(b){
        b.addEventListener('click',function(){
          var r=computePreset(b.dataset.preset);
          fromEl.value=r.from;toEl.value=r.to;
          rpState.from=parseISO(r.from);rpState.to=parseISO(r.to);
          updateTrigger();setActive(b.dataset.preset);reload();
        });
      });
      var init=computePreset('mtd');
      fromEl.value=init.from;toEl.value=init.to;
      rpState.from=parseISO(init.from);rpState.to=parseISO(init.to);
      updateTrigger();setActive('mtd');reload();
    })();
    <\/script>`;
  return layout({ user, active: 'investment', title: 'Inversión', body });
}

/* ─────────── Users ─────────── */
function roleSelectCS(currentRole, opts_ = {}) {
  const opts = [
    { value: 'analyst', label: 'Analista' },
    { value: 'admin', label: 'Admin' },
  ];
  const cur = opts.find((o) => o.value === currentRole) || opts[0];
  const autosave = opts_.autosave ? ` data-autosave="1" data-user-id="${esc(opts_.userId || '')}"` : '';
  return `
    <div class="cs-wrap"${autosave}>
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

function clientsAccessList(clients, userAccounts) {
  if (!clients.length) {
    return '<div class="reports-empty" style="margin:0">No hay clientes registrados todav&#237;a. Cre&#225; uno desde <a href="/admin/clients" style="color:var(--pink)">Clientes</a>.</div>';
  }
  const acc = userAccounts || { meta: [], gads: [], ga4: [] };
  const has = (platform, id) => id && (acc[platform] || []).includes(String(id));

  return clients
    .map((c) => {
      const meta = c.meta_ad_account_id;
      const gads = c.gads_customer_id;
      const ga4 = c.ga4_property_id;
      const chip = (platform, label, iconHtml, id) => {
        if (!id) return `<span class="ct-chip disabled" title="El cliente no tiene ${label} configurado"><span class="ct-icon">${iconHtml}</span><span class="ct-label">${label}</span></span>`;
        const active = has(platform, id);
        return `<button type="button" class="ct-chip ${active ? 'active' : ''}" data-client-slug="${esc(c.slug)}" data-platform="${platform}" data-account-id="${esc(String(id))}" onclick="toggleClientAccess(this)">
          <span class="ct-icon">${iconHtml}</span>
          <span class="ct-label">${label}</span>
        </button>`;
      };
      return `
      <div class="client-access-row">
        <div class="client-access-name">${esc(c.name)}</div>
        <div class="client-access-chips">
          ${chip('meta', 'Meta Ads', META_ICON, meta)}
          ${chip('gads', 'Google Ads', GADS_ICON, gads)}
          ${chip('ga4', 'GA4', GA4_ICON, ga4)}
        </div>
      </div>`;
    })
    .join('');
}

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
          <input name="email" type="email" value="${esc(t.email || '')}" placeholder="federicoc@breakmkt.com.ar">
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
          <input name="email" type="email" placeholder="federicoc@breakmkt.com.ar">
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
      <div class="actions"><form method="POST" action="/admin/users/${esc(t.id)}/regen-token" data-confirm-title="Regenerar token" data-confirm-msg="Se invalida el token actual. &#191;Continuar?" data-confirm-label="Regenerar" style="margin:0"><button class="btn ghost" type="button" onclick="askConfirmForm(this)">Regenerar</button></form></div>`
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
          <a class="icon-action" href="/admin/users/${esc(u.id)}/edit" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </a>
        </td>
        <td>
          ${
            u.id === user.id
              ? '<span class="muted" style="font-size:.75rem">&#8212;</span>'
              : `<form method="POST" action="/admin/users/${esc(u.id)}/delete" data-confirm-title="Eliminar usuario" data-confirm-msg="&#191;Eliminar a ${esc(u.name)}? Esta acci&#243;n no se puede deshacer." data-confirm-label="Eliminar" style="margin:0">
                  <button type="button" class="icon-action danger" onclick="askConfirmForm(this)" title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </form>`
          }
        </td>
      </tr>`,
    )
    .join('');

  const body = `
    <div class="filtros">
      <input type="text" id="search" class="input-search" placeholder="Buscar usuario...">
      <div class="spacer"></div>
      <button type="button" class="btn-fab" onclick="openUserNewModal()" title="Nuevo usuario" aria-label="Nuevo usuario"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th style="width:80px">Estado</th>
            <th style="width:50px" aria-label="Editar"></th>
            <th style="width:50px" aria-label="Eliminar"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${userNewModal()}`;

  return layout({ user, active: 'users', title: 'Usuarios', body, flash });
}

function userNewModal() {
  return `
<div class="modal-overlay" id="modal-user-new" hidden>
  <div class="modal" style="max-width:520px">
    <div class="accounts-modal-head">
      <div class="accounts-modal-title">
        <h3>Nuevo usuario</h3>
        <button type="button" class="btn-close" onclick="closeModal('modal-user-new')" title="Cerrar" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="accounts-divider"></div>
    </div>
    <form method="POST" action="/admin/users" style="padding:.4rem 0 0">
      <div class="form-grid">
        <div class="field full">
          <label>Nombre completo</label>
          <input name="name" type="text" required placeholder="Federico Cuellos">
        </div>
        <div class="field full">
          <label>Email</label>
          <input name="email" type="email" required placeholder="federicoc@breakmkt.com.ar">
        </div>
      </div>
      <div class="form-actions" style="border-top:none;padding-top:1rem;margin-top:.4rem">
        <button type="button" class="btn ghost" onclick="closeModal('modal-user-new')">Cancelar</button>
        <div class="spacer"></div>
        <button type="submit" class="btn primary">Crear usuario</button>
      </div>
    </form>
  </div>
</div>`;
}

/* ─────────── User edit (dedicated page, no modal) ─────────── */
export function renderUserEditView({ user, target, flash, initialPassword }) {
  const t = target || {};
  const acc = t.accounts || { meta: [], gads: [], ga4: [] };
  const dataAttrs = `data-user-id="${esc(t.id)}" data-accounts-meta="${(acc.meta || []).join(',')}" data-accounts-gads="${(acc.gads || []).join(',')}" data-accounts-ga4="${(acc.ga4 || []).join(',')}"`;
  const clients = listClients();

  const credentialsCard = initialPassword
    ? `
    <div class="card creds-card">
      <h2>Credenciales de acceso</h2>
      <p class="sub" style="margin:-.3rem 0 1rem">Esta contrase&#241;a se muestra <strong>una sola vez</strong>. Copiala y compart&#237;sela ahora; despu&#233;s no se puede volver a ver.</p>
      <div class="creds-grid">
        <div class="creds-row">
          <div class="creds-label">Email</div>
          <div class="creds-value"><code>${esc(t.email || '')}</code></div>
        </div>
        <div class="creds-row">
          <div class="creds-label">Contrase&#241;a</div>
          <div class="creds-value"><code>${esc(initialPassword)}</code></div>
        </div>
      </div>
      <div class="creds-actions">
        <button type="button" class="btn primary" onclick="copyText(${JSON.stringify(`Email: ${t.email || ''}\nContraseña: ${initialPassword}`)}, this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:.4rem"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar email y contrase&#241;a
        </button>
      </div>
    </div>`
    : '';

  const body = `
  <div id="user-editor" ${dataAttrs}>
    ${credentialsCard}
    <div class="card">
      <h2>Perfil</h2>
      <div class="profile-grid profile-grid-4">
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
          ${roleSelectCS(t.role || 'analyst', { autosave: true, userId: t.id })}
        </div>
        <div class="profile-item">
          <div class="profile-label">Regenerar credenciales</div>
          <div class="profile-value">
            <button type="button" class="btn primary regen-cred-btn" onclick="regenerateUserPassword('${esc(t.id)}',this)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:.4rem"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Regenerar acceso
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Clientes y accesos</h2>
      <p style="color:var(--muted);font-size:.85rem;margin:-.3rem 0 1rem">Toc&#225; cada plataforma para activar o desactivar el acceso a los datos del cliente en esa plataforma.</p>
      <div class="clients-access-list">${clientsAccessList(clients, acc)}</div>
    </div>


    <div class="modal-overlay" id="accounts-modal" hidden>
      <div class="modal" style="max-width:640px">
        <div class="accounts-modal-head">
          <div class="accounts-modal-title">
            <h3>Cuentas de <span>&#8212;</span></h3>
            <div class="modal-title-actions">
              <button type="button" class="btn-save-icon" id="acc-save-icon" onclick="savePickerAndClose()" title="Guardar y cerrar" aria-label="Guardar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button type="button" class="btn-close" onclick="closeModal('accounts-modal')" title="Cerrar" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div class="accounts-divider"></div>
          <p class="accounts-modal-note">Solo se muestran cuentas activas. Para activar o desactivar una cuenta dirigite al administrador de Break en Google Ads.</p>
        </div>
        <div class="accounts-modal-columns">
          <input type="checkbox" id="acc-select-all" onchange="pickerToggleAll(this.checked)" title="Seleccionar todas">
          <span class="col-name">Nombre de cuenta</span>
          <span class="col-status">
            <span class="col-status-dropdown" id="acc-status-dropdown">
              <button type="button" class="col-status-btn" onclick="toggleStatusDropdown(event)">
                <span id="acc-status-label">Estado</span>
                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>
              </button>
              <div class="col-status-menu" hidden>
                <div class="col-status-opt selected" data-value="" data-label="Estado" onclick="pickStatus(this)">Todas</div>
                <div class="col-status-opt" data-value="ENABLED" data-label="Habilitadas" onclick="pickStatus(this)">Habilitadas</div>
                <div class="col-status-opt" data-value="SUSPENDED" data-label="Suspendidas" onclick="pickStatus(this)">Suspendidas</div>
                <div class="col-status-opt" data-value="CANCELED" data-label="Canceladas" onclick="pickStatus(this)">Canceladas</div>
                <div class="col-status-opt" data-value="CLOSED" data-label="Cerradas" onclick="pickStatus(this)">Cerradas</div>
              </div>
            </span>
          </span>
          <span class="col-id">ID</span>
        </div>
        <div class="accounts-panel-list"></div>
      </div>
    </div>
  </div>`;

  const actions = `<a class="btn-back" href="/admin/users"><span class="arrow">&#8592;</span> Usuarios</a>`;
  return layout({
    user,
    active: 'users',
    title: t.name || '',
    actions,
    body,
    flash,
  });
}

/* ─────────── Client edit (mirrors user edit) ─────────── */
export function renderClientEditView({ user, target, usersWithAccess, flash }) {
  const t = target || {};
  const publicBase = (process.env.MCP_URL || 'https://mcp.breakmkt.com.ar').replace(/\/+$/, '');
  const publicUrl = `${publicBase}/${t.slug}`;
  const shortUrl = publicUrl.replace(/^https?:\/\//, '');
  const active = t.active !== false;

  const platformsForClient = [
    { key: 'meta', label: 'Meta Ads', icon: META_ICON, ids: t.meta_ad_accounts || [] },
    { key: 'gads', label: 'Google Ads', icon: GADS_ICON, ids: t.gads_customers || [] },
    { key: 'ga4', label: 'Google Analytics 4', icon: GA4_ICON, ids: t.ga4_properties || [] },
  ];
  const platformsHtml = platformsForClient
    .map((p) => {
      const rows = p.ids.length
        ? p.ids
            .map(
              (id) => `
              <div class="acc-list-row" data-account-id="${esc(id)}">
                <span class="acc-list-name" data-role="name"><span class="muted" style="font-weight:400">Cargando&#8230;</span></span>
                <span class="acc-list-id-pill" data-role="id-pill" title="${esc(id)}">${esc(id)}</span>
                <button type="button" class="icon-action danger" onclick="removeClientAccount(this,'${esc(p.key)}','${esc(id)}')" title="Quitar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>`,
            )
            .join('')
        : `<div class="acc-list-empty">Sin cuentas asociadas todav&#237;a.</div>`;
      return `
      <div class="acc-list-block" data-platform="${p.key}">
        <div class="acc-list-head">
          <div class="acc-list-head-icon">${p.icon}</div>
          <div class="acc-list-head-name">${esc(p.label)}</div>
          <button type="button" class="btn-row" onclick="openClientAccountPicker('${esc(p.key)}')">+ Agregar</button>
        </div>
        <div class="acc-list-rows">${rows}</div>
      </div>`;
    })
    .join('');

  const clientMetaIds = platformsForClient[0].ids;
  const clientGadsIds = platformsForClient[1].ids;
  const clientGa4Ids = platformsForClient[2].ids;

  const userChip = (platform, label, iconHtml, clientIds, active) => {
    if (!clientIds || !clientIds.length) {
      return `<span class="ct-chip disabled" title="El cliente no tiene ${label} configurado"><span class="ct-icon">${iconHtml}</span><span class="ct-label">${label}</span></span>`;
    }
    return `<button type="button" class="ct-chip ${active ? 'active' : ''}" data-platform="${platform}" data-client-ids="${esc(clientIds.join(','))}" onclick="toggleUserPlatformForClient(this)">
      <span class="ct-icon">${iconHtml}</span>
      <span class="ct-label">${label}</span>
    </button>`;
  };

  const usersHtml = (usersWithAccess || []).length
    ? usersWithAccess
        .map((u) => {
          const accMeta = ((u.accounts && u.accounts.meta) || []).join(',');
          const accGads = ((u.accounts && u.accounts.gads) || []).join(',');
          const accGa4 = ((u.accounts && u.accounts.ga4) || []).join(',');
          return `
          <div class="user-access-row" data-user-id="${esc(u.id)}" data-accounts-meta="${esc(accMeta)}" data-accounts-gads="${esc(accGads)}" data-accounts-ga4="${esc(accGa4)}">
            <div class="user-access-info">
              <div class="user-access-name-row">
                <div class="user-access-name">${esc(u.name)}</div>
                <span class="pill ${u.role === 'admin' ? 'admin' : 'analyst'}">${u.role === 'admin' ? 'Admin' : 'Analista'}</span>
              </div>
              ${u.email ? `<div class="user-access-email">${esc(u.email)}</div>` : ''}
            </div>
            <div class="user-access-chips">
              ${userChip('meta', 'Meta Ads', META_ICON, clientMetaIds, u._meta_access)}
              ${userChip('gads', 'Google Ads', GADS_ICON, clientGadsIds, u._gads_access)}
              ${userChip('ga4', 'GA4', GA4_ICON, clientGa4Ids, u._ga4_access)}
            </div>
          </div>`;
        })
        .join('')
    : `<div class="reports-empty" style="margin:0">Ning&#250;n usuario tiene acceso a este cliente todav&#237;a. Asign&#225;selo desde la edici&#243;n de un usuario.</div>`;

  const body = `
  <div id="client-editor" data-client-slug="${esc(t.slug)}">
    <div class="card">
      <h2>Perfil</h2>
      <div class="profile-grid">
        <div class="profile-item">
          <div class="profile-label">Nombre</div>
          <div class="profile-value">${esc(t.name || '&#8212;')}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">URL de informes</div>
          <div class="profile-value">
            <div class="url-cell-plain">
              <a href="${esc(publicUrl)}" target="_blank" rel="noopener">${esc(shortUrl)}</a>
              <button type="button" class="icon-btn-mini" onclick="copyText('${esc(publicUrl)}',this)" title="Copiar URL">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Estado</div>
          <form class="switch-form" method="POST" action="/admin/clients/${esc(t.slug)}/active" style="padding:.4rem 0">
            <label class="switch">
              <input type="checkbox" name="active" value="true" ${active ? 'checked' : ''} onchange="this.form.submit()">
              <span class="switch-slider"></span>
            </label>
          </form>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Inversi&#243;n publicitaria</h2>
      <div class="budget-grid">
        ${[
          { key: 'meta', label: 'Meta Ads', icon: META_ICON },
          { key: 'gads', label: 'Google Ads', icon: GADS_ICON },
        ]
          .map((p) => {
            const raw = t.budgets && t.budgets[p.key];
            const entry = raw == null ? { amount: '', alert_pct: 80 } : (typeof raw === 'number' ? { amount: raw, alert_pct: 80 } : { amount: raw.amount ?? '', alert_pct: raw.alert_pct ?? 80 });
            const amountDisplay = entry.amount === '' || entry.amount == null ? '' : Number(entry.amount).toLocaleString('es-AR');
            return `
            <div class="budget-card">
              <div class="budget-head">
                <div class="budget-icon">${p.icon}</div>
                <div class="budget-label">${esc(p.label)}</div>
              </div>
              <div class="budget-field">
                <label class="budget-sublabel">Presupuesto mensual</label>
                <div class="budget-input-wrap">
                  <span class="prefix">$</span>
                  <input type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${esc(amountDisplay)}" data-platform="${p.key}" data-role="amount" oninput="handleBudgetInput(this)" onblur="saveClientBudget(this)">
                  <span class="suffix">/mes</span>
                </div>
              </div>
              <div class="budget-field">
                <label class="budget-sublabel">Alertar al</label>
                <div class="budget-input-wrap">
                  <input type="number" min="1" max="100" step="1" placeholder="80" value="${esc(String(entry.alert_pct))}" data-platform="${p.key}" data-role="alert_pct" oninput="debouncedSaveBudget(this)" onchange="saveClientBudget(this)" onblur="saveClientBudget(this)">
                  <span class="suffix">% consumido</span>
                </div>
              </div>
            </div>`;
          })
          .join('')}
      </div>
    </div>

    <div class="card">
      <h2>Cuentas conectadas</h2>
      <div class="acc-list-container">${platformsHtml}</div>
    </div>

    <div class="card">
      <h2>Usuarios con acceso <span class="tag">${(usersWithAccess || []).length}</span></h2>
      <div class="users-access-list">${usersHtml}</div>
    </div>
  </div>`;

  const actions = `<a class="btn-back" href="/admin/clients"><span class="arrow">&#8592;</span> Clientes</a>`;
  return layout({
    user,
    active: 'clients',
    title: t.name || '',
    actions,
    body: body + clientAccountPickerModal(),
    flash,
  });
}

function clientAccountPickerModal() {
  return `
<div class="modal-overlay" id="client-acc-modal" hidden>
  <div class="modal" style="max-width:640px">
    <div class="accounts-modal-head">
      <div class="accounts-modal-title">
        <h3>Agregar cuenta &#183; <span id="cap-platform-label">&#8212;</span></h3>
        <button type="button" class="btn-close" onclick="closeModal('client-acc-modal')" title="Cerrar" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="accounts-divider"></div>
      <p class="accounts-modal-note">Se&#241;al&#225; qu&#233; cuentas quer&#233;s asociar al cliente. Pod&#233;s elegir m&#225;s de una.</p>
    </div>
    <div class="accounts-modal-columns">
      <input type="checkbox" id="cap-select-all" onchange="capToggleAll(this.checked)" title="Seleccionar todas">
      <span class="col-name">Nombre de cuenta</span>
      <span class="col-status">
        <span class="col-status-dropdown wz-status-dd">
          <button type="button" class="col-status-btn" onclick="wzToggleStatusDropdown(event,this)">
            <span class="wz-status-label">Estado</span>
            <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>
          </button>
          <div class="col-status-menu" hidden>
            <div class="col-status-opt selected" data-value="" data-label="Estado" onclick="wzPickStatus(this)">Todas</div>
            <div class="col-status-opt" data-value="ENABLED" data-label="Habilitadas" onclick="wzPickStatus(this)">Habilitadas</div>
            <div class="col-status-opt" data-value="SUSPENDED" data-label="Suspendidas" onclick="wzPickStatus(this)">Suspendidas</div>
            <div class="col-status-opt" data-value="CANCELED" data-label="Canceladas" onclick="wzPickStatus(this)">Canceladas</div>
            <div class="col-status-opt" data-value="CLOSED" data-label="Cerradas" onclick="wzPickStatus(this)">Cerradas</div>
          </div>
        </span>
      </span>
      <span class="col-id">ID</span>
    </div>
    <div class="accounts-panel-list" id="cap-list"></div>
    <div class="form-actions" style="border-top:none;padding-top:0;margin-top:1rem">
      <button type="button" class="btn ghost" onclick="closeModal('client-acc-modal')">Cancelar</button>
      <div class="spacer"></div>
      <button type="button" class="btn primary" id="cap-save" onclick="saveClientAccounts()">Agregar seleccionadas</button>
    </div>
  </div>
</div>`;
}

/* ─────────── User new (dedicated page) ─────────── */
export function renderUserNewView({ user, flash }) {
  const body = `
    <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1rem">
      <a href="/admin/users" class="btn ghost" style="padding:.4rem .8rem">&#8592; Usuarios</a>
    </div>
    <h1>Nuevo usuario</h1>
    <p class="sub">Cre&#225; la cuenta con nombre y email.</p>

    <form method="POST" action="/admin/users">
      <div class="card" style="max-width:640px">
        <h2>Datos b&#225;sicos</h2>
        <div class="form-grid">
          <div class="field full">
            <label>Nombre completo</label>
            <input name="name" type="text" required autofocus placeholder="Federico Cuellos">
          </div>
          <div class="field full">
            <label>Email</label>
            <input name="email" type="email" required placeholder="federicoc@breakmkt.com.ar">
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
  const publicBase = (process.env.MCP_URL || 'https://mcp.breakmkt.com.ar').replace(/\/+$/, '');

  const rows = clients
    .map((c) => {
      const publicUrl = `${publicBase}/${c.slug}`;
      const shortUrl = publicUrl.replace(/^https?:\/\//, '');
      const active = c.active !== false;
      return `
      <tr data-searchable>
        <td><div style="font-weight:600">${esc(c.name)}</div></td>
        <td>
          <div class="url-cell-plain">
            <a href="${esc(publicUrl)}" target="_blank" rel="noopener">${esc(shortUrl)}</a>
            <button type="button" class="icon-btn-mini" onclick="copyText('${esc(publicUrl)}',this)" title="Copiar URL">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </td>
        <td>
          ${
            isAdmin
              ? `<form class="switch-form" method="POST" action="/admin/clients/${esc(c.slug)}/active">
                  <label class="switch" title="${active ? 'Activo' : 'Pausado'}">
                    <input type="checkbox" name="active" value="true" ${active ? 'checked' : ''} onchange="this.form.submit()">
                    <span class="switch-slider"></span>
                  </label>
                </form>`
              : `<span class="pill ${active ? 'ok' : 'warn'}">${active ? 'Activo' : 'Pausado'}</span>`
          }
        </td>
        <td>
          ${
            isAdmin
              ? `<a class="icon-action" href="/admin/clients/${esc(c.slug)}/edit" title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </a>`
              : ''
          }
        </td>
        <td>
          ${
            isAdmin
              ? `<form method="POST" action="/admin/clients/${esc(c.slug)}/delete" data-confirm-title="Eliminar cliente" data-confirm-msg="&#191;Eliminar ${esc(c.name)}? Los usuarios que lo ten&#237;an asignado quedan sin ese acceso." data-confirm-label="Eliminar" style="margin:0">
                  <button type="button" class="icon-action danger" onclick="askConfirmForm(this)" title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </form>`
              : ''
          }
        </td>
      </tr>`;
    })
    .join('');

  const editModals = isAdmin ? clients.map((c) => clientModal({ mode: 'edit', target: c })).join('') : '';

  const body = `
    <div class="filtros">
      <input type="text" id="search" class="input-search" placeholder="Buscar cliente...">
      <div class="spacer"></div>
      ${isAdmin ? '<button type="button" class="btn-fab" onclick="openClientWizard()" title="Nuevo cliente" aria-label="Nuevo cliente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' : ''}
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>URL Informes</th>
            <th style="width:80px">Estado</th>
            <th style="width:50px" aria-label="Editar"></th>
            <th style="width:50px" aria-label="Eliminar"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${editModals}
    ${isAdmin ? clientWizardModal() : ''}`;

  return layout({ user, active: 'clients', title: 'Clientes', body, flash });
}

function wizardPickerBlock(platform) {
  return `
  <div class="wizard-picker" data-platform="${platform}">
    <div class="wizard-picker-cols">
      <span class="wpc-radio"></span>
      <span class="wpc-name">Nombre de cuenta</span>
      <span class="wpc-status">
        <span class="col-status-dropdown wz-status-dd">
          <button type="button" class="col-status-btn" onclick="wzToggleStatusDropdown(event,this)">
            <span class="wz-status-label">Estado</span>
            <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>
          </button>
          <div class="col-status-menu" hidden>
            <div class="col-status-opt selected" data-value="" data-label="Estado" onclick="wzPickStatus(this)">Todas</div>
            <div class="col-status-opt" data-value="ENABLED" data-label="Habilitadas" onclick="wzPickStatus(this)">Habilitadas</div>
            <div class="col-status-opt" data-value="SUSPENDED" data-label="Suspendidas" onclick="wzPickStatus(this)">Suspendidas</div>
            <div class="col-status-opt" data-value="CANCELED" data-label="Canceladas" onclick="wzPickStatus(this)">Canceladas</div>
            <div class="col-status-opt" data-value="CLOSED" data-label="Cerradas" onclick="wzPickStatus(this)">Cerradas</div>
          </div>
        </span>
      </span>
      <span class="wpc-id">ID</span>
    </div>
    <div class="wizard-picker-list" data-platform="${platform}"></div>
  </div>`;
}

function clientWizardModal() {
  return `
<div class="modal-overlay" id="wizard-modal" hidden>
  <div class="modal" style="max-width:620px">
    <div class="accounts-modal-head">
      <div class="accounts-modal-title">
        <h3 id="wz-heading">Nuevo cliente</h3>
        <div class="modal-title-actions">
          <button type="button" class="btn-close" onclick="closeModal('wizard-modal')" title="Cerrar" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="wizard-progress">
        <div class="wp-step active" data-idx="1">1</div>
        <div class="wp-line"></div>
        <div class="wp-step" data-idx="2">2</div>
        <div class="wp-line"></div>
        <div class="wp-step" data-idx="3">3</div>
        <div class="wp-line"></div>
        <div class="wp-step" data-idx="4">4</div>
      </div>
    </div>
    <div class="wizard-body">
      <div class="wizard-step active" data-step="1">
        <label class="wizard-input-label">Nombre del cliente</label>
        <input type="text" id="wz-name" class="wizard-input" placeholder="Ej: Preston" autocomplete="off">
      </div>
      <div class="wizard-step" data-step="2">
        <p class="wizard-help">Eleg&#237; la cuenta de <strong>Google Ads</strong> asociada al cliente.</p>
        ${wizardPickerBlock('gads')}
      </div>
      <div class="wizard-step" data-step="3">
        <p class="wizard-help">Eleg&#237; el ad account de <strong>Meta Ads</strong>.</p>
        ${wizardPickerBlock('meta')}
      </div>
      <div class="wizard-step" data-step="4">
        <p class="wizard-help">Eleg&#237; la <strong>property de Google Analytics 4</strong>.</p>
        ${wizardPickerBlock('ga4')}
      </div>
    </div>
    <div class="wizard-footer">
      <button type="button" class="btn ghost" id="wz-back" onclick="wizardBack()" style="visibility:hidden">&#8592; Atr&#225;s</button>
      <div class="wizard-footer-right">
        <button type="button" class="btn ghost" id="wz-skip" onclick="wizardSkip()" style="display:none">Saltar</button>
        <button type="button" class="btn primary" id="wz-next" onclick="wizardNext()">Siguiente</button>
      </div>
    </div>
  </div>
</div>`;
}

/* ─────────── Config MD ─────────── */
export function renderConfigView({ user, md, mcpUrl }) {
  const body = `
    <h1>Tu archivo <span class="grad">break-mcp-${esc(user.id)}.md</span></h1>
    <p class="sub">Descargalo y guardalo en <code>~/.claude/</code>. Cont&#237;ene tu bearer token del MCP y las instrucciones de uso.</p>
    <div class="card">
      <h2>
        <span>Contenido</span>
        <div class="h2-actions">
          <button type="button" class="icon-btn" onclick="copyMdToClipboard(this)" title="Copiar contenido">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copiar</span>
          </button>
          <a class="icon-btn" href="/admin/config.md" download="break-mcp-${esc(user.id)}.md" title="Descargar .md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>MD</span>
          </a>
          <a class="icon-btn" href="/admin/config.json" download="break-mcp-${esc(user.id)}.json" title="Descargar .json">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>JSON</span>
          </a>
        </div>
      </h2>
      <div class="md-box">${esc(md)}</div>
    </div>`;
  return layout({ user, active: 'config', title: 'Mi config MCP', body });
}

/* ─────────── Logs ─────────── */
function formatLogDate(iso) {
  if (!iso) return '&#8212;';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return esc(iso);
    const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fecha} <span class="log-hora">${hora}</span>`;
  } catch {
    return esc(iso);
  }
}

function formatLogAsText(l) {
  const user = l.userName ? `${l.userName}${l.userId ? ` (${l.userId})` : ''}` : (l.userId || '—');
  return [
    `Fecha: ${l.createdAt || '—'}`,
    `Usuario: ${user}`,
    `Título: ${l.title || ''}`,
    `Descripción: ${l.description || ''}`,
  ].join('\n');
}

export function renderLogsView({ user, logs, flash }) {
  const list = logs || [];
  const rows = list.length
    ? list
        .map((l) => {
          const copyText = formatLogAsText(l);
          return `
      <tr>
        <td class="log-date">${formatLogDate(l.createdAt)}</td>
        <td class="log-user">
          <div class="log-user-name">${esc(l.userName || '&#8212;')}</div>
          ${l.userId ? `<div class="log-user-id">${esc(l.userId)}</div>` : ''}
        </td>
        <td class="log-title">${esc(l.title || '')}</td>
        <td class="log-desc"><div class="log-desc-text">${esc(l.description || '')}</div></td>
        <td class="log-actions">
          <button type="button" class="icon-action" title="Copiar log" data-copy="${esc(copyText)}" onclick="copyFromData(this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <form method="POST" action="/admin/logs/${esc(l.id)}/delete" data-confirm-title="Eliminar log" data-confirm-msg="&#191;Eliminar este log? Esta acci&#243;n no se puede deshacer." data-confirm-label="Eliminar" style="margin:0">
            <button type="button" class="icon-action danger" onclick="askConfirmForm(this)" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </form>
        </td>
      </tr>`;
        })
        .join('')
    : '';

  const allText = list.map(formatLogAsText).join('\n\n---\n\n');

  const topBar = `
    <div class="filtros">
      <div class="spacer"></div>
      <button type="button" class="icon-btn" title="Copiar todos los logs" data-copy="${esc(allText)}" onclick="copyFromData(this)" ${list.length ? '' : 'disabled'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copiar todos</span>
      </button>
    </div>`;

  const body = list.length
    ? `
${topBar}
    <div class="table-wrap">
      <table class="logs-table">
        <thead>
          <tr>
            <th style="width:160px">Fecha</th>
            <th style="width:180px">Usuario MCP</th>
            <th style="width:220px">T&#237;tulo</th>
            <th>Descripci&#243;n</th>
            <th style="width:90px" aria-label="Acciones"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
    : `
<div class="reports-empty" style="margin:0">No hay logs todav&#237;a. Las IA de los clientes pueden reportar problemas o limitaciones llamando al tool <code>report_issue</code> desde el MCP.</div>`;

  return layout({ user, active: 'logs', title: 'Logs', body, flash });
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
