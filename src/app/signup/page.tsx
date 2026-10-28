'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { useUser } from '@/auth/provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const signupFormSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name.').max(80),
  surname: z.string().trim().min(2, 'Enter your surname.').max(80),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  contactNumber: z.string().trim().min(7).max(25)
    .regex(/^[+()\d\s.-]+$/, 'Enter a valid contact number.'),
  workNumber: z.string().trim().min(7).max(25)
    .regex(/^[+()\d\s.-]+$/, 'Enter a valid work number.'),
  persalNumber: z.string().trim().min(1, 'Enter your PERSAL number.').max(32),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { user, isUserLoading, refreshUser } = useUser();
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      contactNumber: '',
      workNumber: '',
      persalNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) router.replace('/admin');
  }, [user, isUserLoading, router]);

  const onSubmit = (values: SignupFormValues) => {
    startTransition(async () => {
      setSignupError(null);
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(values),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error || 'Unable to create your account.');
        await refreshUser();
        router.replace('/admin');
      } catch (error) {
        setSignupError(error instanceof Error ? error.message : 'Unable to create your account.');
      }
    });
  };

  if (isUserLoading || user) return <p>Loading...</p>;

  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-primary/10 p-3">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Create a staff account</CardTitle>
          <CardDescription>
            New accounts receive staff access immediately. Complete all fields to register.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="persalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PERSAL number</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact number</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work number</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="work tel" {...field} />
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
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {signupError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {signupError}
                </p>
              )}
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary underline">Log in</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
