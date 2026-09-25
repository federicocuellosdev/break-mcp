import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'break_sid';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function secret() {
  const s = process.env.MCP_SESSION_SECRET;
  if (!s) throw new Error('MCP_SESSION_SECRET not set');
  return s;
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function makeSession(userId) {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(cookie) {
  if (!cookie) return null;
  const parts = cookie.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const payload = `${userId}.${expStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return null;
  return { userId, exp };
}

export function setSessionCookie(res, userId) {
  const value = makeSession(userId);
  res.cookie(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function readSessionCookie(req) {
  const raw = req.cookies?.[COOKIE_NAME];
  return verifySession(raw);
}
