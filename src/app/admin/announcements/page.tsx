import AnnouncementsDashboard from '@/components/announcements-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import PrivateRoute from '@/components/private-route';

export default function AdminAnnouncementsPage() {
  return (
    <PrivateRoute>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Megaphone className="w-6 h-6 text-primary" />
              Manage Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Add, view, and delete company announcements. The changes will be
              reflected on the public announcements page.
            </p>
            <AnnouncementsDashboard />
          </CardContent>
        </Card>
      </div>
    </PrivateRoute>
  );
}

export const metadata = {
  title: 'Manage Announcements | All In One Solution',
  description: 'Add, edit, and delete company announcements.',
};
