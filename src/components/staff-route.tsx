'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/auth/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { isStaffRole } from '@/lib/roles';

export default function StaffRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  if (isUserLoading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return null;

  if (!isStaffRole(user.role)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Staff access needed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Your account is signed in, but it is not set up for the staff
              dashboard yet. Ask a database administrator to assign your MySQL
              account the staff role.
            </p>
            <p className="text-sm">
              The role is managed by a super administrator. Public visitors do
              not need an account to use the site.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
