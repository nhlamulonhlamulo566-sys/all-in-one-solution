import 'server-only';

import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

export type AboutLeadershipContent = {
  heading: string;
  description: string;
  members: AboutLeadershipMember[];
};

export type AboutLeadershipMember = {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageData: string | null;
};

interface AboutLeadershipRow extends RowDataPacket {
  heading: string;
  description: string;
  members_json: string | null;
}

function isAboutLeadershipMember(value: unknown): value is AboutLeadershipMember {
  if (!value || typeof value !== 'object') return false;
  const member = value as Record<string, unknown>;
  return typeof member.id === 'string'
    && typeof member.name === 'string'
    && typeof member.position === 'string'
    && typeof member.bio === 'string'
    && (typeof member.imageData === 'string' || member.imageData === null);
}

export async function getAboutLeadershipContent(): Promise<AboutLeadershipContent> {
  const [rows] = await getMySqlPool().execute<AboutLeadershipRow[]>(
    `SELECT heading, description, members_json
     FROM website_page_content
     WHERE page_key = 'about-leadership'
     LIMIT 1`
  );
  const content = rows[0];
  if (!content) {
    throw new Error(
      'About page content is missing. Apply migration 005-about-leadership-content.sql.'
    );
  }
  let members: AboutLeadershipMember[] = [];
  if (content.members_json) {
    const parsed: unknown = JSON.parse(content.members_json);
    if (
      !Array.isArray(parsed)
      || parsed.length > 6
      || !parsed.every(isAboutLeadershipMember)
    ) {
      throw new Error('Saved About page leadership profiles are invalid.');
    }
    members = parsed;
  }
  return { heading: content.heading, description: content.description, members };
}
