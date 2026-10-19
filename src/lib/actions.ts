'use server';

import { z } from 'zod';
import { getMySqlPool } from '@/lib/mysql';

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

export type ContactFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    message?: string[];
    requestType?: string[];
  };
  success: boolean;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const validatedFields = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
    requestType: formData.get('requestType'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Failed to send message. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const pool = getMySqlPool();
    await pool.execute(
      `INSERT INTO customer_requests
         (request_type, full_name, email_address, phone_number, message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        validatedFields.data.requestType === 'callback' ? 'callback' : 'message',
        validatedFields.data.name.trim(),
        validatedFields.data.email.trim(),
        validatedFields.data.phone?.trim() || null,
        validatedFields.data.message?.trim() ?? '',
      ]
    );

    return {
      message: validatedFields.data.requestType === 'callback'
        ? 'Your callback request has been received. Our team will call you soon.'
        : 'Your message has been sent successfully!',
      success: true,
      errors: {},
    };
  } catch (error) {
    console.error('Error saving contact form submission:', error);
    return {
      message: 'An internal error occurred. Please try again later.',
      success: false,
    };
  }
}

const quotationRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(160),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  service: z.string().trim().max(160).optional(),
  details: z.string().min(10, 'Please provide details about your needs.').max(10000),
});

export type QuotationRequestState = {
    message: string;
    errors?: {
        name?: string[];
        email?: string[];
        phone?: string[];
        company?: string[];
        service?: string[];
        details?: string[];
    };
    success: boolean;
};


export async function submitQuotationRequest(
  prevState: QuotationRequestState,
  formData: FormData
): Promise<QuotationRequestState> {
  const validatedFields = quotationRequestSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    company: formData.get('company'),
    service: formData.get('service'),
    details: formData.get('details'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Failed to submit request. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const pool = getMySqlPool();
    await pool.execute(
      `INSERT INTO customer_requests
         (request_type, full_name, email_address, phone_number,
          company_name, service_name, message)
       VALUES ('quote', ?, ?, ?, ?, ?, ?)`,
      [
        validatedFields.data.name.trim(),
        validatedFields.data.email.trim(),
        validatedFields.data.phone?.trim() || null,
        validatedFields.data.company?.trim() || null,
        validatedFields.data.service?.trim() || null,
        validatedFields.data.details.trim(),
      ]
    );

    return {
      message: 'Your quotation request has been submitted successfully! Our team will get in touch with you shortly.',
      success: true,
      errors: {},
    };
  } catch (error) {
    console.error('Error saving quotation request:', error);
    return {
      message: 'An internal error occurred. Please try again later.',
      success: false,
    };
  }
}

    