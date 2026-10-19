import { getMySqlPool } from '@/lib/mysql';
import { requireStaff, isResponse } from '@/lib/staff-api';
import type { RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

interface LeadRow extends RowDataPacket {
  request_id: number;
  request_type: 'quote' | 'callback' | 'message';
  full_name: string;
  email_address: string;
  phone_number: string | null;
  service_name: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'unresolved' | 'escalated';
  resolution_note: string | null;
  assigned_to: string | null;
  read_by: string | null;
  read_at: Date | null;
  last_action_by: string | null;
  last_action_type: 'read' | 'claimed' | 'updated' | null;
  last_action_note: string | null;
  last_action_at: Date | null;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  request_type: LeadRow['request_type'];
  total: number;
}

interface ActivityRow extends CountRow {
  day: string;
}

export async function GET(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  try {
    const pool = getMySqlPool();
    const [rows] = await pool.execute<LeadRow[]>(
      `SELECT r.request_id, r.request_type, r.full_name, r.email_address,
              r.phone_number, r.service_name, r.message, r.status,
              r.resolution_note, assigned.full_name AS assigned_to,
              reader.full_name AS read_by, r.read_at,
              actor.full_name AS last_action_by, r.last_action_type,
              r.last_action_note, r.last_action_at, r.created_at
       FROM customer_requests r
       LEFT JOIN website_users assigned ON assigned.user_id = r.assigned_to_user_id
       LEFT JOIN website_users reader ON reader.user_id = r.read_by_user_id
       LEFT JOIN website_users actor ON actor.user_id = r.last_action_by_user_id
       ORDER BY r.created_at DESC, r.request_id DESC
       LIMIT 100`
    );
    const [countRows] = await pool.execute<CountRow[]>(
      `SELECT request_type, COUNT(*) AS total
       FROM customer_requests
       GROUP BY request_type`
    );
    const [activityRows] = await pool.execute<ActivityRow[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
              request_type, COUNT(*) AS total
       FROM customer_requests
       WHERE created_at >= CURRENT_DATE - INTERVAL 13 DAY
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), request_type
       ORDER BY day`
    );

    return Response.json({ leads: rows, counts: countRows, activity: activityRows });
  } catch (error) {
    console.error('Failed to load customer requests from MySQL.', error);
    return Response.json(
      { error: 'Unable to load customer requests right now.' },
      { status: 500 }
    );
  }
}
