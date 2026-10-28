import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

const documentTypes = ['cv', 'identity', 'qualification', 'driversLicense', 'other'] as const;
function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const vacancySchema = z.object({
  title: z.string().trim().min(3).max(160),
  department: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(160),
  workType: z.enum(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship']),
  description: z.string().trim().min(20).max(5000),
  requirements: z.string().trim().min(10).max(5000),
  responsibilities: z.string().trim().min(20).max(5000),
  salaryRange: z.string().trim().max(120),
  selectionProcess: z.string().trim().min(10).max(2000),
  requiredDocuments: z.array(z.enum(documentTypes)).min(1).max(documentTypes.length),
  status: z.enum(['open', 'closed']),
  closingDate: z.union([
    z.literal(''),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ]),
});

interface VacancyRow extends RowDataPacket {
  vacancy_id: string;
  title: string;
  department: string;
  location: string;
  work_type: string;
  description: string;
  requirements: string;
  responsibilities: string | null;
  salary_range: string | null;
  selection_process: string | null;
  required_documents_json: string;
  status: 'open' | 'closed';
  closing_date: string | null;
  created_at: Date;
  application_count: number;
}

export async function GET(request: Request) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  try {
    const [rows] = await getMySqlPool().execute<VacancyRow[]>(
      `SELECT v.vacancy_id, v.title, v.department, v.location, v.work_type,
              v.description, v.requirements, v.responsibilities,
              v.salary_range, v.selection_process, v.required_documents_json,
              v.status, v.closing_date, v.created_at,
              COUNT(a.application_id) AS application_count
       FROM career_vacancies v
       LEFT JOIN career_applications a ON a.vacancy_id = v.vacancy_id
       GROUP BY v.vacancy_id
       ORDER BY v.created_at DESC
       LIMIT 100`
    );
    return Response.json({
      vacancies: rows.map((row) => ({
        id: row.vacancy_id,
        title: row.title,
        department: row.department,
        location: row.location,
        workType: row.work_type,
        description: row.description,
        requirements: row.requirements,
        responsibilities: row.responsibilities || '',
        salaryRange: row.salary_range || '',
        selectionProcess: row.selection_process || '',
        requiredDocuments: [...new Set([
          'cv',
          ...(JSON.parse(row.required_documents_json) as string[]),
        ])],
        status: row.status,
        closingDate: row.closing_date,
        createdAt: row.created_at,
        applicationCount: Number(row.application_count),
      })),
    });
  } catch (error) {
    console.error('Failed to load career vacancies for administration.', error);
    return Response.json({ error: 'Unable to load vacancies right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = vacancySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Please complete all required vacancy details.' }, { status: 400 });
  }
  const requiredDocuments = [...new Set(['cv', ...parsed.data.requiredDocuments])];
  if (parsed.data.closingDate && !isValidDate(parsed.data.closingDate)) {
    return Response.json({ error: 'Enter a valid application closing date.' }, { status: 400 });
  }
  if (parsed.data.closingDate && parsed.data.closingDate < new Date().toISOString().slice(0, 10)) {
    return Response.json({ error: 'Closing date must be today or a future date.' }, { status: 400 });
  }

  try {
    const vacancyId = randomUUID();
    await getMySqlPool().execute(
      `INSERT INTO career_vacancies
         (vacancy_id, title, department, location, work_type, description,
          requirements, responsibilities, salary_range, selection_process,
          required_documents_json, status, closing_date, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vacancyId,
        parsed.data.title,
        parsed.data.department,
        parsed.data.location,
        parsed.data.workType,
        parsed.data.description,
        parsed.data.requirements,
        parsed.data.responsibilities,
        parsed.data.salaryRange || null,
        parsed.data.selectionProcess,
        JSON.stringify(requiredDocuments),
        parsed.data.status,
        parsed.data.closingDate || null,
        user.id,
      ]
    );
    return Response.json({ vacancyId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create career vacancy.', error);
    return Response.json({ error: 'Unable to create this vacancy right now.' }, { status: 500 });
  }
}
