import { redirect } from 'next/navigation';

export default function AdminQuotationsPage() {
  redirect('/admin');
}

export const metadata = {
  title: 'Quotation Requests | All In One Solution',
  description: 'View and manage office supply quotation requests.',
};

    