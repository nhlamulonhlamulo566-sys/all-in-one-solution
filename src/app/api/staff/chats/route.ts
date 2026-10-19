import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireStaff } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface ChatSessionRow extends RowDataPacket {
  session_id: string;
  visitor_id: string;
  status: 'active' | 'closed';
  handling_status: 'open' | 'in_progress' | 'resolved' | 'unresolved' | 'escalated';
  resolution_note: string | null;
  assigned_to: string | null;
  read_by: string | null;
  last_action_by: string | null;
  last_action_type: 'read' | 'claimed' | 'updated' | null;
  last_action_note: string | null;
  created_at: Date;
  last_message: string | null;
  last_message_at: Date | null;
}

export async function GET(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  try {
    const [sessions] = await getMySqlPool().execute<ChatSessionRow[]>(
      `SELECT s.session_id, s.visitor_id, s.status, s.handling_status,
              s.resolution_note, assigned.full_name AS assigned_to,
              reader.full_name AS read_by, actor.full_name AS last_action_by,
              s.last_action_type, s.last_action_note, s.created_at,
              m.message_text AS last_message, m.created_at AS last_message_at
       FROM website_chat_sessions s
       LEFT JOIN website_users assigned ON assigned.user_id = s.assigned_to_user_id
       LEFT JOIN website_users reader ON reader.user_id = s.read_by_user_id
       LEFT JOIN website_users actor ON actor.user_id = s.last_action_by_user_id
       LEFT JOIN website_chat_messages m
         ON m.message_id = (
           SELECT latest.message_id
           FROM website_chat_messages latest
           WHERE latest.session_id = s.session_id
           ORDER BY latest.created_at DESC, latest.message_id DESC
           LIMIT 1
         )
       ORDER BY COALESCE(m.created_at, s.created_at) DESC
       LIMIT 100`
    );
    return Response.json({ sessions });
  } catch (error) {
    console.error('Failed to load staff chat sessions from MySQL.', error);
    return Response.json(
      { error: 'Unable to load chat sessions right now.' },
      { status: 500 }
    );
  }
}
