import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireStaff } from '@/lib/staff-api';

export const runtime = 'nodejs';

const announcementSchema = z.object({
  title: z.string().trim().min(5).max(200),
  category: z.string().trim().min(2).max(100),
  content: z.string().trim().min(20).max(10000),
});

const deleteSchema = z.object({ id: z.string().min(1).max(128) });

interface AnnouncementRow extends RowDataPacket {
  announcement_id: string;
  title: string;
  category: string;
  content: string;
  created_at: Date;
}

export async function GET(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  try {
    const [announcements] = await getMySqlPool().execute<AnnouncementRow[]>(
      `SELECT announcement_id, title, category, content, created_at
       FROM website_announcements
       WHERE is_published = 1
       ORDER BY created_at DESC, announcement_id DESC`
    );
    return Response.json({ announcements });
  } catch (error) {
    console.error('Failed to load staff announcements from MySQL.', error);
    return Response.json(
      { error: 'Unable to load announcements right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a title, category, and announcement content within the allowed lengths.' },
      { status: 400 }
    );
  }

  try {
    const id = randomUUID();
    await getMySqlPool().execute(
      `INSERT INTO website_announcements
         (announcement_id, title, category, content)
       VALUES (?, ?, ?, ?)`,
      [id, parsed.data.title, parsed.data.category, parsed.data.content]
    );
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Failed to save the announcement in MySQL.', error);
    return Response.json(
      { error: 'Unable to publish this announcement right now.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireStaff(request);
  if (isResponse(user)) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'A valid announcement ID is required.' }, { status: 400 });
  }

  try {
    const [result] = await getMySqlPool().execute(
      'UPDATE website_announcements SET is_published = 0 WHERE announcement_id = ? AND is_published = 1',
      [parsed.data.id]
    );
    if ('affectedRows' in result && result.affectedRows === 0) {
      return Response.json({ error: 'Announcement not found.' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to unpublish the announcement in MySQL.', error);
    return Response.json(
      { error: 'Unable to remove this announcement right now.' },
      { status: 500 }
    );
  }
}
