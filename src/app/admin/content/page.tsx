import AdminRoute from '@/components/admin-route';
import AboutContentEditor from '@/components/about-content-editor';
import { FilePenLine } from 'lucide-react';

export default function AdminContentPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <FilePenLine className="h-7 w-7 text-primary" />
            Public page content
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage the About page introduction and the names, titles, and photos shown in its leadership section.
          </p>
        </header>
        <AboutContentEditor />
      </div>
    </AdminRoute>
  );
}

export const metadata = {
  title: 'Public Page Content | All In One Solution',
  description: 'Manage content displayed on the public About page.',
};
