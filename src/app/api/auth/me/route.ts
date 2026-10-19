import { getAuthUser } from '@/lib/mysql-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    return Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to check the MySQL login session.', error);
    return Response.json(
      { error: 'Unable to check your sign-in right now.' },
      { status: 503 }
    );
  }
}
