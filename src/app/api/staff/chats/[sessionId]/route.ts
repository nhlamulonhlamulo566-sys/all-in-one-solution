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
  sender_name: string | null;
  created_at: Date;
}

const replySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

const workflowSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('read') }),
  z.object({ action: z.literal('claim') }),
  z.object({
    action: z.literal('update'),
    status: z.enum(['open', 'in_progress', 'resolved', 'unresolved', 'escalated']),
    note: z.string().trim().max(2000),
  }),
]);

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;
  const { sessionId } = await params;

  try {
    const pool = getMySqlPool();
    const [sessions] = await pool.execute<SessionRow[]>(
      `SELECT s.session_id, s.visitor_id, s.status, s.handling_status,
              s.resolution_note, s.read_at, assigned.full_name AS assigned_to,
              reader.full_name AS read_by, actor.full_name AS last_action_by,
              s.last_action_type, s.last_action_note, s.created_at
       FROM website_chat_sessions s
       LEFT JOIN website_users assigned ON assigned.user_id = s.assigned_to_user_id
       LEFT JOIN website_users reader ON reader.user_id = s.read_by_user_id
       LEFT JOIN website_users actor ON actor.user_id = s.last_action_by_user_id
       WHERE s.session_id = ? LIMIT 1`,
      [sessionId]
    );
    const session = sessions[0];
    if (!session) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }
    const [messages] = await pool.execute<MessageRow[]>(
      `SELECT m.message_id, m.sender_id, m.sender_role, m.message_text,
              u.full_name AS sender_name, m.created_at
       FROM website_chat_messages m
       LEFT JOIN website_users u ON u.user_id = m.sender_id
       WHERE m.session_id = ?
       ORDER BY m.created_at, m.message_id`,
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

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;
  const { sessionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = workflowSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat workflow update.' }, { status: 400 });
  }

  try {
    const pool = getMySqlPool();
    const [sessions] = await pool.execute<SessionRow[]>(
      `SELECT session_id, visitor_id, status, created_at
       FROM website_chat_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId]
    );
    if (!sessions[0]) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 });
    }

    if (parsed.data.action === 'read') {
      await pool.execute(
        `UPDATE website_chat_sessions
         SET read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
             last_action_by_user_id = ?, last_action_type = 'read',
             last_action_note = NULL, last_action_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [user.id, user.id, sessionId]
      );
    } else if (parsed.data.action === 'claim') {
      await pool.execute(
        `UPDATE website_chat_sessions
         SET assigned_to_user_id = ?, read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
             last_action_by_user_id = ?,
             last_action_type = 'claimed', last_action_note = NULL,
             last_action_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [user.id, user.id, user.id, sessionId]
      );
    } else {
      const { status, note } = parsed.data;
      await pool.execute(
        `UPDATE website_chat_sessions
         SET handling_status = ?,
             status = CASE WHEN ? = 'resolved' THEN 'closed' ELSE 'active' END,
             resolution_note = ?, read_by_user_id = ?,
             read_at = CURRENT_TIMESTAMP, last_action_by_user_id = ?,
             last_action_type = 'updated', last_action_note = ?,
             last_action_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [status, status, note || null, user.id, user.id, note || null, sessionId]
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to update chat workflow in MySQL.', error);
    return Response.json(
      { error: 'Unable to update this chat right now.' },
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
