'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';

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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAnnouncements() {
      try {
        const response = await fetch('/api/announcements', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const body = (await response.json()) as AnnouncementsResponse;
        if (!response.ok) throw new Error(body.error || 'Unable to load announcements.');
        setAnnouncements(body.announcements);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load announcements.'
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadAnnouncements();
    return () => controller.abort();
  }, []);

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <section className="text-center mb-16">
        <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
          <Megaphone className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          News & Announcements
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto break-words">
          Stay up-to-date with the latest company news, product launches, and
          important updates from All In One Solution.
        </p>
      </section>

      <div className="space-y-8 max-w-4xl mx-auto">
        {isLoading && (
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
        {error && (
          <p className="text-destructive text-center">
            Error loading announcements: {error}
          </p>
        )}
        {!isLoading && announcements && announcements.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            <p>No announcements at the moment. Check back soon!</p>
          </div>
        )}
        {announcements &&
          announcements.map((announcement) => (
            <Card
              key={announcement.announcement_id}
              className="transition-all duration-300 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-4">
                  <div className="flex-grow">
                    <Badge variant="secondary" className="mb-2 capitalize">
                      {announcement.category}
                    </Badge>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      {announcement.title}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground flex-shrink-0 pt-1">
                    {format(parseISO(announcement.created_at), 'PPP')}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
