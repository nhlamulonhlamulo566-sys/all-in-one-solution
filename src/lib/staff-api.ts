import { getAuthUser, type AuthUser } from '@/lib/mysql-auth';

export type StaffUser = AuthUser;

export function isResponse(value: StaffUser | Response): value is Response {
  return value instanceof Response;
}

export async function requireStaff(request: Request): Promise<StaffUser | Response> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return Response.json({ error: 'Sign-in is required.' }, { status: 401 });
    }
    if (user.role !== 'staff' && user.role !== 'admin') {
      return Response.json({ error: 'Staff access is required.' }, { status: 403 });
    }
    return user;
  } catch (error) {
    console.error('Failed to validate MySQL staff session.', error);
    return Response.json(
      { error: 'Unable to verify staff access right now.' },
      { status: 503 }
    );
  }
}

export async function requireAdmin(request: Request): Promise<StaffUser | Response> {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;
  if (user.role !== 'admin') {
    return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  }
  return user;
}
