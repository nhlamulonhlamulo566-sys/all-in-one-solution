import 'server-only';

import { createHash } from 'node:crypto';

export function getVisitorToken(request: Request) {
  const token = request.headers.get('x-chat-token');
  return token && /^[A-Za-z0-9-]{40,100}$/.test(token) ? token : null;
}

export function hashVisitorToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
