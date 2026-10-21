import { services } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ContactForm from '@/components/contact-form';
import AiFaq from '@/components/ai-faq';
import { ChevronRight } from 'lucide-react';
import QuotationCalculator from '@/components/quotation-calculator';
import OfficeSupplyQuoteForm from '@/components/office-supply-quote-form';
import BusinessRegistrationServices from '@/components/business-registration-services';

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = services.find((s) => s.id === id);

  if (!service) {
    notFound();
  }

  const heroImage = PlaceHolderImages.find(
    (img) => img.id === 'service-detail-hero'
  );

  return (
    <div>
      <section className="relative h-[300px] md:h-[400px] w-full text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="container mx-auto relative z-10 flex h-full flex-col justify-center px-4 sm:px-6 lg:px-8">
          <Badge
            variant="secondary"
            className="w-fit mb-4 capitalize text-sm"
          >
            {service.category}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {service.name}
          </h1>
        </div>
      </section>

      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-medium text-foreground">{service.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-3xl font-bold mb-4 tracking-tight">
                  Service Details
                </h2>
                <p className="text-lg text-muted-foreground whitespace-pre-line">
                  {service.longDescription}
                </p>
              </CardContent>
            </Card>

            {service.id === 'business-registration-compliance' ? (
              <>
                <BusinessRegistrationServices />
                <div id="request-quotation">
                  <OfficeSupplyQuoteForm
                    serviceName="Business Registration & Compliance"
                    initialDetails="Please tell us which service you need (company registration, SARS eFiling, TCS, CSD, director amendment, COIDA or annual CIPC return) and briefly describe your requirements."
                  />
                </div>
              </>
            ) : service.id === 'office-supply' ? (
              <div id="request-quotation">
                <OfficeSupplyQuoteForm serviceName="Office Supplies" />
              </div>
            ) : (
              <>
                <QuotationCalculator serviceName={service.name} />
                <div id="request-quotation">
                  <OfficeSupplyQuoteForm serviceName={service.name} />
                </div>
              </>
            )}

            <AiFaq serviceDetails={service.longDescription} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24" id="contact">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-3xl font-bold mb-4 tracking-tight">
                    Contact Us
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Interested in this service? Fill out the form below and
                    we&apos;ll get back to you.
                  </p>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return services.map((service) => ({
    id: service.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }
  return {
    title: `${service.name} | All In One Solution`,
    description: service.shortDescription,
  };
}
