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
  members: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    position: z.string().trim().min(2).max(100),
    bio: z.string().trim().max(400),
    imageData: z.string().max(180_000).nullable(),
  }).strict()).max(6),
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
      { error: 'Check the heading, introduction, and leadership profiles for missing or oversized fields.' },
      { status: 400 }
    );
  }
  if (new Set(parsed.data.members.map((member) => member.id)).size !== parsed.data.members.length) {
    return Response.json({ error: 'Each leadership profile must have a unique ID.' }, { status: 400 });
  }

  for (const member of parsed.data.members) {
    if (!member.imageData) continue;
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(member.imageData);
    if (!match) {
      return Response.json({ error: 'Leadership photos must be valid JPEG images.' }, { status: 400 });
    }
    const image = Buffer.from(match[1], 'base64');
    if (
      image.length === 0
      || image.length > 120 * 1024
      || image.toString('base64') !== match[1]
      || image[0] !== 0xff
      || image[1] !== 0xd8
      || image[2] !== 0xff
    ) {
      return Response.json({ error: 'A leadership photo is invalid or exceeds the 120 KiB limit.' }, { status: 400 });
    }
  }

  const membersJson = JSON.stringify(parsed.data.members);
  if (Buffer.byteLength(membersJson, 'utf8') > 700 * 1024) {
    return Response.json(
      { error: 'The combined leadership photos are too large. Use smaller photos.' },
      { status: 413 }
    );
  }

  try {
    const [result] = await getMySqlPool().execute(
      `UPDATE website_page_content
       SET heading = ?, description = ?, members_json = ?
       WHERE page_key = 'about-leadership'`,
      [parsed.data.heading, parsed.data.description, membersJson]
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
    return Response.json({ ...parsed.data, members: parsed.data.members }, {
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
