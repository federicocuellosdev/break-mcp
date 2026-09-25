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
} from '../users.js';
import { listMccChildren } from '../providers/gads.js';
import { listAccountSummaries } from '../providers/ga4.js';
import {
  listClients,
  getClient,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
} from '../clients.js';
import { setSessionCookie, clearSessionCookie, readSessionCookie } from './session.js';
import { renderLogin } from './pages/login.js';
import {
  renderDashboard,
  renderUsersView,
  renderUserEditView,
  renderUserNewView,
  renderClientsView,
  renderClientForm,
  renderConfigView,
} from './pages/admin.js';
import { generateUserMd } from '../mdConfig.js';

const TOOLS_COUNT = 17;

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
      await createUser({ id, name, email, role, clients, password });
      redirWithFlash(res, `/admin/users/${id}/edit`, 'ok', `Usuario "${id}" creado. Configurale los accesos.`);
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
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderUserEditView({
          user: res.locals.user,
          target,
          flash: flashFromQuery(req),
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
    res
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(
        renderClientForm({
          user: res.locals.user,
          mode: 'edit',
          target,
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

  router.post('/admin/clients/:slug/delete', requireLogin, requireAdmin, (req, res) => {
    try {
      deleteClientRecord(req.params.slug);
      redirWithFlash(res, '/admin/clients', 'ok', `Cliente "${req.params.slug}" eliminado.`);
    } catch (e) {
      redirWithFlash(res, '/admin/clients', 'err', e.message);
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
