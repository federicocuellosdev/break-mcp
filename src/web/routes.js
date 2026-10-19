import express, { Router } from 'express';
import {
  verifyCredentials,
  getUserById,
  listAllUsers,
  createUser,
  updateUser,
  deleteUser,
  regenerateUserToken,
  regenerateUserPassword,
  isDev,
  isAdminOrDev,
  allowedClientSlugs,
} from '../users.js';
import { listMccChildren } from '../providers/gads.js';
import { listAccountSummaries, recentActivity } from '../providers/ga4.js';
import {
  listClients,
  getClient,
  createClientRecord,
  updateClientRecord,
  updateClientAccounts,
  updateClientBudget,
  updateClientPlatformActive,
  updateClientKommo,
  updateClientSheet,
  removeClientSheet,
  deleteClientRecord,
} from '../clients.js';
import { google } from 'googleapis';
import { runKommoFormRebuilderOnce, cleanupWhatsAppNotes } from '../services/kommo-form-rebuilder.js';
import { setSessionCookie, clearSessionCookie, readSessionCookie } from './session.js';
import { renderLogin } from './pages/login.js';
import {
  renderDashboard,
  renderInvestment,
  renderUsersView,
  renderUserEditView,
  renderUserNewView,
  renderClientsView,
  renderClientEditView,
  renderClientForm,
  renderConfigView,
  renderLogsView,
} from './pages/admin.js';
import { generateUserMd } from '../mdConfig.js';
import { listLogs, deleteLog, logsStorageInfo } from '../logs.js';
import { listAlertsForUser, createAlert, dismissAlert } from '../alerts.js';

const TOOLS_COUNT = 28;

function maskToken(tok) {
  if (!tok) return '';
  const s = String(tok);
  if (s.length <= 14) return s;
  return s.slice(0, 10) + '...' + s.slice(-4);
}

