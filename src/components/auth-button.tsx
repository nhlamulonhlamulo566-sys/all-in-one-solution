'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth, useUser } from '@/auth/provider';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { isAdministratorRole, isStaffRole } from '@/lib/roles';
import { ChevronDown } from 'lucide-react';

export default function AuthButton({
  onAction,
  compact = false,
  showStaffLinks = true,
}: {
  onAction?: () => void;
  compact?: boolean;
  showStaffLinks?: boolean;
} = {}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onAction?.();
      router.push('/login');
    } catch (error) {
      console.error('Unable to sign out.', error);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (user) {
    const adminLinks = isStaffRole(user.role)
      ? [
          { href: '/admin', label: 'Lead Dashboard' },
          { href: '/admin/chat', label: 'Admin Chat' },
          { href: '/admin/submissions', label: 'Submissions' },
          { href: '/admin/quotations', label: 'Quotations' },
          { href: '/admin/announcements', label: 'Announcements' },
          ...(isAdministratorRole(user.role)
            ? [
                { href: '/admin/careers', label: 'Career Applications' },
              { href: '/admin/careers/vacancies', label: 'Manage Vacancies' },
              { href: '/admin/content', label: 'Public Page Content' },
                { href: '/admin/users', label: 'Team & Access' },
              ]
            : []),
        ]
      : [];

    if (compact) {
      return (
        <>
          {showStaffLinks && adminLinks.length > 0 && (
            <details className="group relative">
              <summary className="flex h-10 cursor-pointer list-none items-center rounded-md px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                Staff tools
                <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4" />
              </summary>
              <nav
                aria-label="Staff tools"
                className="absolute right-0 top-full z-50 mt-2 flex min-w-52 flex-col rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {adminLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onAction}
                    className="rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </details>
          )}
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </>
      );
    }

    return (
      <>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
        {showStaffLinks && isStaffRole(user.role) && (
          <>
            {adminLinks.slice(0, 5).map(({ href, label }) => (
              <Button asChild variant="ghost" key={href}>
                <Link href={href} onClick={onAction}>{label}</Link>
              </Button>
            ))}
          </>
        )}
        {showStaffLinks && isAdministratorRole(user.role) && adminLinks.slice(5).map(({ href, label }) => (
          <Button asChild variant="ghost" key={href}>
            <Link href={href} onClick={onAction}>{label}</Link>
          </Button>
        ))}
      </>
    );
  }

  return null;
}
