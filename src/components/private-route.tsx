'use client';

import { useUser } from '@/auth/provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <p>Loading...</p>; // Or a spinner component
  }

  return <>{children}</>;
}
