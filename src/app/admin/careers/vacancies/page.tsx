import type { Metadata } from 'next';
import AdminRoute from '@/components/admin-route';
import CareerVacanciesManager from '@/components/career-vacancies-manager';

export default function AdminCareerVacanciesPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Private recruitment workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Manage vacancies</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create a clear job post, choose the documents needed for that role, and publish or close the listing on the public Careers page.
          </p>
        </header>
        <CareerVacanciesManager />
      </div>
    </AdminRoute>
  );
}

export const metadata: Metadata = {
  title: 'Manage Vacancies | All In One Solution',
  description: 'Create and manage public career vacancy listings.',
};
