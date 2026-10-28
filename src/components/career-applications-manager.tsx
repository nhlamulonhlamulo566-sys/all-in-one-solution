'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Download, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ApplicationDocument = {
  document_id: string;
  document_type: string;
  original_name: string;
  file_size: number;
};

type Application = {
  application_id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  location: string;
  role_interest: string;
  availability: string;
  experience_summary: string;
  created_at: string;
  documents: ApplicationDocument[];
};

export default function CareerApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/careers', { cache: 'no-store' });
      const body = await response.json() as { applications?: Application[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Could not load applications.');
      setApplications(body.applications || []);
    } catch (loadError) {
      console.error('Unable to load career applications.', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function deleteApplication(applicationId: string) {
    if (!window.confirm('Permanently delete this application and all of its documents?')) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/careers/${applicationId}`, { method: 'DELETE' });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Could not delete the application.');
      setApplications((current) => current.filter((application) => application.application_id !== applicationId));
    } catch (deleteError) {
      console.error('Unable to delete career application.', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the application.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading applications…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}
      {applications.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No career applications have been received yet.</CardContent></Card>
      ) : applications.map((application) => (
        <Card key={application.application_id}>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{application.full_name}</h2>
                <p className="text-sm text-muted-foreground">{application.role_interest} · {application.location} · Available {application.availability}</p>
                <p className="mt-1 text-sm">
                  <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${application.email_address}`}>{application.email_address}</a>
                  {' · '}
                  <a className="text-primary underline-offset-4 hover:underline" href={`tel:${application.phone_number}`}>{application.phone_number}</a>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Received {new Date(application.created_at).toLocaleString()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void deleteApplication(application.application_id)}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete application
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{application.experience_summary}</p>
            <div className="flex flex-wrap gap-2">
              {application.documents.map((document) => (
                <Button key={document.document_id} asChild variant="secondary" size="sm">
                  <Link href={`/api/admin/careers/documents/${document.document_id}`}>
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    {document.document_type.replaceAll('_', ' ')} · {document.original_name} · {(document.file_size / 1024).toFixed(0)} KB
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