function mcpUrlFrom(req) {
  if (process.env.MCP_URL) return process.env.MCP_URL.replace(/\/+$/, '') + '/mcp';
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}/mcp`;
}

function currentUser(req) {
  if (process.env.DEV_AUTOLOGIN) {
    const u = getUserById(process.env.DEV_AUTOLOGIN);
    if (u) return u;
  }
  const s = readSessionCookie(req);
  if (!s) return null;
  return getUserById(s.userId);
}

function flashFromQuery(req) {
  const { ok, err } = req.query;
  if (ok) return { type: 'ok', text: String(ok) };
  if (err) return { type: 'err', text: String(err) };
  return null;
}

function redirWithFlash(res, path, kind, text) {
  const q = new URLSearchParams({ [kind]: text }).toString();
  res.redirect(`${path}?${q}`);
}

export function createWebRouter() {
  const router = Router();

  router.use(express.urlencoded({ extended: false }));

  router.use((req, res, next) => {
    res.locals.user = currentUser(req);
    next();
  });

  router.get('/', (req, res) => {
    if (res.locals.user) return res.redirect('/admin');
    res.redirect('/login');
  });

  router.get('/login', (req, res) => {
    if (res.locals.user) return res.redirect('/admin');
    res.set('Content-Type', 'text/html; charset=utf-8').send(renderLogin({ next: req.query.next }));
  });

  router.post('/login', async (req, res) => {
    const { id, password, next } = req.body || {};
    if (!id || !password) {
      return res
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(renderLogin({ error: 'Faltan datos.' }));
    }
    const user = await verifyCredentials(id, password);
    if (!user) {
      return res
        .set('Content-Type', 'text/html; charset=utf-8')
        .status(401)
        .send(renderLogin({ error: 'Usuario o contraseña incorrectos.' }));
    }
    setSessionCookie(res, user.id);
    res.redirect(typeof next === 'string' && next.startsWith('/') ? next : '/admin');
  });

  router.post('/logout', (req, res) => {
    clearSessionCookie(res);
    res.redirect('/login');
  });

  const requireLogin = (req, res, next) => {
    if (!res.locals.user) {
      const back = encodeURIComponent(req.originalUrl);
      return res.redirect(`/login?next=${back}`);
    }
    next();
  };

  const requireAdmin = (req, res, next) => {
    if (!isAdminOrDev(res.locals.user)) return res.status(403).send('Forbidden');
    next();
  };

  const requireDev = (req, res, next) => {
    if (!isDev(res.locals.user)) return res.status(403).send('Forbidden');
    next();
  };

  router.get('/admin', requireLogin, (req, res) => {
    const user = res.locals.user;
    const clients = listClients();
    const stats = {
      users: listAllUsers().length,
      clients: clients.length,
      tools: TOOLS_COUNT,
      role: user.role,
      myClients: null,
    };
    res.set('Content-Type', 'text/html; charset=utf-8').send(renderDashboard({ user, stats }));
  });

  // -------- USERS --------
  router.get('/admin/users', requireLogin, requireAdmin, (req, res) => {
    const user = res.locals.user;
    const users = listAllUsers();
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderUsersView({
          user,
          users,
          flash: flashFromQuery(req),
        }),
      );
  });

  router.get('/admin/users/new', requireLogin, requireAdmin, (req, res) => {
    res.redirect('/admin/users');
  });

  router.post('/admin/users', requireLogin, requireAdmin, async (req, res) => {
    const { id, name, email, role, password } = req.body || {};
    const clients = Array.isArray(req.body?.clients)
      ? req.body.clients
      : req.body?.clients
      ? [req.body.clients]
      : [];
    try {
      const created = await createUser(
        { id, name, email, role, password, clients },
        { actor: res.locals.user },
      );
      const q = new URLSearchParams({
        ok: `Usuario "${created.id}" creado. Copiá la contraseña y compartísela.`,
        pw: created._plain_password || '',
      }).toString();
      res.redirect(`/admin/users/${created.id}/edit?${q}`);
    } catch (e) {
      redirWithFlash(res, '/admin/users', 'err', e.message);
    }
  });

  router.get('/admin/users/:id/edit', requireLogin, requireAdmin, (req, res) => {
    const target = getUserById(req.params.id);
    if (!target) return res.status(404).send('Not found');
    const initialPassword = typeof req.query.pw === 'string' && req.query.pw ? req.query.pw : null;
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderUserEditView({
          user: res.locals.user,
          target,
          flash: flashFromQuery(req),
          initialPassword,
        }),
      );
  });

  router.post('/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
    const { name, email, role, password } = req.body || {};
    const clientsIn = Array.isArray(req.body?.clients)
      ? req.body.clients
      : req.body?.clients !== undefined
      ? [req.body.clients]
      : undefined;
    try {
      await updateUser(
        req.params.id,
        { name, email, role, password, ...(clientsIn !== undefined ? { clients: clientsIn } : {}) },
        { actor: res.locals.user },
      );
      redirWithFlash(res, `/admin/users/${req.params.id}/edit`, 'ok', 'Cambios guardados.');
    } catch (e) {
      redirWithFlash(res, `/admin/users/${req.params.id}/edit`, 'err', e.message);
    }
  });

  router.post('/admin/users/:id/delete', requireLogin, requireAdmin, (req, res) => {
    const id = req.params.id;
    if (id === res.locals.user.id) {
      return redirWithFlash(res, '/admin/users', 'err', 'No podés eliminarte a vos mismo.');
    }
    try {
      deleteUser(id);
      redirWithFlash(res, '/admin/users', 'ok', `Usuario "${id}" eliminado.`);
    } catch (e) {
      redirWithFlash(res, '/admin/users', 'err', e.message);
    }
  });

  router.post('/admin/users/:id/active', requireLogin, requireAdmin, async (req, res) => {
    const active = req.body.active === 'true' || req.body.active === 'on' || req.body.active === '1';
    try {
      await updateUser(req.params.id, { active });
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ ok: true, active });
      }
      redirWithFlash(res, '/admin/users', 'ok', `Usuario "${req.params.id}" ${active ? 'activado' : 'desactivado'}.`);
    } catch (e) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ error: e.message });
      }
      redirWithFlash(res, '/admin/users', 'err', e.message);
    }
  });

  // Live account lists from each platform (used by the CLIENT edit page)
  router.get('/admin/api/meta-accounts', requireLogin, requireAdmin, async (_req, res) => {
    try {
      const bmId = process.env.META_BUSINESS_ID;
      const token = process.env.META_ACCESS_TOKEN;
      if (!bmId || !token) {
        return res.json({ accounts: [], notice: 'Meta no configurado (falta META_BUSINESS_ID o META_ACCESS_TOKEN).' });
      }
      const ver = process.env.META_GRAPH_VERSION || 'v21.0';
      const fields = 'id,account_id,name,currency,account_status';
      const [owned, client] = await Promise.all([
        fetch(`https://graph.facebook.com/${ver}/${bmId}/owned_ad_accounts?fields=${fields}&limit=200&access_token=${token}`).then((r) => r.json()),
        fetch(`https://graph.facebook.com/${ver}/${bmId}/client_ad_accounts?fields=${fields}&limit=200&access_token=${token}`).then((r) => r.json()),
      ]);
      if (owned.error) return res.status(400).json({ error: owned.error.message });
      if (client.error) return res.status(400).json({ error: client.error.message });
      const META_STATUS = {
        1: 'ENABLED',
        2: 'SUSPENDED',
        3: 'SUSPENDED',
        7: 'SUSPENDED',
        8: 'SUSPENDED',
        9: 'SUSPENDED',
        100: 'CANCELED',
        101: 'CLOSED',
        201: 'ENABLED',
        202: 'CLOSED',
      };
      const mapAcc = (kind) => (a) => ({
        id: a.id,
        name: a.name || `Account ${a.account_id}`,
        currency: a.currency,
        kind,
        status: META_STATUS[a.account_status] || null,
      });
      const accounts = [
        ...(owned.data || []).map(mapAcc('owned')),
        ...(client.data || []).map(mapAcc('client')),
      ];
      res.json({ accounts });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/admin/api/gads-accounts', requireLogin, requireAdmin, async (_req, res) => {
    try {
      const notReady =
        !process.env.GADS_DEVELOPER_TOKEN ||
        !process.env.GADS_CLIENT_ID ||
        !process.env.GADS_REFRESH_TOKEN ||
        !process.env.GADS_LOGIN_CUSTOMER_ID;
      if (notReady) {
        return res.json({ accounts: [], notice: 'Google Ads no configurado (faltan GADS_DEVELOPER_TOKEN / OAuth / LOGIN_CUSTOMER_ID).' });
      }
      const accounts = await listMccChildren();
      res.json({ accounts });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/admin/api/ga4-health', requireLogin, requireAdmin, async (req, res) => {
    const propertyId = String(req.query.property_id || '').replace(/^properties\//, '');
    if (!propertyId) return res.status(400).json({ error: 'property_id requerido' });
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return res.json({ status: 'unconfigured', sessions: 0, days: 3 });
    }
    try {
      const info = await recentActivity({ propertyId, days: 3 });
      const status = info.sessions > 0 ? 'ok' : 'stale';
      res.json({ status, ...info });
    } catch (e) {
      const msg = String(e.message || '');
      const isAuth = /PERMISSION_DENIED|403|not have sufficient permissions/i.test(msg);
      res.json({ status: isAuth ? 'no_access' : 'error', sessions: 0, days: 3, message: msg.slice(0, 200) });
    }
  });

  router.get('/admin/api/ga4-accounts', requireLogin, requireAdmin, async (_req, res) => {
    let serviceAccountEmail = null;
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        serviceAccountEmail = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email || null;
      }
    } catch {}
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return res.json({ accounts: [], service_account_email: null, notice: 'GA4 no configurado (falta GOOGLE_SERVICE_ACCOUNT_JSON).' });
      }
      const data = await listAccountSummaries();
      const accounts = (data.accountSummaries || []).flatMap((a) =>
        (a.propertySummaries || []).map((p) => ({
          id: (p.property || '').replace('properties/', ''),
          name: p.displayName || 'property',
          account: a.displayName || '',
        })),
      );
      res.json({ accounts, service_account_email: serviceAccountEmail });
    } catch (e) {
      res.status(500).json({ error: e.message, service_account_email: serviceAccountEmail });
    }
  });

  router.post('/admin/users/:id/regen-token', requireLogin, requireAdmin, (req, res) => {
    try {
      regenerateUserToken(req.params.id);
      redirWithFlash(
        res,
        `/admin/users/${req.params.id}/edit`,
        'ok',
        'Token regenerado. El usuario tiene que actualizar su config.',
      );
    } catch (e) {
      redirWithFlash(res, `/admin/users/${req.params.id}/edit`, 'err', e.message);
    }
  });

  router.post('/admin/users/:id/regen-password', requireLogin, requireAdmin, async (req, res) => {
    try {
      const plain = await regenerateUserPassword(req.params.id);
      res.json({ ok: true, password: plain });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // -------- CLIENTS --------
  // Panel: todos los clientes son visibles para analyst/admin/dev (varios ojos).
  // El filtro per-analyst solo aplica a tools MCP (en /src/tools/*).
  router.get('/admin/clients', requireLogin, (req, res) => {
    const user = res.locals.user;
    const clients = listClients();
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderClientsView({
          user,
          clients,
          allowedForUser: null,
          flash: flashFromQuery(req),
        }),
      );
  });

  router.get('/admin/clients/new', requireLogin, requireAdmin, (req, res) => {
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderClientForm({
          user: res.locals.user,
          mode: 'new',
          target: null,
          flash: flashFromQuery(req),
        }),
      );
  });

  router.get('/admin/api/clients/check', requireLogin, requireAdmin, (req, res) => {
    const raw = String(req.query.slug || '').toLowerCase().trim();
    const slug = raw.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) return res.json({ slug, exists: false, valid: false, reason: 'slug vacío' });
    try {
      const existing = getClient(slug);
      return res.json({ slug, exists: true, valid: true, name: existing.name });
    } catch {
      return res.json({ slug, exists: false, valid: true });
    }
  });

  router.post('/admin/clients', requireLogin, requireAdmin, (req, res) => {
    const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
    const { slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id } = req.body || {};
    try {
      const created = createClientRecord({
        slug,
        name,
        meta_ad_account_id,
        gads_customer_id,
        ga4_property_id,
      });
      if (wantsJson) return res.json({ ok: true, slug: created.slug, name: created.name });
      redirWithFlash(res, '/admin/clients', 'ok', `Cliente "${created.slug}" creado.`);
    } catch (e) {
      if (wantsJson) return res.status(400).json({ ok: false, error: e.message });
      res
        .status(400)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(
          renderClientForm({
            user: res.locals.user,
            mode: 'new',
            target: { slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id },
            flash: { type: 'err', text: e.message },
          }),
        );
    }
  });

  router.get('/admin/clients/:slug/edit', requireLogin, requireAdmin, (req, res) => {
    let target;
    try {
      target = getClient(req.params.slug);
    } catch {
      return res.status(404).send('Not found');
    }
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .set('Cache-Control', 'no-store')
      .send(
        renderClientEditView({
          user: res.locals.user,
          target: { slug: req.params.slug, ...target },
          flash: flashFromQuery(req),
        }),
      );
  });

  router.post('/admin/clients/:slug', requireLogin, requireAdmin, (req, res) => {
    try {
      updateClientRecord(req.params.slug, req.body || {});
      redirWithFlash(res, `/admin/clients/${req.params.slug}/edit`, 'ok', 'Cambios guardados.');
    } catch (e) {
      redirWithFlash(res, `/admin/clients/${req.params.slug}/edit`, 'err', e.message);
    }
  });

  router.post('/admin/clients/:slug/accounts', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { platform, ids } = req.body || {};
    try {
      const saved = updateClientAccounts(req.params.slug, platform, ids || []);
      res.json({ ok: true, accounts: saved });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/platform-active', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { platform, active } = req.body || {};
    try {
      const saved = updateClientPlatformActive(req.params.slug, platform, active);
      res.json({ ok: true, platforms_active: saved });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/kommo', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { subdomain, token } = req.body || {};
    try {
      const saved = updateClientKommo(req.params.slug, { subdomain, token });
      res.json({
        ok: true,
        kommo: saved
          ? { subdomain: saved.subdomain, token_exp: saved.token_exp, token_mask: maskToken(saved.token) }
          : null,
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // ----- GOOGLE SHEETS -----
  function parseSpreadsheetId(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : raw;
  }

  function sheetsClient() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurado');
    let creds;
    try { creds = JSON.parse(raw); } catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido'); }
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return { api: google.sheets({ version: 'v4', auth }), serviceAccountEmail: creds.client_email };
  }

  router.get('/admin/api/sheets-metadata', requireLogin, requireAdmin, async (req, res) => {
    let serviceAccountEmail = null;
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        serviceAccountEmail = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email || null;
      }
    } catch {}
    const spreadsheetId = parseSpreadsheetId(req.query.spreadsheet_id);
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheet_id requerido', service_account_email: serviceAccountEmail });
    }
    try {
      const { api } = sheetsClient();
      const { data } = await api.spreadsheets.get({
        spreadsheetId,
        fields: 'spreadsheetId,properties.title,sheets(properties(sheetId,title,index))',
      });
      const tabs = (data.sheets || [])
        .map((s) => ({ id: s.properties?.sheetId, title: s.properties?.title, index: s.properties?.index }))
        .sort((a, b) => (a.index || 0) - (b.index || 0));
      res.json({
        spreadsheet_id: data.spreadsheetId,
        title: data.properties?.title || '',
        tabs,
        service_account_email: serviceAccountEmail,
      });
    } catch (e) {
      const msg = String(e.message || '');
      const status = /PERMISSION_DENIED|403|does not have access/i.test(msg)
        ? 'no_access'
        : /NOT_FOUND|404|not found/i.test(msg)
        ? 'not_found'
        : 'error';
      res.status(400).json({ error: msg.slice(0, 300), status, service_account_email: serviceAccountEmail });
    }
  });

  router.post('/admin/clients/:slug/sheets', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { alias, spreadsheet_id, spreadsheet_title, sheet_name, old_alias } = req.body || {};
    try {
      const saved = updateClientSheet(req.params.slug, {
        alias,
        spreadsheet_id: parseSpreadsheetId(spreadsheet_id),
        spreadsheet_title,
        sheet_name,
        old_alias,
      });
      res.json({ ok: true, sheet: saved });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/sheets/:alias/delete', requireLogin, requireAdmin, express.json(), (req, res) => {
    try {
      removeClientSheet(req.params.slug, req.params.alias);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Dispara el rebuilder de leads Kommo (natives FB → formato FORM) en el acto.
  // Útil para no esperar al tick (3 min).
  router.post('/admin/api/kommo-rebuilder/run', requireLogin, requireAdmin, async (_req, res) => {
    try {
      const r = await runKommoFormRebuilderOnce();
      res.json(r);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/admin/api/kommo-cleanup-wa-notes', requireLogin, requireAdmin, async (_req, res) => {
    try {
      const r = await cleanupWhatsAppNotes();
      res.json({ ok: true, ...r });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy dev-only para llamadas directas a la API de Kommo de un cliente
  // (usa el token almacenado en clients.json). Útil para operaciones one-shot
  // que no tienen endpoint dedicado (crear pipeline, etc.).
  // Body: { client, method, path, body?, params? }
  router.post('/admin/api/kommo-proxy', requireLogin, requireDev, express.json({ limit: '1mb' }), async (req, res) => {
    const { client, method = 'GET', path, body, params = {} } = req.body || {};
    if (!client || !path) return res.status(400).json({ error: 'client y path son obligatorios' });
    try {
      const c = getClient(client);
      const k = c.kommo || {};
      if (!k.subdomain || !k.token) return res.status(400).json({ error: `cliente "${client}" sin Kommo configurado` });
      const url = new URL(`https://${k.subdomain}.kommo.com${path}`);
      for (const [kk, vv] of Object.entries(params)) {
        if (vv === undefined || vv === null) continue;
        url.searchParams.set(kk, String(vv));
      }
      const opts = {
        method,
        headers: { Authorization: `Bearer ${k.token}`, Accept: 'application/json' },
      };
      if (body != null) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      const r = await fetch(url, opts);
      const text = await r.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      res.status(r.status).json({ ok: r.ok, status: r.status, data });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/budget', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { platform, amount, alert_pct } = req.body || {};
    const patch = {};
    if (amount !== undefined) patch.amount = amount;
    if (alert_pct !== undefined) patch.alert_pct = alert_pct;
    try {
      const saved = updateClientBudget(req.params.slug, platform, patch);
      res.json({ ok: true, budgets: saved });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  const billingCache = { ts: 0, data: null, inflight: null };
  router.get('/admin/api/billing-summary', requireLogin, async (req, res) => {
    const now = Date.now();
    const TTL = 15 * 60 * 1000;
    const force = req.query.refresh === '1';
    if (!force && billingCache.data && now - billingCache.ts < TTL) {
      return res.json({ ...billingCache.data, cached: true, age_ms: now - billingCache.ts });
    }
    if (billingCache.inflight) {
      try {
        const data = await billingCache.inflight;
        return res.json({ ...data, cached: false });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    billingCache.inflight = (async () => {
      const { checkBillingSummary } = await import('../tools/billing.js');
      return checkBillingSummary();
    })();
    try {
      const data = await billingCache.inflight;
      billingCache.ts = Date.now();
      billingCache.data = data;
      res.json({ ...data, cached: false });
    } catch (e) {
      res.status(500).json({ error: e.message });
    } finally {
      billingCache.inflight = null;
    }
  });

  const dolarCache = { fecha: null, data: null };
  router.get('/admin/api/bcra-usd', requireLogin, async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    if (dolarCache.fecha === today && dolarCache.data) {
      return res.json({ ...dolarCache.data, cached: true });
    }
    try {
      const r = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (!r.ok) throw new Error('dolarapi ' + r.status);
      const data = await r.json();
      const compra = Number(data.compra);
      const venta = Number(data.venta);
      const promedio = (compra + venta) / 2;
      const payload = {
        fecha: data.fechaActualizacion || new Date().toISOString(),
        compra,
        venta,
        promedio,
      };
      dolarCache.fecha = today;
      dolarCache.data = payload;
      res.json({ ...payload, cached: false });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  router.get('/admin/investment', requireLogin, (req, res) => {
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(renderInvestment({ user: res.locals.user }));
  });

  router.get('/admin/api/investment', requireLogin, async (req, res) => {
    const from = String(req.query.from || '').slice(0, 10);
    const to = String(req.query.to || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({ error: 'Parámetros from/to inválidos (YYYY-MM-DD)' });
    }
    // Panel: analyst/admin/dev ven todos los activos (varios ojos). Demo excluido.
    const clients = listClients().filter((c) => c.active !== false && c.slug !== 'demo');
    try {
      const { computeInvestment } = await import('../investment.js');
      const data = await computeInvestment({ clients, from, to });
      res.json({ from, to, clients: data });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/active', requireLogin, requireAdmin, (req, res) => {
    const active = req.body.active === 'true' || req.body.active === 'on' || req.body.active === '1';
    try {
      updateClientRecord(req.params.slug, { active });
      redirWithFlash(res, '/admin/clients', 'ok', `Cliente "${req.params.slug}" ${active ? 'activado' : 'pausado'}.`);
    } catch (e) {
      redirWithFlash(res, '/admin/clients', 'err', e.message);
    }
  });

  router.post('/admin/clients/:slug/delete', requireLogin, requireAdmin, (req, res) => {
    try {
      deleteClientRecord(req.params.slug);
      redirWithFlash(res, '/admin/clients', 'ok', `Cliente "${req.params.slug}" eliminado.`);
    } catch (e) {
      redirWithFlash(res, '/admin/clients', 'err', e.message);
    }
  });

  // -------- LOGS (dev-only) --------
  router.get('/admin/logs', requireLogin, requireDev, (req, res) => {
    const logs = listLogs();
    const storage = logsStorageInfo();
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(renderLogsView({ user: res.locals.user, logs, storage, flash: flashFromQuery(req) }));
  });

  router.post('/admin/logs/:id/delete', requireLogin, requireDev, (req, res) => {
    try {
      deleteLog(req.params.id);
      redirWithFlash(res, '/admin/logs', 'ok', 'Log eliminado.');
    } catch (e) {
      redirWithFlash(res, '/admin/logs', 'err', e.message);
    }
  });

  // -------- ALERTAS DE USUARIO (persistidas, con dismiss) --------
  router.get('/admin/api/user-alerts', requireLogin, (req, res) => {
    const user = res.locals.user;
    try {
      const alerts = listAlertsForUser(user.id).map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        kind: a.kind || 'info',
        createdAt: a.createdAt,
      }));
      res.json({ alerts });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/admin/alerts/:id/dismiss', requireLogin, express.json(), (req, res) => {
    const user = res.locals.user;
    try {
      dismissAlert(req.params.id, user.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Dev-only: crear alertas para cualquier usuario (uso interno / scripts)
  router.post('/admin/api/user-alerts', requireLogin, requireDev, express.json(), (req, res) => {
    const { userId, title, body, kind } = req.body || {};
    try {
      const alert = createAlert({ userId, title, body, kind });
      res.json({ ok: true, alert });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // -------- CONFIG MD --------
  router.get('/admin/config', requireLogin, (req, res) => {
    const user = res.locals.user;
    const mcpUrl = mcpUrlFrom(req);
    const md = generateUserMd({ user, mcpUrl });
    res.set('Content-Type', 'text/html; charset=utf-8').send(renderConfigView({ user, md, mcpUrl }));
  });

  router.get('/admin/config.md', requireLogin, (req, res) => {
    const user = res.locals.user;
    const md = generateUserMd({ user, mcpUrl: mcpUrlFrom(req) });
    res
      .set('Content-Type', 'text/markdown; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="break-mcp-${user.id}.md"`)
      .send(md);
  });

  router.get('/admin/config.json', requireLogin, (req, res) => {
    const user = res.locals.user;
    const mcpUrl = mcpUrlFrom(req);
    const snippet = {
      mcpServers: {
        'break-mcp': {
          type: 'http',
          url: mcpUrl,
          headers: { Authorization: `Bearer ${user.token}` },
        },
      },
    };
    res
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="break-mcp-${user.id}.json"`)
      .send(JSON.stringify(snippet, null, 2));
  });

  return router;
}
