// Clasificación de campañas Meta Ads por categoría (Reconocimiento / Interacción / Conversión)
// y agregación para la sección "Saturación".
//
// Mapeo basado en el campo "objective" de Meta. Convive la generación vieja (BRAND_AWARENESS,
// TRAFFIC, etc.) con los ODAX (OUTCOME_*). Todo lo no mapeado cae en "Otros".

const CATEGORY_MAP = {
  // Reconocimiento
  BRAND_AWARENESS: 'Reconocimiento',
  REACH: 'Reconocimiento',
  OUTCOME_AWARENESS: 'Reconocimiento',
  VIDEO_VIEWS: 'Reconocimiento',

  // Interacción
  TRAFFIC: 'Interacción',
  ENGAGEMENT: 'Interacción',
  MESSAGES: 'Interacción',
  APP_INSTALLS: 'Interacción',
  POST_ENGAGEMENT: 'Interacción',
  PAGE_LIKES: 'Interacción',
  LINK_CLICKS: 'Interacción',
  EVENT_RESPONSES: 'Interacción',
  OUTCOME_TRAFFIC: 'Interacción',
  OUTCOME_ENGAGEMENT: 'Interacción',
  OUTCOME_APP_PROMOTION: 'Interacción',

  // Conversión
  CONVERSIONS: 'Conversión',
  CATALOG_SALES: 'Conversión',
  LEAD_GENERATION: 'Conversión',
  PRODUCT_CATALOG_SALES: 'Conversión',
  STORE_VISITS: 'Conversión',
  OUTCOME_LEADS: 'Conversión',
  OUTCOME_SALES: 'Conversión',
  OUTCOME_STORE_VISITS: 'Conversión',
};

export const CATEGORIES = ['Reconocimiento', 'Interacción', 'Conversión'];

export function classifyObjective(objective) {
  if (!objective) return 'Otros';
  return CATEGORY_MAP[String(objective).toUpperCase()] || 'Otros';
}

