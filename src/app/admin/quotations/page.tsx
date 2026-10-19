import LeadsDashboard from '@/components/leads-dashboard';
import StaffRoute from '@/components/staff-route';

export default function AdminQuotationsPage() {
  return (
    <StaffRoute>
      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">Staff workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Quotation requests
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review pricing enquiries, take ownership, and record resolution or escalation details.
          </p>
        </div>
        <LeadsDashboard requestTypes={['quote']} />
      </div>
    </StaffRoute>
  );
}

export const metadata = {
  title: 'Quotation Requests | All In One Solution',
  description: 'View and manage office supply quotation requests.',
};
