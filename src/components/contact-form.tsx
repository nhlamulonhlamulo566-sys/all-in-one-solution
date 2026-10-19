"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitContactForm } from '@/lib/actions';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useTransition } from 'react';
import { CheckCircle, MessageSquare, PhoneCall } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(160),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).optional(),
  message: z.string().max(10000).optional(),
  requestType: z.enum(['message', 'callback']),
}).superRefine((data, context) => {
  if (data.requestType === 'callback' && (!data.phone || data.phone.length < 7)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'Enter a valid phone number so our team can call you.',
    });
  }

  if (data.requestType === 'message' && (!data.message || data.message.trim().length < 10)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['message'],
      message: 'Message must be at least 10 characters.',
    });
  }
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactForm({
  defaultRequestType = 'message',
}: {
  defaultRequestType?: 'message' | 'callback';
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      requestType: defaultRequestType,
    },
  });

  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value || '');
      });
      const response = await submitContactForm(
        { message: '', success: false },
        formData
      );
      setResult(response);
      if (response.success) {
        form.reset();
      }
    });
  };

  if (result?.success) {
    return (
      <div className="text-center p-4 bg-secondary rounded-lg flex flex-col items-center gap-2">
        <CheckCircle className="w-8 h-8 text-primary" />
        <p className="font-bold text-primary-foreground">{result.message}</p>
        <Button variant="outline" onClick={() => setResult(null)}>Send Another Message</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="requestType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How can we help?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="request-message"
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/60"
                  >
                    <RadioGroupItem value="message" id="request-message" />
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Send a message</span>
                  </label>
                  <label
                    htmlFor="request-callback"
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/60"
                  >
                    <RadioGroupItem value="callback" id="request-callback" />
                    <PhoneCall className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Request a call back</span>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
              <FormLabel>Email</FormLabel>
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
              <FormLabel>
                Phone Number
                {form.watch('requestType') === 'callback'
                  ? ' (Required for a call back)'
                  : ' (Optional)'}
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(123) 456-7890" {...field} />
              </FormControl>
              {form.watch('requestType') === 'callback' && (
                <p className="text-sm text-muted-foreground">
                  Leave a number our team can call you on.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch('requestType') === 'callback' ? 'Anything we should know? (Optional)' : 'Message'}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    form.watch('requestType') === 'callback'
                      ? 'Add a convenient time to call or a short note.'
                      : 'How can we help you?'
                  }
                  {...field}
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
          className="w-full"
        >
          {isPending
            ? 'Sending...'
            : form.watch('requestType') === 'callback'
              ? 'Request a Call Back'
              : 'Send Message'}
        </Button>
      </form>
    </Form>
  );
}
