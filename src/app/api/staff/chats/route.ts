import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireStaff } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface ChatSessionRow extends RowDataPacket {
  session_id: string;
  visitor_id: string;
  status: 'active' | 'closed';
  created_at: Date;
  last_message: string | null;
  last_message_at: Date | null;
}

export async function GET(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  try {
    const [sessions] = await getMySqlPool().execute<ChatSessionRow[]>(
      `SELECT s.session_id, s.visitor_id, s.status, s.created_at,
              m.message_text AS last_message, m.created_at AS last_message_at
       FROM website_chat_sessions s
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
