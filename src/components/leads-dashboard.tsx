'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Activity,
  ArrowUpRight,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/auth/provider';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Lead = {
  request_id: number;
  request_type: 'quote' | 'callback' | 'message';
  full_name: string;
  email_address: string;
  phone_number: string | null;
  service_name: string | null;
  message: string;
  status: 'new' | 'contacted' | 'completed';
  created_at: string;
};

type ActivityRow = {
  day: string;
  request_type: Lead['request_type'];
  total: number;
};

type LeadsResponse = {
  leads: Lead[];
  counts: Array<{ request_type: Lead['request_type']; total: number }>;
  activity: ActivityRow[];
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadsDashboard() {
  const { user } = useUser();
  const [snapshot, setSnapshot] = useState<LeadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    try {
      const response = await fetch('/api/staff/leads', {
        cache: 'no-store',
        signal,
      });
      const body = (await response.json()) as LeadsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'Unable to load customer requests.');
      }
      setSnapshot(body);
      setError(null);
    } catch (requestError) {
      if (signal?.aborted) return;
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load customer requests.';
      setError(message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = window.setInterval(() => {
      void refresh(controller.signal);
    }, 15000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refresh]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 13 + index);
      const day = format(date, 'yyyy-MM-dd');
      return {
        day,
        date: format(date, 'MMM d'),
        quotations: 0,
        callbacks: 0,
        messages: 0,
      };
    });

    for (const activity of snapshot?.activity ?? []) {
      const day = days.find((entry) => entry.day === activity.day);
      if (!day) continue;
      if (activity.request_type === 'quote') day.quotations = Number(activity.total);
      if (activity.request_type === 'callback') day.callbacks = Number(activity.total);
      if (activity.request_type === 'message') day.messages = Number(activity.total);
    }

    return days;
  }, [snapshot]);

  const counts = useMemo(() => {
    const totals = { quote: 0, callback: 0, message: 0 };
    for (const row of snapshot?.counts ?? []) {
      totals[row.request_type] = Number(row.total);
    }
    return totals;
  }, [snapshot]);

  if (isLoading && !snapshot) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-destructive">
          <p>Unable to load customer requests: {error}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void refresh();
            }}
            className="text-sm font-medium underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const leads = snapshot?.leads ?? [];
  const total = counts.quote + counts.callback + counts.message;

  return (
    <div className="space-y-6">
      {error && (
        <p role="status" className="text-sm text-destructive">
          Refresh failed: {error}. Retrying automatically.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total requests"
          value={total}
          description="All customer enquiries"
          icon={Users}
        />
        <StatCard
          title="Quotation requests"
          value={counts.quote}
          description="Customers asking for pricing"
          icon={FileText}
        />
        <StatCard
          title="Call backs"
          value={counts.callback}
          description="Customers waiting for a call"
          icon={PhoneCall}
        />
        <StatCard
          title="Messages"
          value={counts.message}
          description="General contact enquiries"
          icon={MessageSquare}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live enquiry activity
            </CardTitle>
            <CardDescription className="mt-2">
              Quotations, call backs, and messages over the last 14 days.
              Dashboard data refreshes automatically every 15 seconds.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="quotations" name="Quotations" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="callbacks" name="Call backs" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="messages" name="Messages" stroke="#9333ea" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Quotations
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              Call backs
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
              Messages
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Recent customer requests</CardTitle>
            <CardDescription className="mt-2">
              Contact details and what each customer is asking for.
            </CardDescription>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View contact page <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Your lead inbox is ready</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quote and call-back requests appear here after customers submit
                their contact details.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => {
                const label =
                  lead.request_type === 'quote'
                    ? 'Quotation'
                    : lead.request_type === 'callback'
                      ? 'Call back'
                      : 'Message';
                const submittedAt = parseISO(lead.created_at);

                return (
                  <article
                    key={lead.request_id}
                    className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{lead.full_name}</h3>
                        <Badge variant="secondary">{label}</Badge>
                        {lead.service_name && (
                          <Badge variant="outline">{lead.service_name}</Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <a
                          href={`mailto:${lead.email_address}`}
                          className="inline-flex items-center gap-2 hover:text-primary"
                        >
                          <Mail className="h-4 w-4" />
                          {lead.email_address}
                        </a>
                        {lead.phone_number && (
                          <a
                            href={`tel:${lead.phone_number}`}
                            className="inline-flex items-center gap-2 hover:text-primary"
                          >
                            <Phone className="h-4 w-4" />
                            {lead.phone_number}
                          </a>
                        )}
                        {lead.request_type === 'callback' && lead.phone_number && (
                          <a
                            href={`tel:${lead.phone_number}`}
                            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                          >
                            <PhoneCall className="h-4 w-4" />
                            Call customer
                          </a>
                        )}
                      </div>
                      {lead.message && (
                        <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
                          {lead.message}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-sm text-muted-foreground">
                      {format(submittedAt, 'MMM d, yyyy · h:mm a')}
                    </time>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
