"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitQuotationRequest } from '@/lib/actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const quotationRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(160),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  details: z.string().min(10, 'Please provide details about your needs.').max(10000),
});

type QuotationRequestValues = z.infer<typeof quotationRequestSchema>;

export default function OfficeSupplyQuoteForm({
  serviceName = 'Office Supplies',
  initialDetails = '',
}: {
  serviceName?: string;
  initialDetails?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const form = useForm<QuotationRequestValues>({
    resolver: zodResolver(quotationRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      details: initialDetails,
    },
  });

  const onSubmit = (values: QuotationRequestValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value || '');
      });
      formData.append('service', serviceName);
      const response = await submitQuotationRequest(
        { message: '', success: false },
        formData
      );
      setResult(response);
      if (response.success) {
        form.reset();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Request a quotation for {serviceName}
        </CardTitle>
        <CardDescription>
            Tell us what you need and leave your contact details. Our team will follow up with you about your quotation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result?.success ? (
            <div className="text-center p-4 bg-secondary rounded-lg flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-primary" />
                <p className="font-bold text-primary-foreground">{result.message}</p>
                <Button variant="outline" onClick={() => setResult(null)}>Submit Another Request</Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company Name (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Company, Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quotation Details</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder={`Please describe what you need for ${serviceName}.`} 
                            {...field}
                            rows={5}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {result && !result.success && (
                <p className="text-sm font-medium text-destructive">
                    {result.message}
                </p>
                )}
                <Button
                type="submit"
                disabled={isPending}
                className="w-full !mt-6"
                >
                {isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
    </Card>
  );
}

    