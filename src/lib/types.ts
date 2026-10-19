export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  icon: keyof typeof import('lucide-react');
  shortDescription: string;
  longDescription: string;
  imageId: string;
  testimonials: Testimonial[];
};
