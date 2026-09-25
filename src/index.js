import express from 'express';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from './server.js';
import { verifyToken } from './users.js';
import { createWebRouter } from './web/routes.js';

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(cookieParser());

app.use('/public', express.static('public', { maxAge: '7d' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(createWebRouter());

app.use('/mcp', express.json({ limit: '2mb' }));

function authenticate(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return verifyToken(token);
}

const requireAuth = (req, res, next) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.mcpUser = user;
  next();
};

const transports = new Map();
const sessionUsers = new Map();

app.post('/mcp', requireAuth, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports.has(sessionId)) {
    const owner = sessionUsers.get(sessionId);
    if (owner !== req.mcpUser.id) {
      return res.status(403).json({ error: 'session belongs to another user' });
    }
    transport = transports.get(sessionId);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports.set(sid, transport);
        sessionUsers.set(sid, req.mcpUser.id);
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId);
        sessionUsers.delete(transport.sessionId);
      }
    };
    const server = createServer({ user: req.mcpUser });
    await server.connect(transport);
  } else {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: no valid session' },
      id: null,
    });
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports.has(sessionId)) {
    return res.status(400).send('Invalid or missing session ID');
  }
  if (sessionUsers.get(sessionId) !== req.mcpUser.id) {
    return res.status(403).send('session belongs to another user');
  }
  await transports.get(sessionId).handleRequest(req, res);
};

app.get('/mcp', requireAuth, handleSessionRequest);
app.delete('/mcp', requireAuth, handleSessionRequest);

app.listen(PORT, () => {
  console.log(`break-mcp listening on :${PORT}`);
});
