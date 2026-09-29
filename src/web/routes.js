import express, { Router } from 'express';
import {
  verifyCredentials,
  getUserById,
  listAllUsers,
  allowedClientSlugs,
  createUser,
  updateUser,
  updateUserAccounts,
  deleteUser,
  regenerateUserToken,
  regenerateUserPassword,
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
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      return res.status(403).send('Forbidden');
    }
    next();
  };

  router.get('/admin', requireLogin, (req, res) => {
    const user = res.locals.user;
    const clients = listClients();
    const allowed = allowedClientSlugs(user);
    const stats = {
      users: listAllUsers().length,
      clients: clients.length,
      tools: TOOLS_COUNT,
      role: user.role,
      myClients: allowed,
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
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(renderUserNewView({ user: res.locals.user, flash: flashFromQuery(req) }));
  });

  router.post('/admin/users', requireLogin, requireAdmin, async (req, res) => {
    const { id, name, email, role, clients, password } = req.body || {};
    try {
      const created = await createUser({ id, name, email, role, clients, password });
      const q = new URLSearchParams({
        ok: `Usuario "${created.id}" creado. Copiá la contraseña y compartísela.`,
        pw: created._plain_password || '',
      }).toString();
      res.redirect(`/admin/users/${created.id}/edit?${q}`);
    } catch (e) {
      res
        .status(400)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(renderUserNewView({ user: res.locals.user, flash: { type: 'err', text: e.message } }));
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
    const { name, email, role, clients, password } = req.body || {};
    try {
      await updateUser(req.params.id, { name, email, role, clients, password });
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

  router.post('/admin/users/:id/revoke-client/:slug', requireLogin, requireAdmin, async (req, res) => {
    const { id, slug } = req.params;
    try {
      const u = getUserById(id);
      if (!u) return res.status(404).json({ error: 'usuario no existe' });
      const client = getClient(slug);
      // Remove client slug from user's clients array (if array)
      if (Array.isArray(u.clients)) {
        await updateUser(id, { clients: u.clients.filter((s) => s !== slug) });
      }
      // Remove all client's platform IDs from user's accounts
      const acc = u.accounts || { meta: [], gads: [], ga4: [] };
      const cMeta = client.meta_ad_accounts || (client.meta_ad_account_id ? [client.meta_ad_account_id] : []);
      const cGads = client.gads_customers || (client.gads_customer_id ? [client.gads_customer_id] : []);
      const cGa4 = client.ga4_properties || (client.ga4_property_id ? [client.ga4_property_id] : []);
      updateUserAccounts(id, 'meta', (acc.meta || []).filter((x) => !cMeta.map(String).includes(String(x))));
      updateUserAccounts(id, 'gads', (acc.gads || []).filter((x) => !cGads.map(String).includes(String(x))));
      updateUserAccounts(id, 'ga4', (acc.ga4 || []).filter((x) => !cGa4.map(String).includes(String(x))));
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/admin/users/:id/accounts', requireLogin, requireAdmin, express.json(), (req, res) => {
    const { platform, ids } = req.body || {};
    try {
      const accounts = updateUserAccounts(req.params.id, platform, ids || []);
      res.json({ ok: true, accounts });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Live account lists from each platform
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
      const accounts = [
        ...(owned.data || []).map((a) => ({ id: a.id, name: a.name || `Account ${a.account_id}`, currency: a.currency, kind: 'owned' })),
        ...(client.data || []).map((a) => ({ id: a.id, name: a.name || `Account ${a.account_id}`, currency: a.currency, kind: 'client' })),
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
  router.get('/admin/clients', requireLogin, (req, res) => {
    const user = res.locals.user;
    const clients = listClients();
    const allowed = allowedClientSlugs(user);
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderClientsView({
          user,
          clients,
          allowedForUser: allowed,
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

  router.get('/admin/clients/:slug/edit', requireLogin, requireAdmin, (req, res) => {
    let target;
    try {
      target = getClient(req.params.slug);
    } catch {
      return res.status(404).send('Not found');
    }
    // Find users with EXPLICIT access to this client (excludes admin catch-all "*")
    const allUsers = listAllUsers();
    const metaIds = target.meta_ad_accounts || (target.meta_ad_account_id ? [target.meta_ad_account_id] : []);
    const gadsIds = target.gads_customers || (target.gads_customer_id ? [target.gads_customer_id] : []);
    const ga4Ids = target.ga4_properties || (target.ga4_property_id ? [target.ga4_property_id] : []);
    const usersWithAccess = allUsers.filter((u) => {
      if (Array.isArray(u.clients) && u.clients.includes(req.params.slug)) return true;
      const acc = u.accounts || {};
      if (metaIds.some((id) => (acc.meta || []).includes(String(id)))) return true;
      if (gadsIds.some((id) => (acc.gads || []).includes(String(id)))) return true;
      if (ga4Ids.some((id) => (acc.ga4 || []).includes(String(id)))) return true;
      return false;
    });
    // Enrich each user with their access flags per platform for this client
    usersWithAccess.forEach((u) => {
      const acc = u.accounts || {};
      u._meta_access = metaIds.some((id) => (acc.meta || []).includes(String(id)));
      u._gads_access = gadsIds.some((id) => (acc.gads || []).includes(String(id)));
      u._ga4_access = ga4Ids.some((id) => (acc.ga4 || []).includes(String(id)));
    });
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderClientEditView({
          user: res.locals.user,
          target: { slug: req.params.slug, ...target },
          usersWithAccess,
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
    const user = res.locals.user;
    const allowed = allowedClientSlugs(user);
    const all = listClients();
    const clients = allowed === null ? all : all.filter((c) => allowed.includes(c.slug));
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

  // -------- LOGS --------
  router.get('/admin/logs', requireLogin, requireAdmin, (req, res) => {
    const logs = listLogs();
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(renderLogsView({ user: res.locals.user, logs, flash: flashFromQuery(req) }));
  });

  router.post('/admin/logs/:id/delete', requireLogin, requireAdmin, (req, res) => {
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
