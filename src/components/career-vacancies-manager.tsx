'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, BriefcaseBusiness, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const documentOptions = [
  { value: 'cv', label: 'CV / résumé (always required)', alwaysRequired: true },
  { value: 'identity', label: 'Identity document', alwaysRequired: false },
  { value: 'qualification', label: 'Qualification certificates', alwaysRequired: false },
  { value: 'driversLicense', label: 'Driver’s licence', alwaysRequired: false },
  { value: 'other', label: 'Other supporting document', alwaysRequired: false },
] as const;

type Vacancy = {
  id: string;
  title: string;
  department: string;
  location: string;
  workType: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salaryRange: string;
  selectionProcess: string;
  requiredDocuments: string[];
  status: 'open' | 'closed';
  closingDate: string | null;
  applicationCount: number;
};

type VacancyForm = {
  title: string;
  department: string;
  location: string;
  workType: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salaryRange: string;
  selectionProcess: string;
  requiredDocuments: string[];
  status: 'open' | 'closed';
  closingDate: string;
};

const emptyForm: VacancyForm = {
  title: '',
  department: '',
  location: '',
  workType: 'Full-time',
  description: '',
  requirements: '',
  responsibilities: '',
  salaryRange: '',
  selectionProcess: 'Shortlisted applicants may be contacted for an interview or assessment. We will share any next steps directly.',
  requiredDocuments: ['cv'],
  status: 'open',
  closingDate: '',
};

