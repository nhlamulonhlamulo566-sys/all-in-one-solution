import { randomUUID } from 'node:crypto';
import { getMySqlPool } from '@/lib/mysql';
import { getVisitorToken, hashVisitorToken } from '@/lib/mysql-chat';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const token = getVisitorToken(request);
  if (!token) {
    return Response.json({ error: 'A valid visitor token is required.' }, { status: 400 });
  }

  try {
    const sessionId = randomUUID();
    await getMySqlPool().execute(
      `INSERT INTO website_chat_sessions
         (session_id, visitor_id, visitor_token_hash)
       VALUES (?, ?, ?)`,
      [sessionId, randomUUID(), hashVisitorToken(token)]
    );
    return Response.json({ sessionId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create the chat session in MySQL.', error);
    return Response.json(
      { error: 'Unable to start a chat right now.' },
      { status: 500 }
    );
  }
}