async function metaGet(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not set');
  const ver = process.env.META_GRAPH_VERSION || 'v21.0';
  const url = new URL(`https://graph.facebook.com/${ver}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
}

function emptyBuckets() {
  const b = {};
  for (const cat of CATEGORIES) b[cat] = { spend: 0, reach: 0, impressions: 0, campaigns: 0 };
  b['Otros'] = { spend: 0, reach: 0, impressions: 0, campaigns: 0 };
  return b;
}

function computeFrequency(reach, impressions) {
  if (!reach) return 0;
  return impressions / reach;
}

// Trae todas las campañas con datos (spend o impressions > 0) de las cuentas del cliente
// en el período, con su objective y métricas.
export async function fetchClientCampaigns({ metaAccounts, from, to }) {
  const out = [];
  let currency = null;
  for (const acc of metaAccounts || []) {
    try {
      const j = await metaGet(`/${acc}/insights`, {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,objective,spend,reach,impressions,account_currency',
        time_range: { since: from, until: to },
        limit: 500,
      });
      for (const row of j.data || []) {
        if (row.account_currency && !currency) currency = row.account_currency;
        const spend = Number(row.spend || 0);
        const reach = Number(row.reach || 0);
        const impressions = Number(row.impressions || 0);
        if (spend === 0 && impressions === 0) continue; // sin datos en el período
        const category = classifyObjective(row.objective);
        out.push({
          account_id: acc,
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          objective: row.objective || null,
          category,
          spend,
          reach,
          impressions,
          frequency: computeFrequency(reach, impressions),
        });
      }
    } catch (e) {
      // guardar el error pero seguir con las demás cuentas
      out.push({ account_id: acc, error: e.message });
    }
  }
  return { currency, campaigns: out };
}

// Agrega un conjunto de campañas por categoría. Para cada bucket:
//   spend = sum, reach = sum, impressions = sum, frequency = sum(imp)/sum(reach), pct = spend/total*100
export function aggregateByCategory(campaigns) {
  const buckets = emptyBuckets();
  let totalSpend = 0, totalReach = 0, totalImpr = 0;
  for (const c of campaigns) {
    if (c.error) continue;
    const b = buckets[c.category] || buckets['Otros'];
    b.spend += c.spend;
    b.reach += c.reach;
    b.impressions += c.impressions;
    b.campaigns += 1;
    totalSpend += c.spend;
    totalReach += c.reach;
    totalImpr += c.impressions;
  }
  for (const cat of Object.keys(buckets)) {
    const b = buckets[cat];
    b.frequency = computeFrequency(b.reach, b.impressions);
    b.pct = totalSpend > 0 ? (b.spend / totalSpend) * 100 : 0;
  }
  return {
    buckets,
    totals: { spend: totalSpend, reach: totalReach, impressions: totalImpr, frequency: computeFrequency(totalReach, totalImpr) },
  };
}

// Vista principal: resumen por cliente.
export async function computeSaturation({ clients, from, to }) {
  const results = await Promise.all(
    (clients || []).map(async (c) => {
      const accs = (c.meta_ad_accounts || []).filter(Boolean);
      if (!accs.length) {
        return { slug: c.slug, name: c.name, currency: null, no_account: true, buckets: emptyBuckets(), totals: { spend: 0, reach: 0, impressions: 0, frequency: 0 } };
      }
      try {
        const { currency, campaigns } = await fetchClientCampaigns({ metaAccounts: accs, from, to });
        const agg = aggregateByCategory(campaigns);
        return {
          slug: c.slug,
          name: c.name,
          currency,
          meta_ad_accounts: accs,
          buckets: agg.buckets,
          totals: agg.totals,
          campaigns_count: campaigns.filter((x) => !x.error).length,
        };
      } catch (e) {
        return { slug: c.slug, name: c.name, currency: null, error: e.message, buckets: emptyBuckets(), totals: { spend: 0, reach: 0, impressions: 0, frequency: 0 } };
      }
    }),
  );

  // Totales globales (suma de clientes)
  const globalBuckets = emptyBuckets();
  const globalTotals = { spend: 0, reach: 0, impressions: 0 };
  for (const c of results) {
    if (c.error || c.no_account) continue;
    for (const cat of Object.keys(c.buckets)) {
      globalBuckets[cat].spend += c.buckets[cat].spend;
      globalBuckets[cat].reach += c.buckets[cat].reach;
      globalBuckets[cat].impressions += c.buckets[cat].impressions;
      globalBuckets[cat].campaigns += c.buckets[cat].campaigns;
    }
    globalTotals.spend += c.totals.spend;
    globalTotals.reach += c.totals.reach;
    globalTotals.impressions += c.totals.impressions;
  }
  for (const cat of Object.keys(globalBuckets)) {
    const b = globalBuckets[cat];
    b.frequency = computeFrequency(b.reach, b.impressions);
    b.pct = globalTotals.spend > 0 ? (b.spend / globalTotals.spend) * 100 : 0;
  }

  return {
    from, to,
    clients: results,
    global: {
      buckets: globalBuckets,
      totals: { ...globalTotals, frequency: computeFrequency(globalTotals.reach, globalTotals.impressions) },
    },
  };
}

// Vista detalle del cliente: todas las campañas con datos en el período, agrupadas por categoría.
export async function computeClientSaturation({ client, from, to }) {
  const accs = (client.meta_ad_accounts || []).filter(Boolean);
  if (!accs.length) {
    return { slug: client.slug, name: client.name, no_account: true, buckets: {}, totals: { spend: 0, reach: 0, impressions: 0, frequency: 0 } };
  }
  const { currency, campaigns } = await fetchClientCampaigns({ metaAccounts: accs, from, to });
  const campaignsClean = campaigns.filter((x) => !x.error);
  const agg = aggregateByCategory(campaignsClean);
  // Agregar % respecto al total del cliente en cada campaña
  for (const c of campaignsClean) {
    c.pct_client = agg.totals.spend > 0 ? (c.spend / agg.totals.spend) * 100 : 0;
  }
  // Agrupar por categoría con sus campañas ordenadas desc por spend
  const byCategory = {};
  for (const cat of [...CATEGORIES, 'Otros']) {
    const camps = campaignsClean.filter((c) => c.category === cat).sort((a, b) => b.spend - a.spend);
    byCategory[cat] = {
      ...agg.buckets[cat],
      campaigns: camps,
    };
  }
  return {
    slug: client.slug,
    name: client.name,
    currency,
    from, to,
    buckets: byCategory,
    totals: agg.totals,
    errors: campaigns.filter((x) => x.error),
  };
}
