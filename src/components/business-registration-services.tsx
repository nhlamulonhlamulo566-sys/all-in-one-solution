import Link from 'next/link';
import { ArrowRight, Check, CircleHelp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const services = [
  {
    name: 'New company registration',
    price: 'R650',
    note: 'Our assistance fee for a straightforward private company registration.',
  },
  {
    name: 'SARS eFiling profile assistance',
    price: 'R250',
    note: 'Help setting up or accessing your profile; tax returns and tax advice are not included.',
  },
  {
    name: 'Tax Compliance Status (TCS)',
    price: 'R200',
    note: 'Assistance requesting a status pin through SARS eFiling.',
  },
  {
    name: 'Central Supplier Database (CSD)',
    price: 'R200',
    note: 'Assistance completing or updating a supplier profile on the National Treasury portal.',
  },
  {
    name: 'Director amendment (CoR39)',
    price: 'R400',
    note: 'Assistance preparing and submitting a standard director change.',
  },
  {
    name: 'COIDA registration',
    price: 'From R950',
    note: 'Starting assistance fee; final price depends on the business and employee details.',
  },
  {
    name: 'Annual CIPC return',
    price: 'R250',
    note: 'Our filing assistance fee; the CIPC fee is additional and varies by turnover.',
  },
];

export default function BusinessRegistrationServices() {
  return (
    <section className="space-y-6" aria-labelledby="business-compliance-heading">
      <div className="space-y-2">
        <Badge variant="secondary">South African business support</Badge>
        <h2
          id="business-compliance-heading"
          className="text-3xl font-bold tracking-tight"
        >
          Start your business and stay compliant
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Clear assistance fees for common registration and compliance tasks.
          Tell us what you need and we&apos;ll confirm the documents, scope and
          total before any work begins.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <Card key={service.name} className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <span className="shrink-0 text-lg font-bold text-primary">
                  {service.price}
                </span>
              </div>
              <CardDescription>{service.note}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="#request-quotation">
                  Ask about this service
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-3 pt-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <CircleHelp className="h-5 w-5 text-primary" />
            What these prices cover
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Prices shown are our assistance fees in South African rand.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              CIPC, government, levy and other third-party charges are not
              included; any applicable charges are confirmed separately at
              cost before work begins.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              We provide administrative assistance, not legal, accounting or
              tax advice. We never need you to send us your passwords or
              one-time PINs.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Final scope, any applicable VAT and total payable will be
              confirmed in a written quotation. Government approval is not
              guaranteed.
            </li>
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
