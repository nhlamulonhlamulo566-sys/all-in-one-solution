import type { RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

export const runtime = 'nodejs';

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
  closing_date: string | null;
}

export async function GET() {
  try {
    const [rows] = await getMySqlPool().execute<VacancyRow[]>(
      `SELECT vacancy_id, title, department, location, work_type,
              description, requirements, responsibilities, salary_range,
              selection_process, required_documents_json, closing_date
       FROM career_vacancies
       WHERE status = 'open'
         AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
       ORDER BY created_at DESC
       LIMIT 50`
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
        closingDate: row.closing_date,
      })),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to load open career vacancies.', error);
    return Response.json({ error: 'Unable to load open opportunities right now.' }, { status: 500 });
  }
}
