import { redirect } from 'next/navigation';

export default function AdminSubmissionsPage() {
  redirect('/admin');
}

export const metadata = {
  title: 'Contact Form Submissions | All In One Solution',
  description: 'View and manage contact form submissions.',
};
