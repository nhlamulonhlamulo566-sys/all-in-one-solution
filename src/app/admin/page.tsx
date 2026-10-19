import LeadsDashboard from '@/components/leads-dashboard';
import StaffRoute from '@/components/staff-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <StaffRoute>
      <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Staff workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Customer enquiries
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Keep up with every quotation request, call-back request, and
              customer message in one place.
            </p>
          </div>
          <Card className="sm:max-w-xs">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">
                Live lead overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground">
              Data refreshes automatically when a request is submitted.
            </CardContent>
          </Card>
        </div>
        <LeadsDashboard />
      </div>
    </StaffRoute>
  );
}

export const metadata = {
  title: 'Customer Enquiries | All In One Solution',
  description: 'Live staff dashboard for customer quote and call-back requests.',
};
