import { services, categories } from '@/lib/data';
import ServiceList from '@/components/service-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, PhoneCall } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Our Professional Services
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto break-words">
          Your one-stop partner for comprehensive business solutions. From
          building a powerful digital presence with our expert web development
          and design services, to ensuring your operations run smoothly with our
          top-tier IT support and network administration. We also provide
          strategic business consulting to guide your growth and supply all your
          essential office needs. At All In One Solution, we provide the
          integrated services you need to thrive.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="#services">
              Explore services and request a quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact?request=callback#contact-form">
              <PhoneCall className="mr-2 h-4 w-4" />
              Request a call back
            </Link>
          </Button>
        </div>
      </section>
      <div id="services">
        <ServiceList services={services} categories={categories} />
      </div>
    </div>
  );
}
