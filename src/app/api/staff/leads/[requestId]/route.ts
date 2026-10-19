import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { requireStaff, isResponse } from '@/lib/staff-api';

export const runtime = 'nodejs';

const updateSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('read') }),
  z.object({ action: z.literal('claim') }),
  z.object({
    action: z.literal('update'),
    status: z.enum(['new', 'in_progress', 'resolved', 'unresolved', 'escalated']),
    note: z.string().trim().max(2000),
  }),
]);

type RouteContext = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  const { requestId } = await params;
  if (!/^\d+$/.test(requestId)) {
    return Response.json({ error: 'Invalid request ID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request workflow update.' }, { status: 400 });
  }

  try {
    const pool = getMySqlPool();
    const [existing] = await pool.execute<Array<RowDataPacket & { request_id: number }>>(
      `SELECT request_id FROM customer_requests WHERE request_id = ? LIMIT 1`,
      [requestId]
    );
    if (!existing[0]) {
      return Response.json({ error: 'Customer request not found.' }, { status: 404 });
    }

    const activityId = randomUUID();
    let action: 'read' | 'claimed' | 'status';
    let details: string | null;
    if (parsed.data.action === 'read') {
      action = 'read';
      details = null;
      await pool.execute(
        `UPDATE customer_requests
         SET read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
             last_action_by_user_id = ?, last_action_type = 'read',
             last_action_note = NULL, last_action_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [user.id, user.id, requestId]
      );
    } else if (parsed.data.action === 'claim') {
      action = 'claimed';
      details = null;
      await pool.execute(
        `UPDATE customer_requests
         SET assigned_to_user_id = ?, read_by_user_id = ?, read_at = CURRENT_TIMESTAMP,
             last_action_by_user_id = ?,
             last_action_type = 'claimed', last_action_note = NULL,
             last_action_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [user.id, user.id, user.id, requestId]
      );
    } else {
      const { status, note } = parsed.data;
      action = 'status';
      details = note ? `${status}: ${note}` : status;
      await pool.execute(
        `UPDATE customer_requests
         SET status = ?, resolution_note = ?, read_by_user_id = ?,
             read_at = CURRENT_TIMESTAMP, last_action_by_user_id = ?,
             last_action_type = 'updated', last_action_note = ?,
             last_action_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [status, note || null, user.id, user.id, details, requestId]
      );
    }

    await pool.execute(
      `INSERT INTO website_staff_activity
         (activity_id, entity_type, entity_id, staff_user_id, action, details)
       VALUES (?, 'request', ?, ?, ?, ?)`,
      [activityId, requestId, user.id, action, details]
    );
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to update customer request workflow in MySQL.', error);
    return Response.json(
      { error: 'Unable to update this customer request right now.' },
      { status: 500 }
    );
  }
}
