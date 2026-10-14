import { getClient } from '../clients.js';

const V4 = (sub) => `https://${sub}.kommo.com/api/v4`;

function resolveAuth(clientSlug) {
  const c = getClient(clientSlug);
  const k = c.kommo || {};
  if (!k.subdomain || !k.token) {
    throw new Error(
      `Cliente "${clientSlug}" no tiene Kommo configurado (falta subdomain o token). Revisá el panel admin → Clientes → Kommo.`,
    );
  }
  if (k.token_exp && Number(k.token_exp) * 1000 < Date.now()) {
    throw new Error(
      `El token de Kommo de "${clientSlug}" venció el ${new Date(Number(k.token_exp) * 1000).toISOString().slice(0, 10)}. Pedí al cliente que lo renueve y actualizalo en el admin.`,
    );
  }
  return { subdomain: k.subdomain, token: k.token };
}

async function kgetRaw(clientSlug, path, params = {}) {
  const { subdomain, token } = resolveAuth(clientSlug);
  const url = new URL(`${V4(subdomain)}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.detail || body?.title || body?.message || `HTTP ${res.status}`;
    throw new Error(`Kommo API error (${res.status}): ${msg}`);
  }
  return body;
}

export async function listPipelines(clientSlug) {
  const data = await kgetRaw(clientSlug, '/leads/pipelines');
  const pipelines = data?._embedded?.pipelines || [];
  return pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    is_main: !!p.is_main,
    is_archive: !!p.is_archive,
    sort: p.sort,
    statuses: (p._embedded?.statuses || []).map((s) => ({
      id: s.id,
      name: s.name,
      sort: s.sort,
      color: s.color,
      type: s.type,
    })),
  }));
}

function pipelinesIndex(pipelines) {
  const byId = new Map();
  const stageById = new Map();
  for (const p of pipelines) {
    byId.set(p.id, p);
    for (const s of p.statuses || []) stageById.set(s.id, { ...s, pipeline_id: p.id });
  }
  return { byId, stageById };
}

function resolvePipelineId(pipelineInput, pipelines) {
  if (pipelineInput == null || pipelineInput === '') return null;
  const asNum = Number(pipelineInput);
  if (Number.isFinite(asNum) && pipelines.some((p) => p.id === asNum)) return asNum;
  const needle = String(pipelineInput).toLowerCase().trim();
  const hit = pipelines.find(
    (p) => p.name.toLowerCase() === needle || p.name.toLowerCase().includes(needle),
  );
  if (!hit) {
    const known = pipelines.map((p) => `${p.id}=${p.name}`).join(' | ');
    throw new Error(`Pipeline "${pipelineInput}" no encontrado. Opciones: ${known}`);
  }
  return hit.id;
}

function toUnix(dateStr) {
  if (dateStr == null || dateStr === '') return null;
  if (/^\d+$/.test(String(dateStr))) return Number(dateStr);
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) throw new Error(`Fecha inválida: ${dateStr}`);
  return Math.floor(d.getTime() / 1000);
}

export async function listLeads({
  clientSlug,
  pipeline,
  created_from,
  created_to,
  page = 1,
  limit = 250,
  with_contacts = false,
}) {
  const pipelines = await listPipelines(clientSlug);
  const { byId, stageById } = pipelinesIndex(pipelines);
  const pipelineId = resolvePipelineId(pipeline, pipelines);

  const params = {
    page,
    limit: Math.min(Math.max(Number(limit) || 50, 1), 250),
    with: ['contacts'].filter(() => with_contacts).join(','),
  };
  if (pipelineId) params['filter[pipeline_id]'] = pipelineId;
  const from = toUnix(created_from);
  const to = toUnix(created_to);
  if (from) params['filter[created_at][from]'] = from;
  if (to) params['filter[created_at][to]'] = to;

  const data = await kgetRaw(clientSlug, '/leads', params);
  const leads = data?._embedded?.leads || [];
  const total = data?._total_items ?? null;
  const nextPage = data?._links?.next ? Number(page) + 1 : null;

  const simplified = leads.map((l) => {
    const stage = stageById.get(l.status_id);
    const pipelineName = byId.get(l.pipeline_id)?.name || null;
    return {
      id: l.id,
      name: l.name,
      price: l.price ?? null,
      pipeline_id: l.pipeline_id,
      pipeline_name: pipelineName,
      status_id: l.status_id,
      stage_name: stage?.name || null,
      stage_type: stage?.type ?? null,
      tags: (l._embedded?.tags || []).map((t) => t.name),
      created_at: l.created_at ? new Date(l.created_at * 1000).toISOString() : null,
      updated_at: l.updated_at ? new Date(l.updated_at * 1000).toISOString() : null,
      closed_at: l.closed_at ? new Date(l.closed_at * 1000).toISOString() : null,
      loss_reason_id: l.loss_reason_id ?? null,
      responsible_user_id: l.responsible_user_id ?? null,
      created_at_unix: l.created_at ?? null,
      contacts: with_contacts
        ? (l._embedded?.contacts || []).map((c) => ({ id: c.id, is_main: !!c.is_main }))
        : undefined,
    };
  });

  return {
    page: Number(page),
    limit: params.limit,
    returned: simplified.length,
    total_items: total,
    next_page: nextPage,
    leads: simplified,
  };
}
