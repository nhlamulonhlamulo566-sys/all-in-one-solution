'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AboutContent = {
  heading: string;
  description: string;
};

export default function AboutContentEditor() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadContent() {
      try {
        const response = await fetch('/api/site-content/about', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const body = (await response.json()) as AboutContent & { error?: string };
        if (!response.ok) throw new Error(body.error || 'Unable to load About page content.');
        setContent({ heading: body.heading, description: body.description });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load About page content.'
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadContent();
    return () => controller.abort();
  }, []);

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/site-content/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const body = (await response.json()) as AboutContent & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to save About page content.');
      setContent({ heading: body.heading, description: body.description });
      setNotice('The About page leadership section has been updated.');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save About page content.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit the About page section</CardTitle>
        <CardDescription>
          Update the heading and introduction shown on the public About page.
          Add only real, approved leadership details; this editor does not
          invent names or biographies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading saved content…</p>
        ) : error && !content ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : content ? (
          <form onSubmit={saveContent} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="about-heading" className="text-sm font-medium">
                Section heading
              </label>
              <Input
                id="about-heading"
                value={content.heading}
                maxLength={120}
                required
                onChange={(event) =>
                  setContent({ ...content, heading: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="about-description" className="text-sm font-medium">
                Introduction
              </label>
              <textarea
                id="about-description"
                value={content.description}
                maxLength={2000}
                required
                rows={5}
                onChange={(event) =>
                  setContent({ ...content, description: event.target.value })
                }
                className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save About page content'}
            </Button>
          </form>
        ) : (
          <p role="alert" className="text-sm text-destructive">
            About page content could not be loaded.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
