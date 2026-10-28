'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  closingDate: string | null;
};

export default function CareerVacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetch('/api/careers/vacancies')
      .then(async (response) => {
        const body = await response.json() as { vacancies?: Vacancy[]; error?: string };
        if (!response.ok) throw new Error(body.error || 'Unable to load vacancies.');
        setVacancies(body.vacancies || []);
      })
      .catch((error: unknown) => {
        setLoadFailed(true);
        console.error('Unable to load public career vacancies.', error);
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto mt-10 max-w-5xl">
      {vacancies.length > 0 ? (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <Card key={vacancy.id} className="bg-background">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-primary">{vacancy.department}</p>
                    <h3 className="mt-1 text-xl font-semibold">{vacancy.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{vacancy.location}</span>
                    <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4" />{vacancy.workType}</span>
                    {vacancy.closingDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Apply by {vacancy.closingDate}</span>}
                  </div>
                  {vacancy.salaryRange && (
                    <p className="text-sm font-medium text-foreground">Pay: {vacancy.salaryRange}</p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{vacancy.description}</p>
                  {vacancy.responsibilities && (
                    <div>
                      <h4 className="text-sm font-semibold">Key responsibilities</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{vacancy.responsibilities}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold">What we&apos;re looking for</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{vacancy.requirements}</p>
                  </div>
                  {vacancy.selectionProcess && (
                    <div>
                      <h4 className="text-sm font-semibold">Selection process</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{vacancy.selectionProcess}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Required with application: {[...new Set(['cv', ...vacancy.requiredDocuments])].map((document) => document === 'driversLicense' ? 'driver’s licence' : document === 'cv' ? 'CV / résumé' : document === 'identity' ? 'identity document' : document === 'qualification' ? 'qualification certificates' : 'supporting document').join(', ')}.
                  </p>
                </div>
                <Button
                  className="shrink-0"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('career-vacancy-select', { detail: vacancy }));
                    document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Apply for this role
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : loaded && loadFailed ? (
        <Card className="border-amber-500/30 bg-background">
          <CardContent className="py-8 text-center">
            <p className="font-medium">Vacancies are temporarily unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We can&apos;t load current openings right now. Please try again later
              before sending an application or personal documents.
            </p>
          </CardContent>
        </Card>
      ) : loaded ? (
        <Card className="border-dashed bg-background">
          <CardContent className="py-8 text-center">
            <p className="font-medium">No open vacancies at the moment</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You can still submit a general application and we&apos;ll consider it for relevant future opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="h-24 animate-pulse rounded-xl bg-background/70" aria-label="Loading open vacancies" />
      )}
    </div>
  );
}
