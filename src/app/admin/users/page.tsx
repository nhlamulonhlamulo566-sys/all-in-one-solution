import AdminRoute from '@/components/admin-route';
import AdminUsersManager from '@/components/admin-users-manager';

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="text-3xl font-bold tracking-tight">Team &amp; access</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create accounts, assign staff permissions, and manage administrator access from one place.
          </p>
        </header>
        <AdminUsersManager />
      </div>
    </AdminRoute>
  );
}

export const metadata = {
  title: 'Team & Access | All In One Solution',
  description: 'Manage account roles and staff access.',
};
