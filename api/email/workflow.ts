import type { IncomingMessage, ServerResponse } from 'http';
import { sendWorkflowEmail } from '../_lib/email.js';

const VALID_KEYS = [
  'screening-link', 'screening-reject',
  'interview-schedule', 'talent-pool', 'hired',
];

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body: Record<string, string>;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw) as Record<string, string>;
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { templateKey, to, name, role, customBody, interviewDate, meetLink, reason } = body;

  if (!templateKey || !to || !name || !role) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required fields: templateKey, to, name, role' }));
    return;
  }

  if (!VALID_KEYS.includes(templateKey)) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: `Invalid templateKey. Must be one of: ${VALID_KEYS.join(', ')}` }));
    return;
  }

  try {
    await sendWorkflowEmail({ templateKey: templateKey as Parameters<typeof sendWorkflowEmail>[0]['templateKey'], to, name, role, customBody, interviewDate, meetLink, reason });
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('[api/email/workflow] error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: String(err) }));
  }
}
