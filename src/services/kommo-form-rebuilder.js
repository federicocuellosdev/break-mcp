// Servicio en vivo: cada N minutos revisa la pipeline de Marlaca en Kommo,
// detecta los leads unsorted creados por la integración nativa de Facebook
// (lead.name = "Facebook №...") y los reconstruye en el formato propio:
//   · name = "FORM - <Contacto>"
//   · tags = ["FORM - Marlaca", "Meta Ads"]
//   · custom_fields del lead vaciados
//   · nota common con "Respuestas del formulario" + "Datos de seguimiento"
//
// Config via env:
//   KOMMO_REBUILDER_INTERVAL_MS   (default 180000 = 3 min)
//   KOMMO_REBUILDER_DISABLED=1    para apagar
//
// Clientes cubiertos: lista hardcoded (por ahora solo Marlaca con su pipeline).
// Para agregar otro cliente agregá su entry en TARGETS.

import { getClient } from '../clients.js';

const TARGETS = [
  { slug: 'marlaca', pipeline_id: 14547399, source_label: 'Meta Lead Ads', form_id: '1477737454181714' },
];

function cleanValue(v) {
  if (!v) return '';
  const s = String(v).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFullContactName(contact) {
  const first = (contact?.first_name || '').trim();
  const last = (contact?.last_name || '').trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return (contact?.name || 'Sin nombre').trim();
}

function buildNoteRespuestas(leadFull, target, fbLeadId) {
  const cf = leadFull.custom_fields_values || [];
  const answers = cf
    .filter((f) => !['WhatsApp', 'Teléfono', 'Phone'].includes(f.field_name))
    .map((f) => ({
      q: f.field_name,
      a: (f.values || []).map((v) => cleanValue(v.value)).join(', '),
    }))
    .filter((x) => x.a);
  const waField = cf.find((f) => ['WhatsApp', 'Teléfono'].includes(f.field_name));
  const waValue = waField?.values?.[0]?.value;

  let txt = 'Respuestas del formulario\n--\n';
  for (const { q, a } of answers) txt += `• ${q}: ${a}\n`;
  if (waValue) txt += `• WhatsApp: ${waValue}\n`;

  txt += '\n---\nDatos de seguimiento\n--\n';
  txt += `• Plataforma: ${target.source_label}\n`;
  txt += `• Form ID: ${target.form_id}`;
  if (fbLeadId) txt += `\n• FB Lead ID: ${fbLeadId}`;
  return txt;
}

async function kreq(target, method, path, body = null, params = {}) {
  const c = getClient(target.slug);
  const k = c.kommo || {};
  if (!k.subdomain || !k.token) throw new Error(`${target.slug}: Kommo no configurado`);
  if (k.token_exp && Number(k.token_exp) * 1000 < Date.now()) {
    throw new Error(`${target.slug}: Kommo token vencido`);
  }
  const u = new URL(`https://${k.subdomain}.kommo.com${path}`);
  for (const [kk, vv] of Object.entries(params)) u.searchParams.set(kk, vv);
  const opts = {
    method,
    headers: { Authorization: `Bearer ${k.token}`, Accept: 'application/json' },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(u, opts);
  if (r.status === 204) return null;
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function processTarget(target) {
  const started = Date.now();
  const stats = { slug: target.slug, scanned: 0, rebuilt: 0, skipped: 0, failed: 0, details: [] };

  const uns = await kreq(target, 'GET', '/api/v4/leads/unsorted', null, {
    'filter[pipeline_id]': String(target.pipeline_id),
    limit: '50',
  });
  const items = uns?._embedded?.unsorted || [];
  stats.scanned = items.length;

  for (const u of items) {
    const leadId = u._embedded?.leads?.[0]?.id;
    if (!leadId) { stats.skipped++; continue; }

    try {
      const leadFull = await kreq(target, 'GET', `/api/v4/leads/${leadId}`, null, { with: 'contacts' });
      const name = leadFull.name || '';
      if (name.startsWith('FORM - ')) { stats.skipped++; continue; }
      if (!/^Facebook\s*(?:N[º°]|№)/.test(name)) { stats.skipped++; continue; }

      const contactId = leadFull._embedded?.contacts?.[0]?.id;
      const contact = contactId
        ? await kreq(target, 'GET', `/api/v4/contacts/${contactId}`)
        : null;
      const fullName = getFullContactName(contact);
      const newName = `FORM - ${fullName}`;
      const newTags = ['FORM - Marlaca', 'Meta Ads'].map((n) => ({ name: n }));
      const fbMatch = name.match(/Facebook\s*(?:N[º°]|№)\s*(\d+)/);
      const fbLeadId = fbMatch ? fbMatch[1] : null;
      const noteResp = buildNoteRespuestas(leadFull, target, fbLeadId);

      await kreq(target, 'PATCH', `/api/v4/leads/${leadId}`, {
        name: newName,
        custom_fields_values: [],
        _embedded: { tags: newTags },
      });
      await kreq(target, 'POST', `/api/v4/leads/${leadId}/notes`, [
        { note_type: 'common', params: { text: noteResp } },
      ]);
      stats.rebuilt++;
      stats.details.push({ lead_id: leadId, from: name, to: newName });
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      stats.failed++;
      stats.details.push({ lead_id: leadId, error: e.message.slice(0, 200) });
      console.warn(`[kommo-rebuilder] ${target.slug} lead ${leadId} fail:`, e.message.slice(0, 200));
    }
  }

  stats.elapsed_ms = Date.now() - started;
  if (stats.rebuilt > 0 || stats.failed > 0) {
    console.log(`[kommo-rebuilder] ${target.slug}: scanned=${stats.scanned} rebuilt=${stats.rebuilt} failed=${stats.failed} (${stats.elapsed_ms}ms)`);
  }
  return stats;
}

async function tick() {
  const results = [];
  for (const target of TARGETS) {
    try {
      results.push(await processTarget(target));
    } catch (e) {
      console.warn(`[kommo-rebuilder] ${target.slug} ciclo fail:`, e.message.slice(0, 200));
      results.push({ slug: target.slug, error: e.message.slice(0, 300) });
    }
  }
  return results;
}

let timer = null;
export function startKommoFormRebuilder() {
  if (process.env.KOMMO_REBUILDER_DISABLED === '1') {
    console.log('[kommo-rebuilder] disabled via env');
    return;
  }
  if (timer) return;
  const interval = Number(process.env.KOMMO_REBUILDER_INTERVAL_MS) || 180_000; // 3 min
  console.log(`[kommo-rebuilder] start, interval=${interval}ms, targets=${TARGETS.map((t) => t.slug).join(',')}`);
  // Primer tick al minuto para no bloquear el boot
  setTimeout(tick, 60_000);
  timer = setInterval(tick, interval);
}

// Para disparar manualmente desde una route de admin si hace falta
export async function runKommoFormRebuilderOnce() {
  const results = await tick();
  return { ok: true, results };
}

// Cleanup one-shot: borra las notas con texto "Para hablar por WhatsApp..."
// de todos los leads de Marlaca (dejadas por un rebuild viejo).
export async function cleanupWhatsAppNotes({ slug = 'marlaca', pipeline_id = 14547399 } = {}) {
  const target = { slug };
  const stats = { scanned_leads: 0, found_notes: 0, deleted: 0, failed: 0, errors: [] };

  async function listAll(path, params = {}) {
    const all = [];
    for (let page = 1; page <= 10; page++) {
      const j = await kreq(target, 'GET', path, null, { ...params, page: String(page), limit: '250' });
      if (!j) break;
      const items = j?._embedded?.leads || j?._embedded?.notes || j?._embedded?.unsorted || [];
      all.push(...items);
      if (!j?._links?.next) break;
    }
    return all;
  }

  const formales = await listAll('/api/v4/leads', { 'filter[pipeline_id]': String(pipeline_id) });
  const unsorted = await listAll('/api/v4/leads/unsorted', { 'filter[pipeline_id]': String(pipeline_id) });
  const leadIds = new Set();
  for (const l of formales) leadIds.add(l.id);
  for (const u of unsorted) { const id = u._embedded?.leads?.[0]?.id; if (id) leadIds.add(id); }
  stats.scanned_leads = leadIds.size;

  for (const leadId of leadIds) {
    try {
      const notesData = await kreq(target, 'GET', `/api/v4/leads/${leadId}/notes`, null, { limit: '250' });
      const notes = notesData?._embedded?.notes || [];
      const waNotes = notes.filter((n) => n.note_type === 'common' && typeof n.params?.text === 'string' && n.params.text.startsWith('Para hablar por WhatsApp'));
      stats.found_notes += waNotes.length;
      for (const n of waNotes) {
        let done = false;
        // 1) intentar DELETE
        try {
          await kreq(target, 'DELETE', `/api/v4/leads/${leadId}/notes/${n.id}`);
          stats.deleted++;
          done = true;
        } catch (e) {
          // 2) fallback: PATCH para vaciar el texto (requiere note_type)
          try {
            await kreq(target, 'PATCH', `/api/v4/leads/${leadId}/notes/${n.id}`, {
              note_type: 'common',
              params: { text: '—' },
            });
            stats.patched = (stats.patched || 0) + 1;
            done = true;
          } catch (e2) {
            // 3) fallback 2: PATCH bulk
            try {
              await kreq(target, 'PATCH', `/api/v4/leads/notes`, [
                { id: n.id, entity_id: leadId, note_type: 'common', params: { text: '—' } },
              ]);
              stats.patched_bulk = (stats.patched_bulk || 0) + 1;
              done = true;
            } catch (e3) {
              stats.failed++;
              stats.errors.push({
                lead_id: leadId,
                note_id: n.id,
                delete_err: e.message.slice(0, 120),
                patch_err: e2.message.slice(0, 120),
                bulk_err: e3.message.slice(0, 120),
              });
            }
          }
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      stats.errors.push({ lead_id: leadId, error: 'list notes: ' + e.message.slice(0, 180) });
    }
  }
  return stats;
}
