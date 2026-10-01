const BASE = process.env.BASE || 'http://127.0.0.1:3999';
const DRY = process.argv.includes('--dry');

const now = new Date();
const FROM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const TO = now.toISOString().slice(0, 10);

const r = await fetch(`${BASE}/admin/api/investment?from=${FROM}&to=${TO}`);
if (!r.ok) {
  console.error('Error', r.status, await r.text());
  process.exit(1);
}
const data = await r.json();

const toPause = [];
const skipped = [];

for (const c of data.clients) {
  const platforms = Object.entries(c.platforms || {}).filter(
    ([, p]) => p.status !== 'no-account',
  );
  if (!platforms.length) {
    skipped.push({ name: c.name, reason: 'sin plataformas configuradas' });
    continue;
  }
  const hasError = platforms.some(([, p]) => p.status === 'error');
  if (hasError) {
    skipped.push({ name: c.name, reason: 'error de API (no verificable)' });
    continue;
  }
  const allZero = platforms.every(([, p]) => Number(p.spend) === 0);
  const hasAnyKnown = platforms.some(([, p]) => p.spend != null);
  if (allZero && hasAnyKnown) {
    toPause.push({ slug: c.slug, name: c.name, platforms: platforms.map(([k]) => k).join('+') });
  }
}

console.log(`\n=== Clientes a pausar (${toPause.length}) — rango ${FROM} → ${TO} ===`);
for (const c of toPause) console.log(`  ${c.slug.padEnd(22)}  ${c.name.padEnd(28)}  [${c.platforms}]`);

if (DRY) {
  console.log('\n--dry: no se pausó nada.');
  process.exit(0);
}

console.log('\nPausando...');
let ok = 0, fail = 0;
for (const c of toPause) {
  try {
    const resp = await fetch(`${BASE}/admin/clients/${c.slug}/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ active: 'false' }).toString(),
      redirect: 'manual',
    });
    if (resp.status >= 200 && resp.status < 400) ok++;
    else { fail++; console.log(`  FAIL ${c.slug} -> ${resp.status}`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL ${c.slug} -> ${e.message}`);
  }
}
console.log(`\nResultado: ${ok} pausados, ${fail} errores.`);
