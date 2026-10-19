import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { getVisitorToken, hashVisitorToken } from '@/lib/mysql-chat';

export const runtime = 'nodejs';

interface SessionRow extends RowDataPacket {
  visitor_id: string;
  status: 'active' | 'closed';
  assigned_to: string | null;
  queue_ahead: number;
  waiting_count: number;
}

interface MessageRow extends RowDataPacket {
  message_id: string;
  sender_id: string;
  sender_role: 'visitor' | 'staff';
  message_text: string;
  created_at: Date;
}

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

type RouteContext = { params: Promise<{ sessionId: string }> };

async function ownedSession(sessionId: string, token: string) {
  const [rows] = await getMySqlPool().execute<SessionRow[]>(
    `SELECT s.visitor_id, s.status, assigned.full_name AS assigned_to,
            (SELECT COUNT(*)
             FROM website_chat_sessions waiting
             WHERE waiting.status = 'active'
               AND waiting.assigned_to_user_id IS NULL
               AND (waiting.created_at < s.created_at
                    OR (waiting.created_at = s.created_at AND waiting.session_id < s.session_id))
            ) AS queue_ahead,
            (SELECT COUNT(*)
             FROM website_chat_sessions waiting
             WHERE waiting.status = 'active'
               AND waiting.assigned_to_user_id IS NULL
            ) AS waiting_count
     FROM website_chat_sessions s
     LEFT JOIN website_users assigned ON assigned.user_id = s.assigned_to_user_id
     WHERE s.session_id = ? AND s.visitor_token_hash = ?
     LIMIT 1`,
    [sessionId, hashVisitorToken(token)]
  );
  return rows[0] ?? null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const token = getVisitorToken(request);
  if (!token) {
    return Response.json({ error: 'A valid visitor token is required.' }, { status: 401 });
  }
  const { sessionId } = await params;

  try {
    const session = await ownedSession(sessionId, token);
    if (!session) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }
    const [messages] = await getMySqlPool().execute<MessageRow[]>(
      `SELECT message_id, sender_id, sender_role, message_text, created_at
       FROM website_chat_messages
       WHERE session_id = ?
       ORDER BY created_at, message_id`,
      [sessionId]
    );
    return Response.json({
      messages,
      session: {
        status: session.status,
        assignedTo: session.assigned_to,
        queueAhead: Number(session.queue_ahead),
        waitingCount: Number(session.waiting_count),
      },
    });
  } catch (error) {
    console.error('Failed to load visitor chat messages from MySQL.', error);
    return Response.json(
      { error: 'Unable to load chat messages right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const token = getVisitorToken(request);
  if (!token) {
    return Response.json({ error: 'A valid visitor token is required.' }, { status: 401 });
  }
  const { sessionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Messages must contain between 1 and 2000 characters.' },
      { status: 400 }
    );
  }

  try {
    const session = await ownedSession(sessionId, token);
    if (!session) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }
    if (session.status !== 'active') {
      return Response.json({ error: 'This chat session is closed.' }, { status: 409 });
    }
    const messageId = randomUUID();
    await getMySqlPool().execute(
      `INSERT INTO website_chat_messages
         (message_id, session_id, sender_id, sender_role, message_text)
       VALUES (?, ?, ?, 'visitor', ?)`,
      [messageId, sessionId, session.visitor_id, parsed.data.text]
    );
    return Response.json({ id: messageId }, { status: 201 });
  } catch (error) {
    console.error('Failed to save the visitor chat message in MySQL.', error);
    return Response.json(
      { error: 'Unable to send your message right now.' },
      { status: 500 }
    );
  }
}
