import { esc, FONT_LINK, FAVICON } from './common.js';

const CSS = `
:root{
  --bg:#F5F3F7; --black:#1B1B1D; --gray:#656467; --white:#FFFFFF; --border:#DDDDDD;
  --grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%);
  --w-dim:rgba(255,255,255,.45); --coral:#EE394D;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--black);color:var(--white);min-height:100vh;display:flex;flex-direction:column;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.gb{height:2px;background:var(--grad)}
.orb{position:absolute;border-radius:50%;background:var(--grad);opacity:.14;filter:blur(90px);pointer-events:none}
main{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden}
.card{width:100%;max-width:420px;position:relative;z-index:2}
.brand{display:flex;align-items:center;justify-content:center;gap:.6rem;font-size:1.4rem;font-weight:400;letter-spacing:-.01em;margin-bottom:2.2rem}
.dot{display:inline-block;width:8px;height:8px;background:var(--grad);border-radius:50%;vertical-align:super}
.kicker{display:block;font-size:.66rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--w-dim);text-align:center;margin-bottom:.8rem}
h1{font-size:2.2rem;font-weight:800;letter-spacing:-.035em;line-height:1;text-align:center;margin-bottom:2rem;text-wrap:balance}
.grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
form{display:flex;flex-direction:column;gap:.9rem}
label{display:block;font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--w-dim);margin-bottom:.4rem}
input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:var(--white);font:400 15px 'Inter',sans-serif;padding:.85rem 1rem;outline:none;transition:border-color .2s,background .2s}
input:focus{border-color:#BF4FCD;background:rgba(255,255,255,.06)}
button{margin-top:.5rem;background:var(--grad);color:var(--white);border:none;padding:.95rem 1.2rem;font:700 .78rem 'Inter',sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:transform .1s;font-family:'Inter',sans-serif}
button:hover{transform:translateY(-1px)}
button:active{transform:translateY(0)}
.err{margin-top:1.2rem;padding:.8rem 1rem;background:rgba(238,57,77,.14);border-left:2px solid var(--coral);color:#ffb3ba;font-size:.86rem}
footer{padding:1.4rem;text-align:center;font-size:.72rem;color:var(--w-dim);letter-spacing:.12em;text-transform:uppercase}
`;

export function renderLogin({ error, next } = {}) {
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>break-mcp &#183; login</title>
${FONT_LINK}
${FAVICON}
<style>${CSS}</style>
</head><body>
<div class="gb"></div>
<main>
  <div class="orb" style="width:520px;height:520px;right:-140px;top:-160px"></div>
  <div class="orb" style="width:360px;height:360px;left:-120px;bottom:-180px;opacity:.09"></div>
  <div class="card">
    <div class="brand">break<span class="dot"></span></div>
    <span class="kicker">Panel de agencia</span>
    <h1>Entr&#225; a tu <span class="grad-text">consola</span>.</h1>
    <form method="POST" action="/login">
      ${next ? `<input type="hidden" name="next" value="${esc(next)}">` : ''}
      <div>
        <label for="id">Usuario o email</label>
        <input id="id" name="id" type="text" autocomplete="username" required autofocus>
      </div>
      <div>
        <label for="password">Contrase&#241;a</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>
      </div>
      <button type="submit">Ingresar</button>
      ${error ? `<div class="err">${esc(error)}</div>` : ''}
    </form>
  </div>
</main>
<footer>break &#183; mcp</footer>
</body></html>`;
}
