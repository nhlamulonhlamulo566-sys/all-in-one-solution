"use client";

import { useState } from 'react';
import type { Service } from '@/lib/types';
import ServiceCard from './service-card';
import { Button } from '@/components/ui/button';

type ServiceListProps = {
  services: Service[];
  categories: string[];
};

export default function ServiceList({
  services,
  categories,
}: ServiceListProps) {
  const [filter, setFilter] = useState('All');

  const filteredServices =
    filter === 'All'
      ? services
      : services.filter((service) => service.category === filter);

  return (
    <section>
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={filter === category ? 'default' : 'outline'}
            onClick={() => setFilter(category)}
            className="capitalize rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
