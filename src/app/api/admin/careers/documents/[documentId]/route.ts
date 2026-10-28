import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

const documentIdSchema = z.string().uuid();
type RouteContext = { params: Promise<{ documentId: string }> };

interface StoredDocument extends RowDataPacket {
  original_name: string;
  content_type: string;
  content_base64: string;
}

const allowedContentTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

export async function GET(request: Request, { params }: RouteContext) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  const { documentId } = await params;
  if (!documentIdSchema.safeParse(documentId).success) {
    return Response.json({ error: 'Invalid document ID.' }, { status: 400 });
  }

  try {
    const [documents] = await getMySqlPool().execute<StoredDocument[]>(
      `SELECT original_name, content_type, content_base64
       FROM career_application_documents
       WHERE document_id = ?
       LIMIT 1`,
      [documentId]
    );
    const document = documents[0];
    if (!document || !allowedContentTypes.has(document.content_type)) {
      return Response.json({ error: 'Document not found.' }, { status: 404 });
    }

    const safeName = document.original_name.replace(/["\\\r\n]/g, '_');
    return new Response(Buffer.from(document.content_base64, 'base64'), {
      headers: {
        'Content-Type': document.content_type,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Failed to retrieve career application document.', error);
    return Response.json(
      { error: 'Unable to retrieve this document right now.' },
      { status: 500 }
    );
  }
}
