import { getMySqlPool } from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

interface AnnouncementRow extends RowDataPacket {
  announcement_id: string;
  title: string;
  category: string;
  content: string;
  created_at: Date;
}

export async function GET() {
  try {
    const [announcements] = await getMySqlPool().execute<AnnouncementRow[]>(
      `SELECT announcement_id, title, category, content, created_at
       FROM website_announcements
       WHERE is_published = 1
       ORDER BY created_at DESC, announcement_id DESC`
    );
    return Response.json({ announcements });
  } catch (error) {
    console.error('Failed to load announcements from MySQL.', error);
    return Response.json(
      { error: 'Unable to load announcements right now.' },
      { status: 500 }
    );
  }
}
