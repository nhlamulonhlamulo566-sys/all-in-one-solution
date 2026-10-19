'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth, useUser } from '@/auth/provider';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { isAdministratorRole, isStaffRole } from '@/lib/roles';

export default function AuthButton({
  onAction,
}: {
  onAction?: () => void;
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
    return (
      <>
        {isStaffRole(user.role) && (
          <>
            <Button asChild variant="ghost">
              <Link href="/admin" onClick={onAction}>Lead Dashboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/chat" onClick={onAction}>Admin Chat</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/submissions" onClick={onAction}>Submissions</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/quotations" onClick={onAction}>Quotations</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/announcements" onClick={onAction}>Announcements</Link>
            </Button>
          </>
        )}
        {isAdministratorRole(user.role) && (
          <Button asChild variant="ghost">
            <Link href="/admin/users" onClick={onAction}>Team &amp; Access</Link>
          </Button>
        )}
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </>
    );
  }

  return (
    <Button asChild>
      <Link href="/login" onClick={onAction}>Staff Login</Link>
    </Button>
  );
}
