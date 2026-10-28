import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  HeartHandshake,
  Lightbulb,
  Network,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CareerApplicationForm from '@/components/career-application-form';
import CareerVacancies from '@/components/career-vacancies';

const values = [
  {
    icon: HeartHandshake,
    title: 'People before process',
    description:
      'Build trust by listening carefully, treating people with respect, and following through on what you promise.',
  },
  {
    icon: Network,
    title: 'One team, many strengths',
    description:
      'Great solutions bring different skills together. Share what you know, stay curious, and help the whole team succeed.',
  },
  {
    icon: Lightbulb,
    title: 'Make useful things better',
    description:
      'Look for practical ways to solve real problems, improve the details, and make every client interaction count.',
  },
  {
    icon: Sparkles,
    title: 'Grow with intention',
    description:
      'Take ownership of your work, stay open to feedback, and make room to learn something new along the way.',
  },
];

export const metadata: Metadata = {
  title: 'Careers | All In One Solution',
  description:
    'Explore a future with All In One Solution. Learn about our team, the work we do, and how to introduce yourself for future opportunities.',
};

export default function CareersPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b bg-secondary/50">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 -left-16 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Careers at All In One Solution
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Good work starts with{' '}
              <span className="text-primary">good people.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              We bring technology, business services, and thoughtful support
              together to help our clients do more. If you care about doing
              useful work and making a real difference, we&apos;d love to hear
              from you.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#opportunities">
                  Explore opportunities
                  <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#application">
                  Start an application
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Explore current openings or submit a general application for
              future opportunities.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-muted-foreground">
              Applications are free.               Apply only through this official website. We will never ask
              applicants to pay a recruitment fee.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="why-join-heading"
        className="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How we work
          </p>
          <h2
            id="why-join-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Bring your whole skill set.
            <br className="hidden sm:block" /> Build something that matters.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            We believe the best work happens when people feel trusted to
            contribute, supported to keep learning, and connected to the people
            they serve.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="h-full">
              <CardContent className="p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="opportunities"
        aria-labelledby="opportunities-heading"
        className="scroll-mt-24 border-y bg-secondary/40"
      >
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Where you could contribute
            </p>
            <h2
              id="opportunities-heading"
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Different skills. One shared purpose.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              See our current openings below. Each listing includes its
              requirements and the documents to include with your application.
            </p>
          </div>
          <CareerVacancies />

          <Card className="mx-auto mt-8 max-w-5xl border-primary/20 bg-background shadow-sm">
            <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Looking for a future opportunity?
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    If you don&apos;t see the right role, submit a general
                    expression of interest. We&apos;ll keep your details in
                    mind for relevant opportunities.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href="#application">
                  Submit an expression of interest
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        aria-labelledby="application-heading"
        id="application"
        className="scroll-mt-24 container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Your next step
            </p>
            <h2
              id="application-heading"
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Tell us what you could bring.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Complete the form and attach your CV, identity document, and
              qualification certificates. A driver&apos;s licence is needed
              only when a specific vacancy requests it.
            </p>
          </div>
          <CareerApplicationForm />
          <p className="text-center text-sm text-muted-foreground">
            Questions before applying?{' '}
            <Link
              href="/contact"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Contact our team
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
