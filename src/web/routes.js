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
import { listAccountSummaries } from '../providers/ga4.js';
import {
  listClients,
  getClient,
  createClientRecord,
  updateClientRecord,
  updateClientAccounts,
  updateClientBudget,
  deleteClientRecord,
} from '../clients.js';
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
import { listLogs, deleteLog } from '../logs.js';

const TOOLS_COUNT = 18;

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

  // analyst también puede editar/activar clientes (no crear ni borrar)
  const requireClientManager = (req, res, next) => {
    const r = res.locals.user?.role;
    if (r === 'admin' || r === 'dev' || r === 'analyst') return next();
    return res.status(403).send('Forbidden');
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

  router.get('/admin/api/ga4-accounts', requireLogin, requireAdmin, async (_req, res) => {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return res.json({ accounts: [], notice: 'GA4 no configurado (falta GOOGLE_SERVICE_ACCOUNT_JSON).' });
      }
      const data = await listAccountSummaries();
      const accounts = (data.accountSummaries || []).flatMap((a) =>
        (a.propertySummaries || []).map((p) => ({
          id: (p.property || '').replace('properties/', ''),
          name: p.displayName || 'property',
          account: a.displayName || '',
        })),
      );
      res.json({ accounts });
    } catch (e) {
      res.status(500).json({ error: e.message });
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

  router.post('/admin/clients', requireLogin, requireAdmin, (req, res) => {
    const { slug, name, meta_ad_account_id, gads_customer_id, ga4_property_id } = req.body || {};
    try {
      const created = createClientRecord({
        slug,
        name,
        meta_ad_account_id,
        gads_customer_id,
        ga4_property_id,
      });
      redirWithFlash(res, '/admin/clients', 'ok', `Cliente "${created.slug}" creado.`);
    } catch (e) {
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

  router.get('/admin/clients/:slug/edit', requireLogin, requireClientManager, (req, res) => {
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

  router.post('/admin/clients/:slug', requireLogin, requireClientManager, (req, res) => {
    try {
      updateClientRecord(req.params.slug, req.body || {});
      redirWithFlash(res, `/admin/clients/${req.params.slug}/edit`, 'ok', 'Cambios guardados.');
    } catch (e) {
      redirWithFlash(res, `/admin/clients/${req.params.slug}/edit`, 'err', e.message);
    }
  });

  router.post('/admin/clients/:slug/accounts', requireLogin, requireClientManager, express.json(), (req, res) => {
    const { platform, ids } = req.body || {};
    try {
      const saved = updateClientAccounts(req.params.slug, platform, ids || []);
      res.json({ ok: true, accounts: saved });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/budget', requireLogin, requireClientManager, express.json(), (req, res) => {
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
    // Panel: analyst/admin/dev ven todos los activos (varios ojos).
    const clients = listClients().filter((c) => c.active !== false);
    try {
      const { computeInvestment } = await import('../investment.js');
      const data = await computeInvestment({ clients, from, to });
      res.json({ from, to, clients: data });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/admin/clients/:slug/active', requireLogin, requireClientManager, (req, res) => {
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
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(renderLogsView({ user: res.locals.user, logs, flash: flashFromQuery(req) }));
  });

  router.post('/admin/logs/:id/delete', requireLogin, requireDev, (req, res) => {
    try {
      deleteLog(req.params.id);
      redirWithFlash(res, '/admin/logs', 'ok', 'Log eliminado.');
    } catch (e) {
      redirWithFlash(res, '/admin/logs', 'err', e.message);
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
