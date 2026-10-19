'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Upload } from 'lucide-react';

type LeadershipMember = {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageData: string | null;
};

type AboutContent = {
  heading: string;
  description: string;
  members: LeadershipMember[];
};

const MAX_PHOTO_BYTES = 120 * 1024;
const MAX_TOTAL_CONTENT_BYTES = 700 * 1024;
const MAX_MEMBERS = 6;

async function compressPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 10 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = document.createElement('img');
    image.src = objectUrl;
    await image.decode();
    if (
      image.naturalWidth === 0
      || image.naturalHeight === 0
      || image.naturalWidth * image.naturalHeight > 40_000_000
    ) {
      throw new Error('Choose a valid image smaller than 40 megapixels.');
    }
    const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not process the selected image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let blob: Blob | null = null;
    for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= MAX_PHOTO_BYTES) break;
    }
    if (!blob || blob.size > MAX_PHOTO_BYTES) {
      throw new Error('This image could not be compressed below 120 KiB. Choose a smaller image.');
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Unable to read the processed image.'));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error('Unable to read the processed image.'));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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
        setContent({
          heading: body.heading,
          description: body.description,
          members: body.members ?? [],
        });
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
      setContent({
        heading: body.heading,
        description: body.description,
        members: body.members,
      });
      setNotice('The About page content and leadership profiles have been updated.');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save About page content.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateMember(id: string, changes: Partial<LeadershipMember>) {
    if (!content) return;
    setContent({
      ...content,
      members: content.members.map((member) =>
        member.id === id ? { ...member, ...changes } : member
      ),
    });
  }

  async function uploadPhoto(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    try {
      const imageData = await compressPhoto(file);
      if (!content) return;
      const members = content.members.map((member) =>
        member.id === id ? { ...member, imageData } : member
      );
      if (new TextEncoder().encode(JSON.stringify(members)).byteLength > MAX_TOTAL_CONTENT_BYTES) {
        throw new Error('The combined profile photos are too large. Use smaller photos.');
      }
      setContent({ ...content, members });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Unable to process the selected image.'
      );
    }
  }

  function addMember() {
    if (!content || content.members.length >= MAX_MEMBERS) return;
    setContent({
      ...content,
      members: [
        ...content.members,
        { id: crypto.randomUUID(), name: '', position: '', bio: '', imageData: null },
      ],
    });
  }

  function removeMember(id: string) {
    if (!content) return;
    setContent({
      ...content,
      members: content.members.filter((member) => member.id !== id),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit the About page section</CardTitle>
        <CardDescription>
        Update the heading, introduction, and leadership profiles displayed on the public About page.
        Add only real, approved people and titles. Photos are resized and stored in the app database.
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
            <section className="space-y-4 border-t pt-5" aria-labelledby="leadership-profiles-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 id="leadership-profiles-title" className="font-semibold">Leadership profiles</h3>
                  <p className="text-sm text-muted-foreground">
                    Add up to six people. Photos are JPEGs up to 120 KiB each; all profile photos together are limited to 700 KiB.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMember}
                  disabled={content.members.length >= MAX_MEMBERS}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add profile
                </Button>
              </div>
              {content.members.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  No leadership profiles yet. Add real team members when their names and positions are approved.
                </p>
              ) : (
                <div className="space-y-4">
                  {content.members.map((member, index) => (
                    <div key={member.id} className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_auto]">
                      <div className="grid gap-4 sm:grid-cols-[112px_1fr]">
                        <div className="space-y-2">
                          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
                            {member.imageData ? (
                              <img src={member.imageData} alt={`Preview of ${member.name || 'team member'}`} className="h-full w-full object-cover" />
                            ) : (
                              <span aria-hidden="true">{member.name.trim().charAt(0).toUpperCase() || '?'}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <label className="inline-flex cursor-pointer items-center text-sm font-medium text-primary hover:underline">
                              <Upload className="mr-2 h-4 w-4" />
                              {member.imageData ? 'Change photo' : 'Add photo'}
                              <input
                                className="sr-only"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                aria-label={`Upload photo for profile ${index + 1}`}
                                onChange={(event) => void uploadPhoto(member.id, event)}
                              />
                            </label>
                            {member.imageData && (
                              <button
                                type="button"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                                onClick={() => updateMember(member.id, { imageData: null })}
                              >
                                Remove photo
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid content-start gap-3">
                          <div className="space-y-1.5">
                            <label htmlFor={`leader-name-${member.id}`} className="text-sm font-medium">Name</label>
                            <Input
                              id={`leader-name-${member.id}`}
                              value={member.name}
                              maxLength={100}
                              minLength={2}
                              required
                              onChange={(event) => updateMember(member.id, { name: event.target.value })}
                              placeholder="Team member name"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor={`leader-position-${member.id}`} className="text-sm font-medium">Position / professional title</label>
                            <Input
                              id={`leader-position-${member.id}`}
                              value={member.position}
                              maxLength={100}
                              minLength={2}
                              required
                              onChange={(event) => updateMember(member.id, { position: event.target.value })}
                              placeholder="e.g. Founder & Managing Director"
                            />
                            <p className="text-xs text-muted-foreground">
                              Other fitting titles may include Technology & Digital Solutions Lead, Creative & Design Lead, or Business Operations & Client Services Lead.
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor={`leader-bio-${member.id}`} className="text-sm font-medium">Short introduction <span className="font-normal text-muted-foreground">(optional)</span></label>
                            <textarea
                              id={`leader-bio-${member.id}`}
                              value={member.bio}
                              maxLength={400}
                              rows={3}
                              onChange={(event) => updateMember(member.id, { bio: event.target.value })}
                              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              placeholder="A brief, approved professional introduction"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member.id)}
                        aria-label={`Remove profile ${member.name || index + 1}`}
                        className="justify-self-end text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
