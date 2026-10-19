import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getAboutLeadershipContent } from '@/lib/about-content';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface PageContentKeyRow extends RowDataPacket {
  page_key: string;
}

const aboutLeadershipSchema = z.object({
  heading: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
});

export async function GET() {
  try {
    const content = await getAboutLeadershipContent();
    return Response.json(content, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to load About page content.', error);
    return Response.json(
      { error: 'About page content is unavailable right now.' },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = aboutLeadershipSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a heading and description within the allowed lengths.' },
      { status: 400 }
    );
  }

  try {
    const [result] = await getMySqlPool().execute(
      `UPDATE website_page_content
       SET heading = ?, description = ?
       WHERE page_key = 'about-leadership'`,
      [parsed.data.heading, parsed.data.description]
    );
    if ('affectedRows' in result && result.affectedRows === 0) {
      const [rows] = await getMySqlPool().execute<PageContentKeyRow[]>(
        `SELECT page_key
         FROM website_page_content
         WHERE page_key = 'about-leadership'
         LIMIT 1`
      );
      if (rows.length === 0) {
        return Response.json(
          { error: 'About page content has not been initialized in the database.' },
          { status: 503 }
        );
      }
    }
    return Response.json(parsed.data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to update About page content.', error);
    return Response.json(
      { error: 'Unable to save About page content right now.' },
      { status: 503 }
    );
  }
}
