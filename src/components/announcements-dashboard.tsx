'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from './ui/skeleton';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(200),
  category: z.string().min(2, 'Category must be at least 2 characters.').max(100),
  content: z.string().min(20, 'Content must be at least 20 characters.').max(10000),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

type Announcement = {
  announcement_id: string;
  title: string;
  created_at: string;
  category: string;
  content: string;
};

type AnnouncementsResponse = {
  announcements: Announcement[];
  error?: string;
};

export default function AnnouncementsDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', category: '', content: '' },
  });

  const loadAnnouncements = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setError('Sign in with an authorized staff account to manage announcements.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/staff/announcements', {
        cache: 'no-store',
        signal,
      });
      const body = (await response.json()) as AnnouncementsResponse;
      if (!response.ok) throw new Error(body.error || 'Unable to load announcements.');
      setAnnouncements(body.announcements);
      setError(null);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load announcements.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    void loadAnnouncements(controller.signal);
    return () => controller.abort();
  }, [loadAnnouncements]);

  const onSubmit = async (values: AnnouncementFormValues) => {
    if (!user) return;
    try {
      const response = await fetch('/api/staff/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to publish announcement.');
      toast({
        title: 'Announcement Added',
        description: 'The new announcement has been published successfully.',
      });
      form.reset();
      setIsFormOpen(false);
      await loadAnnouncements();
    } catch (submitError) {
      toast({
        title: 'Announcement not published',
        description: submitError instanceof Error ? submitError.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/staff/announcements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to remove announcement.');
      toast({
        title: 'Announcement Removed',
        description: 'The announcement is no longer shown publicly.',
        variant: 'destructive',
      });
      await loadAnnouncements();
    } catch (deleteError) {
      toast({
        title: 'Announcement not removed',
        description: deleteError instanceof Error ? deleteError.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2" />
          Add New Announcement
        </Button>
      )}

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>New Announcement</CardTitle>
            <CardDescription>
              Create a new announcement to be displayed on the website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Announcing our new service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New Service, Partnership" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write the full announcement here..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    Publish Announcement
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Published Announcements</h3>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {error && <p className="text-destructive">Error loading announcements: {error}</p>}
        {!isLoading && !error && announcements?.length === 0 && (
          <p className="text-muted-foreground">No announcements published yet.</p>
        )}
        {announcements?.map((announcement) => (
          <Card key={announcement.announcement_id} className="flex items-center p-4">
            <div className="flex-grow">
              <h4 className="font-semibold">{announcement.title}</h4>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(announcement.created_at), 'PPP')} -{' '}
                <span className="capitalize">{announcement.category}</span>
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Remove ${announcement.title}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will hide the announcement titled &quot;{announcement.title}&quot; from the public website.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDelete(announcement.announcement_id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ))}
      </div>
    </div>
  );
}
