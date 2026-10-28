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

// KPI clave por objetivo. "action_type" matchea los valores del campo actions de Meta;
// "derived" usa una métrica directa (reach/impressions). Si action_type es un array,
// se suman todos los matches (para capturar múltiples variantes del evento).
const KPI_BY_OBJECTIVE = {
  LEAD_GENERATION: { label: 'Clientes potenciales', action_type: ['lead'] },
  OUTCOME_LEADS: { label: 'Clientes potenciales', action_type: ['lead', 'onsite_conversion.lead_grouped'] },
  CONVERSIONS: { label: 'Conversiones', action_type: ['offsite_conversion.fb_pixel_purchase', 'offsite_conversion.fb_pixel_complete_registration', 'onsite_conversion.purchase'] },
  OUTCOME_SALES: { label: 'Compras', action_type: ['purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_conversion.purchase'] },
  CATALOG_SALES: { label: 'Compras', action_type: ['purchase'] },
  PRODUCT_CATALOG_SALES: { label: 'Compras', action_type: ['purchase'] },
  STORE_VISITS: { label: 'Visitas tienda', action_type: ['store_visit'] },
  OUTCOME_STORE_VISITS: { label: 'Visitas tienda', action_type: ['store_visit'] },
  MESSAGES: { label: 'Mensajes', action_type: ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection'] },
  TRAFFIC: { label: 'Clics al enlace', action_type: ['link_click'] },
  OUTCOME_TRAFFIC: { label: 'Clics al enlace', action_type: ['link_click'] },
  LINK_CLICKS: { label: 'Clics al enlace', action_type: ['link_click'] },
  REACH: { label: 'Alcance', derived: 'reach' },
  OUTCOME_AWARENESS: { label: 'Alcance', derived: 'reach' },
  BRAND_AWARENESS: { label: 'Alcance', derived: 'reach' },
  VIDEO_VIEWS: { label: 'Reproducciones', action_type: ['video_view'] },
  ENGAGEMENT: { label: 'Interacciones', action_type: ['post_engagement'] },
  POST_ENGAGEMENT: { label: 'Interacciones', action_type: ['post_engagement'] },
  OUTCOME_ENGAGEMENT: { label: 'Interacciones', action_type: ['post_engagement'] },
  PAGE_LIKES: { label: 'Likes', action_type: ['like'] },
  APP_INSTALLS: { label: 'Instalaciones', action_type: ['app_install', 'mobile_app_install'] },
  OUTCOME_APP_PROMOTION: { label: 'Instalaciones', action_type: ['app_install', 'mobile_app_install'] },
  EVENT_RESPONSES: { label: 'Respuestas', action_type: ['rsvp'] },
};

function computeKpi({ objective, actions, reach, impressions, spend }) {
  const kpiDef = KPI_BY_OBJECTIVE[String(objective || '').toUpperCase()];
  if (!kpiDef) return { label: null, value: null, cost: null };
  if (kpiDef.derived === 'reach') {
    const value = reach;
    return { label: kpiDef.label, value, cost: value > 0 ? spend / value * 1000 : null, cost_label: 'CPM' };
  }
  if (kpiDef.derived === 'impressions') {
    const value = impressions;
    return { label: kpiDef.label, value, cost: value > 0 ? spend / value * 1000 : null, cost_label: 'CPM' };
  }
  const types = kpiDef.action_type || [];
  let value = 0;
  for (const a of actions || []) {
    if (types.includes(a.action_type)) value += Number(a.value || 0);
  }
  return { label: kpiDef.label, value, cost: value > 0 ? spend / value : null, cost_label: 'Costo / ' + kpiDef.label.toLowerCase() };
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

// Heurística de "Entrega" (status + rendimiento) a partir de los campos de Meta.
// Para campañas: solo contamos con effective_status + issues_info. Rendimiento se infiere
// de la presencia de issues (LEARNING_LIMITED, policy, etc.).
// Para anuncios: incluimos los rankings (quality / engagement / conversion rate).
function computeDelivery({ effectiveStatus, issuesInfo, hasSpend, qualityRanking, engagementRanking, conversionRanking }) {
  const status = String(effectiveStatus || '').toUpperCase();
  const issues = Array.isArray(issuesInfo) ? issuesInfo : [];
  const issueTypes = issues.map((i) => String(i.level || i.error_message || i.error_code || '').toUpperCase());

  // STATUS
  let statusKey = 'unknown';
  let statusLabel = '—';
  if (status === 'ACTIVE') { statusKey = 'active'; statusLabel = 'Activa'; }
  else if (status === 'IN_PROCESS') { statusKey = 'process'; statusLabel = 'En proceso'; }
  else if (status === 'WITH_ISSUES') { statusKey = 'issues'; statusLabel = 'Con problemas'; }
  else if (status === 'PAUSED' || status === 'CAMPAIGN_PAUSED' || status === 'ADSET_PAUSED' || status === 'DISAPPROVED') { statusKey = 'paused'; statusLabel = 'Pausada'; }
  else if (status === 'DELETED' || status === 'ARCHIVED') { statusKey = 'archived'; statusLabel = 'Archivada'; }
  else if (status) { statusKey = 'other'; statusLabel = status.replace(/_/g, ' ').toLowerCase(); statusLabel = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1); }

  // PERFORMANCE
  const rankings = [qualityRanking, engagementRanking, conversionRanking]
    .filter((r) => r && r !== 'UNKNOWN')
    .map((r) => String(r).toLowerCase());

  let perfKey = null;
  let perfLabel = null;

  if (statusKey === 'active') {
    const hasAboveAverage = rankings.some((r) => r.includes('above_average'));
    const hasBelowAverage = rankings.some((r) => r.includes('below_average'));
    const hasLearningLimited = issueTypes.some((t) => t.includes('LEARNING') && t.includes('LIMITED'));
    const hasCriticalIssue = issues.length > 0 && !hasLearningLimited;

    if (hasBelowAverage) { perfKey = 'low'; perfLabel = 'Rendimiento bajo'; }
    else if (hasLearningLimited) { perfKey = 'limited'; perfLabel = 'Rendimiento limitado'; }
    else if (hasAboveAverage) { perfKey = 'high'; perfLabel = 'Rendimiento alto'; }
    else if (rankings.length > 0) { perfKey = 'normal'; perfLabel = 'Rendimiento normal'; }
    else if (hasCriticalIssue) { perfKey = 'issue'; perfLabel = 'Con observaciones'; }
    else if (hasSpend) { perfKey = 'high'; perfLabel = 'Rendimiento alto'; }
    // else: sin señales suficientes → no mostramos pill
  }

  return { status: statusKey, status_label: statusLabel, performance: perfKey, performance_label: perfLabel };
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
        fields: 'campaign_id,campaign_name,objective,spend,reach,impressions,actions,account_currency',
        time_range: { since: from, until: to },
        limit: 500,
      });

      // 2da call: metadata de campañas (effective_status + issues_info) para construir "Entrega"
      const statusByCampaign = new Map();
      try {
        const meta = await metaGet(`/${acc}/campaigns`, {
          fields: 'id,effective_status,issues_info',
          limit: 500,
        });
        for (const c of meta.data || []) {
          statusByCampaign.set(String(c.id), {
            effective_status: c.effective_status || null,
            issues_info: c.issues_info || [],
          });
        }
      } catch { /* opcional */ }

      for (const row of j.data || []) {
        if (row.account_currency && !currency) currency = row.account_currency;
        const spend = Number(row.spend || 0);
        const reach = Number(row.reach || 0);
        const impressions = Number(row.impressions || 0);
        if (spend === 0 && impressions === 0) continue; // sin datos en el período
        const category = classifyObjective(row.objective);
        const actions = Array.isArray(row.actions) ? row.actions : [];
        const kpi = computeKpi({ objective: row.objective, actions, reach, impressions, spend });
        const meta = statusByCampaign.get(String(row.campaign_id)) || {};
        const delivery = computeDelivery({
          effectiveStatus: meta.effective_status,
          issuesInfo: meta.issues_info,
          hasSpend: spend > 0,
        });
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
          kpi_label: kpi.label,
          kpi_value: kpi.value,
          kpi_cost: kpi.cost,
          kpi_cost_label: kpi.cost_label || null,
          delivery_status: delivery.status,
          delivery_status_label: delivery.status_label,
          performance: delivery.performance,
          performance_label: delivery.performance_label,
          effective_status: meta.effective_status || null,
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

// Detalle de anuncios de una campaña: imágenes/videos + ad set + KPI por anuncio.
// Hace 2 llamadas a Meta Graph:
//   1) GET /{account_id}/insights?level=ad&filtering=[campaign.id=X]  → métricas por ad
//   2) GET /{campaign_id}/ads?fields=...creative{...}                → creatives
export async function computeCampaignAds({ metaAccount, campaignId, campaignObjective, from, to }) {
  const acc = metaAccount;
  if (!acc) throw new Error('metaAccount es obligatorio');
  if (!campaignId) throw new Error('campaignId es obligatorio');

  // 1) Insights a nivel ad filtrados por campaña (incluye rankings de calidad)
  const insightsResp = await metaGet(`/${acc}/insights`, {
    level: 'ad',
    fields: 'ad_id,ad_name,adset_id,adset_name,spend,reach,impressions,actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking',
    filtering: [{ field: 'campaign.id', operator: 'EQUAL', value: String(campaignId) }],
    time_range: { since: from, until: to },
    limit: 200,
  });
  const byAdId = new Map();
  for (const row of insightsResp.data || []) {
    const spend = Number(row.spend || 0);
    const reach = Number(row.reach || 0);
    const impressions = Number(row.impressions || 0);
    const kpi = computeKpi({ objective: campaignObjective, actions: row.actions || [], reach, impressions, spend });
    byAdId.set(String(row.ad_id), {
      ad_id: row.ad_id,
      ad_name: row.ad_name || '',
      adset_id: row.adset_id || null,
      adset_name: row.adset_name || '',
      spend,
      reach,
      impressions,
      frequency: reach > 0 ? impressions / reach : 0,
      kpi_label: kpi.label,
      kpi_value: kpi.value,
      kpi_cost: kpi.cost,
      quality_ranking: row.quality_ranking || null,
      engagement_rate_ranking: row.engagement_rate_ranking || null,
      conversion_rate_ranking: row.conversion_rate_ranking || null,
    });
  }

  // 2) Ads con sus creatives + effective_status + issues_info
  const adsResp = await metaGet(`/${campaignId}/ads`, {
    fields: 'id,name,adset_id,status,effective_status,issues_info,creative{id,image_url,thumbnail_url,video_id,object_story_spec,asset_feed_spec,effective_object_story_id,instagram_permalink_url}',
    limit: 200,
  });

  const results = [];
  for (const ad of adsResp.data || []) {
    const metrics = byAdId.get(String(ad.id)) || null;
    if (!metrics) continue; // sin datos en el período
    // Extraer media del creative
    const cr = ad.creative || {};
    let image_url = cr.image_url || cr.thumbnail_url || null;
    let video_id = cr.video_id || null;
    const spec = cr.object_story_spec || {};
    if (!image_url && spec.link_data && spec.link_data.picture) image_url = spec.link_data.picture;
    if (!image_url && spec.video_data && spec.video_data.image_url) image_url = spec.video_data.image_url;
    if (!video_id && spec.video_data && spec.video_data.video_id) video_id = spec.video_data.video_id;
    const feed = cr.asset_feed_spec || {};
    if (!image_url && Array.isArray(feed.images) && feed.images[0] && feed.images[0].url) image_url = feed.images[0].url;
    if (!video_id && Array.isArray(feed.videos) && feed.videos[0] && feed.videos[0].video_id) video_id = feed.videos[0].video_id;

    const delivery = computeDelivery({
      effectiveStatus: ad.effective_status || ad.status,
      issuesInfo: ad.issues_info || [],
      hasSpend: (metrics.spend || 0) > 0,
      qualityRanking: metrics.quality_ranking,
      engagementRanking: metrics.engagement_rate_ranking,
      conversionRanking: metrics.conversion_rate_ranking,
    });
    results.push({
      ad_id: ad.id,
      ad_name: ad.name || metrics.ad_name,
      adset_name: metrics.adset_name || '',
      status: ad.effective_status || ad.status || null,
      image_url,
      video_id,
      instagram_permalink_url: cr.instagram_permalink_url || null,
      spend: metrics.spend,
      reach: metrics.reach,
      impressions: metrics.impressions,
      frequency: metrics.frequency,
      kpi_label: metrics.kpi_label,
      kpi_value: metrics.kpi_value,
      kpi_cost: metrics.kpi_cost,
      delivery_status: delivery.status,
      delivery_status_label: delivery.status_label,
      performance: delivery.performance,
      performance_label: delivery.performance_label,
      quality_ranking: metrics.quality_ranking,
      engagement_rate_ranking: metrics.engagement_rate_ranking,
      conversion_rate_ranking: metrics.conversion_rate_ranking,
    });
  }

  // Agregar los que están en insights pero no en /ads (dark ads)
  for (const [adId, m] of byAdId.entries()) {
    if (results.some((r) => String(r.ad_id) === adId)) continue;
    const delivery = computeDelivery({
      hasSpend: (m.spend || 0) > 0,
      qualityRanking: m.quality_ranking,
      engagementRanking: m.engagement_rate_ranking,
      conversionRanking: m.conversion_rate_ranking,
    });
    results.push({
      ad_id: adId,
      ad_name: m.ad_name,
      adset_name: m.adset_name,
      status: null,
      image_url: null,
      video_id: null,
      instagram_permalink_url: null,
      spend: m.spend,
      reach: m.reach,
      impressions: m.impressions,
      frequency: m.frequency,
      kpi_label: m.kpi_label,
      kpi_value: m.kpi_value,
      kpi_cost: m.kpi_cost,
      delivery_status: delivery.status,
      delivery_status_label: delivery.status_label,
      performance: delivery.performance,
      performance_label: delivery.performance_label,
      quality_ranking: m.quality_ranking,
      engagement_rate_ranking: m.engagement_rate_ranking,
      conversion_rate_ranking: m.conversion_rate_ranking,
    });
  }

  results.sort((a, b) => b.spend - a.spend);
  return { campaign_id: campaignId, ads: results };
}

// Vista detalle del cliente: todas las campañas con datos en el período, agrupadas por categoría.
export async function computeClientSaturation({ client, from, to }) {
  const accs = (client.meta_ad_accounts || []).filter(Boolean);
  const budgetEntry = client.budgets && client.budgets.meta ? client.budgets.meta : null;
  const budget = {
    amount: budgetEntry ? Number(budgetEntry.amount) || 0 : null,
    alert_pct: budgetEntry ? Number(budgetEntry.alert_pct) || 80 : 80,
  };

  if (!accs.length) {
    return { slug: client.slug, name: client.name, no_account: true, budget, meta_ad_accounts: [], buckets: {}, totals: { spend: 0, reach: 0, impressions: 0, frequency: 0 }, conversion_total: null };
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

  // KPI total de conversión: suma de kpi_value para campañas en categoría Conversión.
  // Si distintos tipos de KPI en la categoría (ej. leads + compras), devolver un desglose.
  const convCampaigns = campaignsClean.filter((c) => c.category === 'Conversión' && c.kpi_value != null);
  const conversionBreakdown = {};
  let conversionSpend = 0;
  for (const c of convCampaigns) {
    const key = c.kpi_label || '—';
    if (!conversionBreakdown[key]) conversionBreakdown[key] = { label: key, value: 0, spend: 0, campaigns: 0 };
    conversionBreakdown[key].value += c.kpi_value || 0;
    conversionBreakdown[key].spend += c.spend || 0;
    conversionBreakdown[key].campaigns += 1;
    conversionSpend += c.spend || 0;
  }
  const conversionList = Object.values(conversionBreakdown).map((b) => ({
    ...b,
    cost: b.value > 0 ? b.spend / b.value : null,
  }));

  return {
    slug: client.slug,
    name: client.name,
    currency,
    from, to,
    budget,
    meta_ad_accounts: accs,
    buckets: byCategory,
    totals: agg.totals,
    conversion: {
      total_value: conversionList.reduce((a, b) => a + b.value, 0),
      total_spend: conversionSpend,
      breakdown: conversionList,
    },
    errors: campaigns.filter((x) => x.error),
  };
}
