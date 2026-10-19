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
  status: 'new' | 'contacted' | 'completed';
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
      `SELECT request_id, request_type, full_name, email_address,
              phone_number, service_name, message, status, created_at
       FROM customer_requests
       ORDER BY created_at DESC, request_id DESC
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
