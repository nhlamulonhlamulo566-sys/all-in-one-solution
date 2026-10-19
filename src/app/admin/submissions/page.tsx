import LeadsDashboard from '@/components/leads-dashboard';
import StaffRoute from '@/components/staff-route';

export default function AdminSubmissionsPage() {
  return (
    <StaffRoute>
      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">Staff workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Contact and call-back submissions
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review, assign, and record outcomes for customer messages and call-back requests.
          </p>
        </div>
        <LeadsDashboard requestTypes={['message', 'callback']} />
      </div>
    </StaffRoute>
  );
}

export const metadata = {
  title: 'Contact Form Submissions | All In One Solution',
  description: 'View and manage contact form submissions and call-back requests.',
};
