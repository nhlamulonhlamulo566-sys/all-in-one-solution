'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, FileText, LockKeyhole, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const supportingDocuments = [
  { name: 'identity', label: 'Identity document', detail: 'Only when genuinely needed, preferably after shortlisting' },
  { name: 'qualification', label: 'Qualification certificates', detail: 'If relevant to this role or requested in the advert' },
  { name: 'driversLicense', label: 'Driver’s licence', detail: 'Only if driving is a requirement' },
  { name: 'other', label: 'Other supporting document', detail: 'For example, a portfolio or work sample' },
] as const;

type VacancyOption = {
  id: string;
  title: string;
  department: string;
  requiredDocuments: string[];
};

function FilePicker({
  id,
  name,
  label,
  description,
  required = false,
  accept,
  file,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  required?: boolean;
  accept: string;
  file?: File;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Upload className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            {label}{' '}
            {required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optional)</span>}
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
          <span className="mt-2 flex items-center gap-2 text-sm text-primary">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{file?.name || 'Choose a file'}</span>
          </span>
        </span>
      </label>
      <Input
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0])}
      />
    </div>
  );
}

export default function CareerApplicationForm() {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [vacancies, setVacancies] = useState<VacancyOption[]>([]);
  const [vacancyId, setVacancyId] = useState('');
  const [roleInterest, setRoleInterest] = useState('General application');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/careers/vacancies')
      .then(async (response) => {
        const body = await response.json() as { vacancies?: VacancyOption[] };
        if (response.ok) setVacancies(body.vacancies || []);
      })
      .catch((error: unknown) => console.error('Unable to load vacancies for the application form.', error));

    const handleVacancySelection = (event: Event) => {
      const vacancy = (event as CustomEvent<VacancyOption>).detail;
      if (!vacancy) return;
      setVacancyId(vacancy.id);
      setRoleInterest(vacancy.title);
    };
    window.addEventListener('career-vacancy-select', handleVacancySelection);
    return () => window.removeEventListener('career-vacancy-select', handleVacancySelection);
  }, []);

  const selectedVacancy = vacancies.find((vacancy) => vacancy.id === vacancyId);
  const requiredDocuments = new Set(['cv', ...(selectedVacancy?.requiredDocuments || [])]);

  const setFile = (name: string, file: File | undefined) => {
    setFiles((current) => ({ ...current, [name]: file }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedFiles = Object.values(files).filter((file): file is File => Boolean(file));
    const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

    if (selectedFiles.some((file) => file.size > 2_000_000)) {
      setResult({ success: false, message: 'Each document must be no larger than 2 MB.' });
      return;
    }
    if (totalSize > 3_500_000) {
      setResult({ success: false, message: 'Keep all attached documents within the 3.5 MB combined upload limit.' });
      return;
    }

    setPending(true);
    setResult(null);
    try {
      const response = await fetch('/api/careers', {
        method: 'POST',
        body: data,
      });
      const body = await response.json() as { message?: string; error?: string };
      if (!response.ok) {
        setResult({ success: false, message: body.error || 'We could not submit your application. Please try again.' });
        return;
      }
      setResult({
        success: true,
        message: body.message || 'Thank you. Your application has been received.',
      });
      form.reset();
      setFiles({});
      setVacancyId('');
      setRoleInterest('General application');
    } catch (error) {
      console.error('Unable to submit the career application.', error);
      setResult({ success: false, message: 'We could not reach the application service. Please try again shortly.' });
    } finally {
      setPending(false);
    }
  }

  if (result?.success) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-semibold">Application received</h3>
          <p className="mt-2 max-w-lg text-muted-foreground">{result.message}</p>
          <Button className="mt-6" variant="outline" onClick={() => setResult(null)}>
            Submit another application
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">1</span>
            Your details
          </CardTitle>
          <p className="text-sm text-muted-foreground">Tell us how to reach you and where you would like to contribute.</p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">Full name <span className="text-destructive">*</span></label>
            <Input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={160} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email address <span className="text-destructive">*</span></label>
            <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone number <span className="text-destructive">*</span></label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40} placeholder="Your contact number" />
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">Town / city <span className="text-destructive">*</span></label>
            <Input id="location" name="location" autoComplete="address-level2" required minLength={2} maxLength={160} placeholder="Where are you based?" />
          </div>
          <div className="space-y-2">
            <label htmlFor="vacancyId" className="text-sm font-medium">Role you&apos;re applying for <span className="text-destructive">*</span></label>
            <select
              id="vacancyId"
              name="vacancyId"
              value={vacancyId}
              onChange={(event) => {
                const selected = vacancies.find((vacancy) => vacancy.id === event.target.value);
                setVacancyId(event.target.value);
                setRoleInterest(selected?.title || 'General application');
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">General expression of interest</option>
              {vacancies.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>
              ))}
            </select>
            <input type="hidden" name="roleInterest" value={roleInterest} />
          </div>
          <div className="space-y-2">
            <label htmlFor="availability" className="text-sm font-medium">Availability <span className="text-destructive">*</span></label>
            <Input id="availability" name="availability" required maxLength={120} placeholder="e.g. Immediately, or from 1 September" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="experienceSummary" className="text-sm font-medium">Your introduction <span className="text-destructive">*</span></label>
            <Textarea id="experienceSummary" name="experienceSummary" required minLength={30} maxLength={5000} rows={6} placeholder="In a few paragraphs, tell us what you do well, the experience or skills you would bring, and the kind of opportunity you are looking for." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">2</span>
            Your CV and supporting documents
          </CardTitle>
          <p className="text-sm text-muted-foreground">Attach your CV and any supporting documents requested in the vacancy. Identity documents are not normally needed at the initial application stage.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilePicker
            id="cv"
            name="cv"
            label="CV or résumé"
            description="Required · PDF or DOCX · Maximum 2 MB"
            required={requiredDocuments.has('cv')}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            file={files.cv}
            onChange={(file) => setFile('cv', file)}
          />
          {supportingDocuments.map(({ name, label, detail }) => (
            <FilePicker
              key={name}
              id={name}
              name={name}
              label={label}
              description={`${requiredDocuments.has(name) ? 'Required' : detail} · PDF, JPG, or PNG · Maximum 2 MB`}
              required={requiredDocuments.has(name)}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              file={files[name]}
              onChange={(file) => setFile(name, file)}
            />
          ))}
          <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Protect your personal information.</strong>{' '}
              Only attach an identity document if the vacancy specifically requests it; it is usually collected later from shortlisted applicants. Never send bank details, passwords, or original documents.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Each file may be up to 2 MB; all files combined must be no larger than 3.5 MB on this application form because of the current hosting upload limit.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">3</span>
            Review and submit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input name="privacyConsent" type="checkbox" required value="on" className="mt-1 h-4 w-4 accent-primary" />
            <span>
              I confirm that the information is accurate and consent to All In One Solution using my application and attached documents to consider me for relevant opportunities. I understand that only authorised recruitment personnel can access these documents. <span className="text-destructive">*</span>
            </span>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">
            Please submit only information needed for recruitment. You may ask us to remove your application by emailing{' '}
            <a className="font-medium text-primary underline underline-offset-4" href="mailto:careers@allinonesolution.com?subject=Career%20application%20data%20request">careers@allinonesolution.com</a>.
            Applications are kept only as long as needed for recruitment or legal purposes.
          </p>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {result && !result.success && (
            <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {result.message}
            </p>
          )}
          <Button className="w-full sm:w-auto" type="submit" size="lg" disabled={pending}>
            {pending ? 'Submitting application…' : 'Submit application'}
          </Button>
          <p className="text-xs text-muted-foreground">No application fee is charged. We will contact you using the details above if there is a suitable next step.</p>
        </CardContent>
      </Card>
    </form>
  );
}
