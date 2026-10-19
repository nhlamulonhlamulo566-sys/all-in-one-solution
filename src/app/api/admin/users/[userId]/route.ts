import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import {
  getMySqlConnection,
  isMySqlGatewayEnabled,
  updateUserRoleThroughGateway,
} from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface RoleRow extends RowDataPacket {
  user_id: string;
  role: 'user' | 'staff' | 'admin';
}

interface UserIdRow extends RowDataPacket {
  user_id: string;
}

const roleSchema = z.object({
  role: z.enum(['user', 'staff', 'admin']),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  const { userId } = await context.params;
  if (!z.string().uuid().safeParse(userId).success) {
    return Response.json({ error: 'Invalid user ID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Choose a valid account role.' }, { status: 400 });
  }

  if (isMySqlGatewayEnabled()) {
    try {
      const result = await updateUserRoleThroughGateway({
        userId,
        role: parsed.data.role,
        adminId: admin.id,
      });
      return Response.json(result.body, { status: result.status });
    } catch (error) {
      console.error('Failed to update a MySQL user role through the database gateway.', error);
      return Response.json({ error: 'Unable to update this user right now.' }, { status: 503 });
    }
  }

  const connection = await getMySqlConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<RoleRow[]>(
      'SELECT user_id, role FROM website_users WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const target = users[0];
    if (!target) {
      await connection.rollback();
      return Response.json({ error: 'User account not found.' }, { status: 404 });
    }

    if (target.role === 'admin' && parsed.data.role !== 'admin') {
      if (target.user_id === admin.id) {
        await connection.rollback();
        return Response.json(
          { error: 'You cannot remove administrator access from your own account.' },
          { status: 409 }
        );
      }
      const [admins] = await connection.execute<UserIdRow[]>(
        "SELECT user_id FROM website_users WHERE role = 'admin' FOR UPDATE"
      );
      if (admins.length <= 1) {
        await connection.rollback();
        return Response.json(
          { error: 'The last administrator cannot be demoted.' },
          { status: 409 }
        );
      }
    }

    await connection.execute('UPDATE website_users SET role = ? WHERE user_id = ?', [
      parsed.data.role,
      userId,
    ]);
    await connection.commit();
    return Response.json({ user: { id: userId, role: parsed.data.role } });
  } catch (error) {
    await connection.rollback();
    console.error('Failed to update a MySQL user role.', error);
    return Response.json({ error: 'Unable to update this user right now.' }, { status: 503 });
  } finally {
    connection.release();
  }
}
