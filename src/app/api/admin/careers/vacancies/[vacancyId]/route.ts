import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';
import { isResponse, requireAdmin } from '@/lib/staff-api';

export const runtime = 'nodejs';

const vacancyIdSchema = z.string().uuid();
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

type RouteContext = { params: Promise<{ vacancyId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  const { vacancyId } = await params;
  if (!vacancyIdSchema.safeParse(vacancyId).success) {
    return Response.json({ error: 'Invalid vacancy ID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (
    typeof body === 'object'
    && body !== null
    && 'status' in body
    && Object.keys(body).length === 1
  ) {
    const parsedStatus = z.object({ status: z.enum(['open', 'closed']) }).safeParse(body);
    if (!parsedStatus.success) {
      return Response.json({ error: 'Choose whether to open or close this vacancy.' }, { status: 400 });
    }
    try {
      const [existing] = await getMySqlPool().execute<Array<RowDataPacket & { vacancy_id: string }>>(
        `SELECT vacancy_id FROM career_vacancies WHERE vacancy_id = ? LIMIT 1`,
        [vacancyId]
      );
      if (!existing[0]) return Response.json({ error: 'Vacancy not found.' }, { status: 404 });
      await getMySqlPool().execute(
        `UPDATE career_vacancies SET status = ? WHERE vacancy_id = ?`,
        [parsedStatus.data.status, vacancyId]
      );
      return Response.json({ ok: true });
    } catch (error) {
      console.error('Failed to update career vacancy status.', error);
      return Response.json({ error: 'Unable to update this vacancy right now.' }, { status: 500 });
    }
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
    const pool = getMySqlPool();
    const [existing] = await pool.execute<Array<RowDataPacket & { vacancy_id: string }>>(
      `SELECT vacancy_id FROM career_vacancies WHERE vacancy_id = ? LIMIT 1`,
      [vacancyId]
    );
    if (!existing[0]) return Response.json({ error: 'Vacancy not found.' }, { status: 404 });
    await pool.execute(
      `UPDATE career_vacancies
       SET title = ?, department = ?, location = ?, work_type = ?,
           description = ?, requirements = ?, responsibilities = ?,
           salary_range = ?, selection_process = ?,
           required_documents_json = ?, status = ?, closing_date = ?
       WHERE vacancy_id = ?`,
      [
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
        vacancyId,
      ]
    );
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to update career vacancy status.', error);
    return Response.json({ error: 'Unable to update this vacancy right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await requireAdmin(request);
  if (isResponse(user)) return user;

  const { vacancyId } = await params;
  if (!vacancyIdSchema.safeParse(vacancyId).success) {
    return Response.json({ error: 'Invalid vacancy ID.' }, { status: 400 });
  }

  try {
    const [result] = await getMySqlPool().execute(
      `DELETE FROM career_vacancies WHERE vacancy_id = ?`,
      [vacancyId]
    );
    if (!('affectedRows' in result) || result.affectedRows === 0) {
      return Response.json({ error: 'Vacancy not found.' }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete career vacancy.', error);
    return Response.json({ error: 'Unable to delete this vacancy right now.' }, { status: 500 });
  }
}
