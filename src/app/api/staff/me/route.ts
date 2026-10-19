import { getAuthUser } from '@/lib/mysql-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return Response.json({ error: 'Sign-in is required.' }, { status: 401 });
    }
    return Response.json(user, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to load the MySQL staff account.', error);
    return Response.json(
      { error: 'Unable to load your staff account right now.' },
      { status: 503 }
    );
  }
}
