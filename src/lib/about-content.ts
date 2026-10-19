import 'server-only';

import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

export type AboutLeadershipContent = {
  heading: string;
  description: string;
};

interface AboutLeadershipRow extends RowDataPacket, AboutLeadershipContent {}

export async function getAboutLeadershipContent(): Promise<AboutLeadershipContent> {
  const [rows] = await getMySqlPool().execute<AboutLeadershipRow[]>(
    `SELECT heading, description
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
  return { heading: content.heading, description: content.description };
}