export default function CareerVacanciesManager() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [form, setForm] = useState<VacancyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadVacancies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/careers/vacancies', { cache: 'no-store' });
      const body = await response.json() as { vacancies?: Vacancy[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to load vacancies.');
      setVacancies(body.vacancies || []);
    } catch (loadError) {
      console.error('Unable to load career vacancies.', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load vacancies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  function updateForm<K extends keyof VacancyForm>(key: K, value: VacancyForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editVacancy(vacancy: Vacancy) {
    setEditingId(vacancy.id);
    setForm({
      title: vacancy.title,
      department: vacancy.department,
      location: vacancy.location,
      workType: vacancy.workType,
      description: vacancy.description,
      requirements: vacancy.requirements,
      responsibilities: vacancy.responsibilities,
      salaryRange: vacancy.salaryRange,
      selectionProcess: vacancy.selectionProcess,
      requiredDocuments: [...new Set(['cv', ...vacancy.requiredDocuments])],
      status: vacancy.status,
      closingDate: vacancy.closingDate?.slice(0, 10) || '',
    });
    setNotice(null);
    document.getElementById('vacancy-editor')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function submitVacancy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        editingId ? `/api/admin/careers/vacancies/${editingId}` : '/api/admin/careers/vacancies',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to save vacancy.');
      setNotice(editingId ? 'Vacancy updated.' : 'Vacancy published.');
      setEditingId(null);
      setForm(emptyForm);
      await loadVacancies();
    } catch (saveError) {
      console.error('Unable to save career vacancy.', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save vacancy.');
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(vacancy: Vacancy) {
    const status = vacancy.status === 'open' ? 'closed' : 'open';
    try {
      const response = await fetch(`/api/admin/careers/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to update vacancy status.');
      await loadVacancies();
    } catch (updateError) {
      console.error('Unable to update career vacancy status.', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Unable to update vacancy.');
    }
  }

  async function deleteVacancy(vacancy: Vacancy) {
    if (!window.confirm(`Delete "${vacancy.title}"? Existing applications will be kept as general applications.`)) return;
    try {
      const response = await fetch(`/api/admin/careers/vacancies/${vacancy.id}`, { method: 'DELETE' });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to delete vacancy.');
      await loadVacancies();
    } catch (deleteError) {
      console.error('Unable to delete career vacancy.', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete vacancy.');
    }
  }

  return (
    <div className="space-y-8">
      <Card id="vacancy-editor">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {editingId ? 'Edit vacancy' : 'Post a vacancy'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Open roles appear publicly on the Careers page. Closed roles are hidden from applicants.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submitVacancy}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="vacancy-title" className="space-y-2 text-sm font-medium">Job title *
                <Input id="vacancy-title" required minLength={3} maxLength={160} value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="e.g. IT Support Technician" />
              </label>
              <label htmlFor="vacancy-department" className="space-y-2 text-sm font-medium">Department / team *
                <Input id="vacancy-department" required minLength={2} maxLength={120} value={form.department} onChange={(event) => updateForm('department', event.target.value)} placeholder="e.g. Digital & Technology" />
              </label>
              <label htmlFor="vacancy-location" className="space-y-2 text-sm font-medium">Location *
                <Input id="vacancy-location" required minLength={2} maxLength={160} value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="e.g. Johannesburg or Remote" />
              </label>
              <label htmlFor="vacancy-work-type" className="space-y-2 text-sm font-medium">Employment type *
                <select id="vacancy-work-type" value={form.workType} onChange={(event) => updateForm('workType', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label htmlFor="vacancy-description" className="space-y-2 text-sm font-medium sm:col-span-2">Role overview *
                <Textarea id="vacancy-description" required minLength={20} maxLength={5000} rows={5} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Describe the role, responsibilities, and the impact this person will have." />
              </label>
              <label htmlFor="vacancy-requirements" className="space-y-2 text-sm font-medium sm:col-span-2">Requirements *
                <Textarea id="vacancy-requirements" required minLength={10} maxLength={5000} rows={5} value={form.requirements} onChange={(event) => updateForm('requirements', event.target.value)} placeholder="List essential skills, experience, qualifications, and any role-specific requirements." />
              </label>
              <label htmlFor="vacancy-responsibilities" className="space-y-2 text-sm font-medium sm:col-span-2">Key responsibilities *
                <Textarea id="vacancy-responsibilities" required minLength={20} maxLength={5000} rows={5} value={form.responsibilities} onChange={(event) => updateForm('responsibilities', event.target.value)} placeholder="List the main duties and what a successful person will do in this role." />
              </label>
              <label htmlFor="vacancy-salary" className="space-y-2 text-sm font-medium">Salary / pay range
                <Input id="vacancy-salary" maxLength={120} value={form.salaryRange} onChange={(event) => updateForm('salaryRange', event.target.value)} placeholder="e.g. R18,000–R24,000 per month, or Negotiable" />
                <span className="block text-xs font-normal text-muted-foreground">Optional, but sharing a realistic range helps applicants make informed decisions.</span>
              </label>
              <label htmlFor="vacancy-selection-process" className="space-y-2 text-sm font-medium sm:col-span-2">What applicants can expect *
                <Textarea id="vacancy-selection-process" required minLength={10} maxLength={2000} rows={3} value={form.selectionProcess} onChange={(event) => updateForm('selectionProcess', event.target.value)} placeholder="Explain likely interview or assessment steps and how shortlisted candidates will hear from you." />
              </label>
              <label htmlFor="vacancy-deadline" className="space-y-2 text-sm font-medium">Application deadline
                <Input id="vacancy-deadline" type="date" min={new Date().toISOString().slice(0, 10)} value={form.closingDate} onChange={(event) => updateForm('closingDate', event.target.value)} />
              </label>
              <label htmlFor="vacancy-status" className="space-y-2 text-sm font-medium">Publishing status
                <select id="vacancy-status" value={form.status} onChange={(event) => updateForm('status', event.target.value as VacancyForm['status'])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="open">Open — publish on Careers page</option>
                  <option value="closed">Closed — keep hidden</option>
                </select>
              </label>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Documents applicants must submit</legend>
              <p className="text-xs text-muted-foreground">A CV is required. Request an identity document only when genuinely necessary, preferably later in the selection process. Select qualifications and other documents only when relevant to this role.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {documentOptions.map(({ value, label, alwaysRequired }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.requiredDocuments.includes(value)}
                      disabled={alwaysRequired}
                      onChange={(event) => updateForm(
                        'requiredDocuments',
                        event.target.checked
                          ? [...form.requiredDocuments, value]
                          : form.requiredDocuments.filter((item) => item !== value)
                      )}
                      name={`required-document-${value}`}
                      className="h-4 w-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p role="alert" className="flex gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
            {notice && <p role="status" className="text-sm font-medium text-primary">{notice}</p>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : editingId ? 'Save changes' : 'Publish vacancy'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel editing</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="managed-vacancies-heading">
        <div>
          <h2 id="managed-vacancies-heading" className="text-xl font-semibold">Posted vacancies</h2>
          <p className="text-sm text-muted-foreground">Manage live listings and review application counts.</p>
        </div>
        {loading ? <p className="py-6 text-sm text-muted-foreground">Loading vacancies…</p> : vacancies.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No vacancies posted yet. Use the form above to create your first listing.</CardContent></Card>
        ) : vacancies.map((vacancy) => (
          <Card key={vacancy.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{vacancy.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vacancy.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>{vacancy.status === 'open' ? 'Open' : 'Closed'}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{vacancy.department} · {vacancy.location} · {vacancy.workType}</p>
                <p className="mt-1 text-xs text-muted-foreground">{vacancy.applicationCount} application{vacancy.applicationCount === 1 ? '' : 's'}{vacancy.closingDate ? ` · Deadline ${vacancy.closingDate}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => editVacancy(vacancy)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => void toggleStatus(vacancy)}>{vacancy.status === 'open' ? 'Close listing' : 'Reopen listing'}</Button>
                <Button size="sm" variant="destructive" onClick={() => void deleteVacancy(vacancy)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
