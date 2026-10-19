import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireStaff } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface SessionRow extends RowDataPacket {
  session_id: string;
  visitor_id: string;
  status: 'active' | 'closed';
  created_at: Date;
}

interface MessageRow extends RowDataPacket {
  message_id: string;
  sender_id: string;
  sender_role: 'visitor' | 'staff';
  message_text: string;
  created_at: Date;
}

const replySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;
  const { sessionId } = await params;

  try {
    const pool = getMySqlPool();
    const [sessions] = await pool.execute<SessionRow[]>(
      `SELECT session_id, visitor_id, status, created_at
       FROM website_chat_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId]
    );
    const session = sessions[0];
    if (!session) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }
    const [messages] = await pool.execute<MessageRow[]>(
      `SELECT message_id, sender_id, sender_role, message_text, created_at
       FROM website_chat_messages
       WHERE session_id = ?
       ORDER BY created_at, message_id`,
      [sessionId]
    );
    return Response.json({ session, messages });
  } catch (error) {
    console.error('Failed to load staff chat messages from MySQL.', error);
    return Response.json(
      { error: 'Unable to load this chat right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;
  const { sessionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Replies must contain between 1 and 2000 characters.' },
      { status: 400 }
    );
  }

  try {
    const pool = getMySqlPool();
    const [sessions] = await pool.execute<SessionRow[]>(
      `SELECT session_id, visitor_id, status, created_at
       FROM website_chat_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId]
    );
    const session = sessions[0];
    if (!session) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }
    if (session.status !== 'active') {
      return Response.json({ error: 'This chat session is closed.' }, { status: 409 });
    }
    const messageId = randomUUID();
    await pool.execute(
      `INSERT INTO website_chat_messages
         (message_id, session_id, sender_id, sender_role, message_text)
       VALUES (?, ?, ?, 'staff', ?)`,
      [messageId, sessionId, user.id, parsed.data.text]
    );
    return Response.json({ id: messageId }, { status: 201 });
  } catch (error) {
    console.error('Failed to save the staff chat reply in MySQL.', error);
    return Response.json(
      { error: 'Unable to send your reply right now.' },
      { status: 500 }
    );
  }
}
