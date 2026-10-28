import type { Metadata } from 'next';
import AdminRoute from '@/components/admin-route';
import CareerApplicationsManager from '@/components/career-applications-manager';

export default function AdminCareersPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Private recruitment workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Career applications</h1>
          <p className="max-w-2xl text-muted-foreground">
            Review applicants and download their documents. Access is restricted to administrators; delete applications when they are no longer needed.
          </p>
        </header>
        <CareerApplicationsManager />
      </div>
    </AdminRoute>
  );
}

export const metadata: Metadata = {
  title: 'Career Applications | All In One Solution',
  description: 'Privately review career applications and supporting documents.',
};
