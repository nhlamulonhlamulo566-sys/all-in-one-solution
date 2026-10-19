'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useUser } from '@/auth/provider';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';

const loginFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading, refreshUser } = useUser();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!isUserLoading && user) router.replace('/admin');
  }, [user, isUserLoading, router]);

  const onSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      setAuthError(null);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(values),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error || 'Unable to sign in.');
        await refreshUser();
        router.replace('/admin');
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Unable to sign in.');
      }
    });
  };

  if (isUserLoading || user) return <p>Loading...</p>;

  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-primary/10 p-3">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Staff Login</CardTitle>
          <CardDescription>
            Authorized staff and administrators can sign in here. Public
            visitors can use the rest of the site without an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {authError}
                </p>
              )}
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Logging In...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
