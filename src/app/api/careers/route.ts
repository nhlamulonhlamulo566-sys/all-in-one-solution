import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getMySqlPool } from '@/lib/mysql';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2_000_000;
const MAX_TOTAL_FILE_SIZE = 3_500_000;
const MAX_REQUEST_SIZE = 4_000_000;

class InvalidDocumentError extends Error {}

const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(40),
  location: z.string().trim().min(2).max(160),
  roleInterest: z.string().trim().min(2).max(120),
  availability: z.string().trim().min(2).max(120),
  experienceSummary: z.string().trim().min(30).max(5000),
  vacancyId: z.union([z.literal(''), z.string().uuid()]),
  privacyConsent: z.literal('on'),
});

const documentFields = [
  { field: 'cv', type: 'cv', label: 'CV or résumé', required: true, formats: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  { field: 'identity', type: 'identity', label: 'Identity document', required: false, formats: ['application/pdf', 'image/jpeg', 'image/png'] },
  { field: 'qualification', type: 'qualification', label: 'Qualification certificates', required: false, formats: ['application/pdf', 'image/jpeg', 'image/png'] },
  { field: 'driversLicense', type: 'drivers_license', label: 'Driver’s licence', required: false, formats: ['application/pdf', 'image/jpeg', 'image/png'] },
  { field: 'other', type: 'other', label: 'Other supporting document', required: false, formats: ['application/pdf', 'image/jpeg', 'image/png'] },
] as const;

type DocumentField = (typeof documentFields)[number];

function hasAllowedSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === 'application/pdf') {
    return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  }
  if (contentType === 'image/png') {
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  }
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  return false;
}

function hasMatchingExtension(fileName: string, contentType: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const allowedExtensions: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
  };
  return Boolean(extension && allowedExtensions[contentType]?.includes(extension));
}

function safeFileName(name: string) {
  return name
    .replace(/[\\/]/g, '_')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, 180) || 'application-document';
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value !== null && typeof value !== 'string';
}

async function validateDocument(field: DocumentField, file: File) {
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new InvalidDocumentError(`${field.label} must be no larger than 2 MB.`);
  }
  if (!field.formats.some((format) => format === file.type)) {
    throw new InvalidDocumentError(`${field.label} must be a PDF${field.type === 'cv' ? ' or DOCX' : ', JPG, or PNG'}.`);
  }
  if (!hasMatchingExtension(file.name, file.type)) {
    throw new InvalidDocumentError(`${field.label} file extension does not match its file type.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasAllowedSignature(bytes, file.type)) {
    throw new InvalidDocumentError(`${field.label} does not match its file type. Please choose a valid document.`);
  }

  return {
    type: field.type,
    name: safeFileName(file.name),
    contentType: file.type,
    size: file.size,
    content: Buffer.from(bytes).toString('base64'),
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try {
    if (origin) sameOrigin = new URL(origin).host === new URL(request.url).host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return Response.json({ error: 'The application could not be verified. Please refresh and try again.' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return Response.json({ error: 'Your upload exceeds the application size limit. Please use smaller files and try again.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'The application form could not be read. Please check your files and try again.' }, { status: 400 });
  }

  if (String(formData.get('website') || '').trim()) {
    return Response.json({ message: 'Your application has been received.' }, { status: 201 });
  }

  const parsed = applicationSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    location: formData.get('location'),
    roleInterest: formData.get('roleInterest'),
    availability: formData.get('availability'),
    experienceSummary: formData.get('experienceSummary'),
    privacyConsent: formData.get('privacyConsent'),
  });
  if (!parsed.success) {
    return Response.json({ error: 'Please check the required application details and consent.' }, { status: 400 });
  }

  try {
    const vacancyId: string | null = parsed.data.vacancyId || null;
    let requiredDocuments = ['cv'];
    if (vacancyId) {
      const [vacancies] = await getMySqlPool().execute<Array<{ required_documents_json: string } & import('mysql2').RowDataPacket>>(
        `SELECT required_documents_json
         FROM career_vacancies
         WHERE vacancy_id = ? AND status = 'open'
           AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
         LIMIT 1`,
        [vacancyId]
      );
      if (!vacancies[0]) {
        return Response.json({ error: 'This vacancy is no longer accepting applications. Please choose another opportunity.' }, { status: 400 });
      }
      requiredDocuments = JSON.parse(vacancies[0].required_documents_json) as string[];
    }

    const documents = [];
    let totalFileSize = 0;

    for (const field of documentFields) {
      const value = formData.get(field.field);
      if (!isFile(value) || value.size === 0) {
        if (field.required || requiredDocuments.includes(field.type)) {
          return Response.json({ error: `${field.label} is required.` }, { status: 400 });
        }
        continue;
      }

      totalFileSize += value.size;
      if (totalFileSize > MAX_TOTAL_FILE_SIZE) {
        return Response.json({ error: 'All attached files must be no larger than 3.5 MB combined on this application form.' }, { status: 413 });
      }
      documents.push(await validateDocument(field, value));
    }

    const applicationId = randomUUID();
    const pool = getMySqlPool();
    await pool.execute(
      `INSERT INTO career_applications
         (application_id, vacancy_id, full_name, email_address, phone_number, location,
          role_interest, availability, experience_summary, consent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
      [
        applicationId,
        vacancyId,
        parsed.data.fullName,
        parsed.data.email.toLowerCase(),
        parsed.data.phone,
        parsed.data.location,
        parsed.data.roleInterest,
        parsed.data.availability,
        parsed.data.experienceSummary,
      ]
    );

    try {
      for (const document of documents) {
        await pool.execute(
          `INSERT INTO career_application_documents
             (document_id, application_id, document_type, original_name,
              content_type, file_size, content_base64)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            applicationId,
            document.type,
            document.name,
            document.contentType,
            document.size,
            document.content,
          ]
        );
      }
    } catch (error) {
      await pool.execute(
        `DELETE FROM career_applications WHERE application_id = ?`,
        [applicationId]
      );
      throw error;
    }

    return Response.json(
      { message: 'Thank you. Your application has been received.' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InvalidDocumentError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to save career application.', error);
    return Response.json(
      { error: 'We could not submit your application right now. Please try again later.' },
      { status: 500 }
    );
  }
}
