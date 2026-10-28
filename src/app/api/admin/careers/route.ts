import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

interface ApplicationRow extends RowDataPacket {
  application_id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  location: string;
  role_interest: string;
  availability: string;
  experience_summary: string;
  created_at: Date;
}

interface DocumentRow extends RowDataPacket {
  document_id: string;
  application_id: string;
  document_type: string;
  original_name: string;
  content_type: string;
  file_size: number;
}

export async function GET(request: Request) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  try {
    const pool = getMySqlPool();
    const [applications] = await pool.execute<ApplicationRow[]>(
      `SELECT application_id, full_name, email_address, phone_number,
              location, role_interest, availability, experience_summary,
              created_at
       FROM career_applications
       ORDER BY created_at DESC
       LIMIT 100`
    );
    const [documents] = await pool.execute<DocumentRow[]>(
      `SELECT document_id, application_id, document_type, original_name,
              content_type, file_size
       FROM career_application_documents
       ORDER BY created_at DESC
       LIMIT 500`
    );

    return Response.json({
      applications: applications.map((application) => ({
        ...application,
        documents: documents.filter(
          (document) => document.application_id === application.application_id
        ),
      })),
    });
  } catch (error) {
    console.error('Failed to load career applications.', error);
    return Response.json(
      { error: 'Unable to load career applications right now.' },
      { status: 500 }
    );
  }
}
