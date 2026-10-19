import Link from 'next/link';
import Image from 'next/image';
import type { Service } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as icons from 'lucide-react';

type ServiceCardProps = {
  service: Service;
};

export default function ServiceCard({ service }: ServiceCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === service.imageId);
  const Icon = icons[service.icon] as React.FC<React.SVGProps<SVGSVGElement>>;

  return (
    <Link href={`/services/${service.id}`} className="group block">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative h-48 flex-shrink-0">
          {image && (
            <Image
              src={image.imageUrl}
              alt={service.name}
              fill
              className="object-cover"
              data-ai-hint={image.imageHint}
            />
          )}
        </div>
        <div className="flex flex-col flex-grow">
          <CardHeader>
            <div className='flex justify-between items-center'>
              <Badge variant="secondary" className="w-fit mb-2 capitalize">
                {service.category}
              </Badge>
               {Icon && <Icon className="w-8 h-8 text-primary" />}
            </div>
            <CardTitle className="font-bold text-xl">
              {service.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <CardDescription className="flex-grow">{service.shortDescription}</CardDescription>
            <div className="mt-4 flex items-center text-primary font-semibold group-hover:text-accent-foreground transition-colors">
              Learn More{' '}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
