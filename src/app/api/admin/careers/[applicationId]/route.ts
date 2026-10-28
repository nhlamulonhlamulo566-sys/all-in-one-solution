import { z } from 'zod';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

const paramsSchema = z.string().uuid();
type RouteContext = { params: Promise<{ applicationId: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  const { applicationId } = await params;
  if (!paramsSchema.safeParse(applicationId).success) {
    return Response.json({ error: 'Invalid application ID.' }, { status: 400 });
  }

  try {
    const [result] = await getMySqlPool().execute(
      `DELETE FROM career_applications WHERE application_id = ?`,
      [applicationId]
    );
    if (!('affectedRows' in result) || result.affectedRows === 0) {
      return Response.json({ error: 'Application not found.' }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete career application.', error);
    return Response.json(
      { error: 'Unable to delete this application right now.' },
      { status: 500 }
    );
  }
}
