
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calculator, RefreshCw } from 'lucide-react';
import { Separator } from './ui/separator';

const baseSchema = z.object({
  timeline: z.enum(['standard', 'expedited']),
  supportPlan: z.enum(['none', 'monthly', 'yearly']).default('none'),
});

const webDevSchema = baseSchema.extend({
  projectType: z.enum([
    'standard',
    'ecommerce',
    'pos',
    'custom',
    'professional-email',
  ], {
    required_error: 'You need to select a project type.',
  }),
  emailPlan: z.enum(['small', 'medium', 'large']),
  websiteHosting: z.boolean().default(false),
  databaseHosting: z.boolean().default(false),
});

const generalSchema = baseSchema.extend({
  projectScale: z.enum(['small', 'medium', 'large'], {
    required_error: 'You need to select a project scale.',
  }),
  advancedCustomization: z.boolean().default(false),
});

const quotationSchema = z.union([webDevSchema, generalSchema]);
type QuotationFormValues = z.infer<typeof quotationSchema>;

const timelineFactors = {
  standard: 1.0,
  expedited: 1.3,
};

const supportPlanFactors = {
  none: { multiplier: 0, label: 'None' },
  monthly: { multiplier: 1, label: 'Monthly' },
  yearly: { multiplier: 10, label: 'Yearly (2 months free)' },
};

const hostingCosts = {
  website: 250,
  database: 350,
};

const VAT_RATE = 0.15;
const zarFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

const webProjectPrices = {
  standard: { base: 3500, support: 250 },
  ecommerce: { base: 14000, support: 750 },
  pos: { base: 18000, support: 900 },
  custom: { base: 25000, support: 1200 },
};

const generalProjectPrices = {
  small: { base: 1500, support: 200 },
  medium: { base: 3500, support: 400 },
  large: { base: 7500, support: 800 },
};

const professionalEmailPlans = {
  small: {
    label: 'Small (S)',
    monthlyPrice: 99,
    description: 'Dedicated business domain email + local IT support line.',
  },
  medium: {
    label: 'Medium (M)',
    monthlyPrice: 150,
    description: 'Increased storage pool + active account management.',
  },
  large: {
    label: 'Large (L)',
    monthlyPrice: 220,
    description: 'Maximum capacity for growing local teams.',
  },
};

function roundRand(amount: number) {
  return Math.round(amount);
}

type Estimate = {
  oneTime: { subtotal: number; vat: number; total: number };
  recurring: { subtotal: number; vat: number; total: number };
  recurringPeriod: string;
};

export default function QuotationCalculator({
  serviceName,
}: {
  serviceName: string;
}) {
  const isWebDev = serviceName === 'Web Development';

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [formData, setFormData] = useState<QuotationFormValues | null>(null);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: isWebDev
      ? {
          projectType: 'standard',
          emailPlan: 'small',
          timeline: 'standard',
          supportPlan: 'none',
          websiteHosting: false,
          databaseHosting: false,
        }
      : {
          projectScale: 'medium',
          timeline: 'standard',
          supportPlan: 'none',
          advancedCustomization: false,
        },
  });

  const projectType = form.watch('projectType' as const);

  useEffect(() => {
    if (isWebDev) {
      const isComplexProject = ['ecommerce', 'pos', 'custom'].includes(
        projectType
      );
      if (isComplexProject) {
        form.setValue('websiteHosting', true);
        form.setValue('databaseHosting', true);
      }
    }
  }, [projectType, form, isWebDev]);

  function calculateEstimate(data: QuotationFormValues) {
    const isProfessionalEmail =
      'projectType' in data && data.projectType === 'professional-email';
    let oneTimeSubtotal = 0;
    let supportBase = 0;

    if ('projectType' in data) {
      if (data.projectType !== 'professional-email') {
        const prices = webProjectPrices[data.projectType];
        oneTimeSubtotal = prices.base;
        supportBase = prices.support;
      }
    } else if ('projectScale' in data) { // General Services
      const prices = generalProjectPrices[data.projectScale];
      oneTimeSubtotal = prices.base;
      supportBase = prices.support;

      if (data.advancedCustomization) {
        oneTimeSubtotal *= 1.25;
      }
    }
    
    let recurringSubtotal = 0;
    let recurringPeriod = '';
    if (isProfessionalEmail && 'projectType' in data) {
      const monthlyPrice = professionalEmailPlans[data.emailPlan].monthlyPrice;
      recurringSubtotal = roundRand(monthlyPrice / (1 + VAT_RATE));
      recurringPeriod = '/month';
    } else if (data.supportPlan !== 'none') {
      const plan = supportPlanFactors[data.supportPlan];
      recurringSubtotal = supportBase * plan.multiplier;
      recurringPeriod = data.supportPlan === 'monthly' ? '/month' : '/year';
    }
    if ('projectType' in data && !isProfessionalEmail) {
      const monthlyHosting =
        (data.websiteHosting ? hostingCosts.website : 0) +
        (data.databaseHosting ? hostingCosts.database : 0);
      if (monthlyHosting > 0) {
        const hostingMultiplier = data.supportPlan === 'yearly' ? 10 : 1;
        recurringSubtotal += monthlyHosting * hostingMultiplier;
        recurringPeriod ||= data.supportPlan === 'yearly' ? '/year' : '/month';
      }
    }

    const roundedOneTimeSubtotal = roundRand(
      oneTimeSubtotal * timelineFactors[data.timeline]
    );
    const roundedRecurringSubtotal = roundRand(recurringSubtotal);
    const oneTimeVat = roundRand(roundedOneTimeSubtotal * VAT_RATE);
    const recurringVat = isProfessionalEmail && 'projectType' in data
      ? professionalEmailPlans[data.emailPlan].monthlyPrice -
        roundedRecurringSubtotal
      : roundRand(roundedRecurringSubtotal * VAT_RATE);
    const recurringTotal = isProfessionalEmail && 'projectType' in data
      ? professionalEmailPlans[data.emailPlan].monthlyPrice
      : roundedRecurringSubtotal + recurringVat;

    setFormData(data);
    setEstimate({
      oneTime: {
        subtotal: roundedOneTimeSubtotal,
        vat: oneTimeVat,
        total: roundedOneTimeSubtotal + oneTimeVat,
      },
      recurring: {
        subtotal: roundedRecurringSubtotal,
        vat: recurringVat,
        total: recurringTotal,
      },
      recurringPeriod,
    });
  }

  function handleRecalculate() {
    setEstimate(null);
    setFormData(null);
    form.reset();
  }

  const renderSummary = (data: QuotationFormValues) => {
    if ('projectType' in data) {
      if (data.projectType === 'professional-email') {
        const plan = professionalEmailPlans[data.emailPlan];
        return (
          <>
            <div className="flex justify-between">
              <span>Email Plan:</span>
              <span className="font-medium">{plan.label}</span>
            </div>
            <p className="text-muted-foreground">{plan.description}</p>
            <div className="flex justify-between">
              <span>Billing:</span>
              <span className="font-medium">Per month</span>
            </div>
          </>
        );
      }

       const isComplexProject = ['ecommerce', 'pos', 'custom'].includes(data.projectType);
      return (
        <>
          <div className="flex justify-between capitalize">
            <span>Project Type:</span> <span className="font-medium">{data.projectType}</span>
          </div>
          <div className="flex justify-between">
            <span>Add-ons:</span>
            <div className="font-medium text-right">
              {data.websiteHosting ? "Website Hosting" : "None"}
              {data.databaseHosting ? <br/> : ""}
              {data.databaseHosting ? "Database Hosting" : ""}
              {isComplexProject && <div className='text-xs text-muted-foreground'>(Hosting required)</div>}
            </div>
          </div>
        </>
      );
    }
    if ('projectScale' in data) {
      return (
        <>
          <div className="flex justify-between capitalize">
            <span>Project Scale:</span> <span className="font-medium">{data.projectScale}</span>
          </div>
           <div className="flex justify-between">
              <span>Add-ons:</span>
              <div className="font-medium text-right">
                {data.advancedCustomization ? "Advanced Customization" : "None"}
              </div>
          </div>
        </>
      );
    }
    return null;
  };

  const isProfessionalEmailEstimate =
    formData !== null &&
    'projectType' in formData &&
    formData.projectType === 'professional-email';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          Instant Quotation Calculator
        </CardTitle>
        <CardDescription>
          Get a budget-conscious estimate in South African rand for our {serviceName}
          service. Your final written quotation will be confirmed after we review
          your requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {estimate && formData ? (
           <div className="space-y-6">
            <div className="text-center">
              {isProfessionalEmailEstimate ? (
                <>
                  <p className="text-muted-foreground">Estimated Professional Email Cost</p>
                  <p className="text-5xl font-bold tracking-tight text-primary">
                    {zarFormatter.format(estimate.recurring.total)}/month
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">(15% VAT included)</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">Estimated Total One-Time Cost</p>
                  <p className="text-5xl font-bold tracking-tight text-primary">
                    {zarFormatter.format(estimate.oneTime.total)}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">(Including 15% VAT)</p>
                </>
              )}
              
              {!isProfessionalEmailEstimate && estimate.recurring.total > 0 && (
                 <div className="mt-6">
                    <p className="text-muted-foreground">Estimated Recurring Cost</p>
                     <p className="text-3xl font-bold text-primary">
                        + {zarFormatter.format(estimate.recurring.total)}{estimate.recurringPeriod}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">(Including 15% VAT)</p>
                 </div>
              )}
            </div>
            <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className='text-lg'>Quotation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Service:</span> <span className="font-medium">{serviceName}</span></div>
                    {renderSummary(formData)}
                    {!isProfessionalEmailEstimate && (
                      <>
                        <div className="flex justify-between capitalize"><span>Timeline:</span> <span className="font-medium">{formData.timeline}</span></div>
                        <div className="flex justify-between capitalize"><span>Support Plan:</span> <span className="font-medium">{supportPlanFactors[formData.supportPlan].label}</span></div>
                      </>
                    )}
                </CardContent>
                <Separator />
                <CardFooter className="flex-col items-start gap-2 pt-4 text-sm">
                    <div className="font-semibold text-base">Cost Breakdown:</div>
                    {!isProfessionalEmailEstimate && (
                      <div className="w-full">
                        <div className="flex justify-between"><span>One-Time Subtotal:</span> <span className="font-medium">{zarFormatter.format(estimate.oneTime.subtotal)}</span></div>
                        <div className="flex justify-between"><span>VAT (15%):</span> <span className="font-medium">{zarFormatter.format(estimate.oneTime.vat)}</span></div>
                        <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>One-Time Total:</span> <span>{zarFormatter.format(estimate.oneTime.total)}</span></div>
                      </div>
                    )}
                     {estimate.recurring.total > 0 && (
                        <div className="w-full mt-2">
                            <div className="flex justify-between"><span>{isProfessionalEmailEstimate ? 'Email plan (excluding VAT):' : 'Support & Hosting Subtotal:'}</span> <span className="font-medium">{zarFormatter.format(estimate.recurring.subtotal)}{estimate.recurringPeriod}</span></div>
                            <div className="flex justify-between"><span>{isProfessionalEmailEstimate ? 'VAT included (15%):' : 'Support & Hosting VAT (15%):'}</span> <span className="font-medium">{zarFormatter.format(estimate.recurring.vat)}{estimate.recurringPeriod}</span></div>
                            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>{isProfessionalEmailEstimate ? 'Email plan total (VAT included):' : 'Support & Hosting Total:'}</span> <span>{zarFormatter.format(estimate.recurring.total)}{estimate.recurringPeriod}</span></div>
                        </div>
                     )}
                </CardFooter>
            </Card>
            <div className="text-center text-xs text-muted-foreground">
                {isProfessionalEmailEstimate
                  ? 'Professional email service only. Monthly plan prices include 15% VAT; final service details are confirmed in the written quotation.'
                  : 'Includes 15% VAT. Hosting, when selected, is billed with the support plan; annual plans include two months free. Third-party products, licences and substantial integrations may affect the final quote.'}
            </div>
            <Button className="w-full" onClick={handleRecalculate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Calculate New Estimate
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(calculateEstimate)} className="space-y-8">
              
              {isWebDev ? (
                <>
                   <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>1. Project Type</FormLabel>
                         <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="standard" /></FormControl>
                              <FormLabel className="font-normal">Standard Website</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="ecommerce" /></FormControl>
                              <FormLabel className="font-normal">E-commerce</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="pos" /></FormControl>
                              <FormLabel className="font-normal">POS System</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="custom" /></FormControl>
                              <FormLabel className="font-normal">Custom Web App</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="professional-email" /></FormControl>
                              <FormLabel className="font-normal">Professional Email (Email Only)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {projectType === 'professional-email' ? (
                    <FormField
                      control={form.control}
                      name="emailPlan"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>2. Professional Email Plan</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-1 gap-4"
                            >
                              {Object.entries(professionalEmailPlans).map(([key, plan]) => (
                                <FormItem
                                  key={key}
                                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors"
                                >
                                  <FormControl>
                                    <RadioGroupItem value={key} />
                                  </FormControl>
                                  <div className="space-y-1">
                                    <FormLabel className="font-medium">
                                      {plan.label} — {zarFormatter.format(plan.monthlyPrice)}/month
                                    </FormLabel>
                                    <FormDescription>{plan.description}</FormDescription>
                                    <FormDescription>Price includes 15% VAT.</FormDescription>
                                  </div>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                  <FormItem>
                    <FormLabel>2. Hosting (Required for recurring support)</FormLabel>
                    <div className="space-y-3">
                        <FormField
                            control={form.control}
                            name="websiteHosting"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 has-[input:checked]:border-primary transition-colors">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={['ecommerce', 'pos', 'custom'].includes(projectType)}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Website Hosting ({zarFormatter.format(hostingCosts.website)}/month)</FormLabel>
                                    <FormDescription>Reliable hosting for your site or application.</FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="databaseHosting"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 has-[input:checked]:border-primary transition-colors">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={['ecommerce', 'pos', 'custom'].includes(projectType)}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Database Hosting ({zarFormatter.format(hostingCosts.database)}/month)</FormLabel>
                                    <FormDescription>Secure hosting for your application&apos;s data.</FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    </div>
                  </FormItem>
                  )}
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="projectScale"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>1. Project Scale</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="small" /></FormControl>
                              <FormLabel className="font-normal">Small</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="medium" /></FormControl>
                              <FormLabel className="font-normal">Medium</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                              <FormControl><RadioGroupItem value="large" /></FormControl>
                              <FormLabel className="font-normal">Large</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormItem>
                    <FormLabel>2. Optional Add-ons</FormLabel>
                    <div className="space-y-3">
                        <FormField
                        control={form.control}
                        name="advancedCustomization"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 has-[input:checked]:border-primary transition-colors">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Advanced Customization (+25%)</FormLabel>
                                <FormDescription>Includes complex features or third-party integrations.</FormDescription>
                            </div>
                            </FormItem>
                        )}
                        />
                    </div>
                  </FormItem>
                </>
              )}

              {projectType !== 'professional-email' && (
              <>
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{isWebDev ? '3.' : '2.'} Timeline</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors flex-1">
                          <FormControl><RadioGroupItem value="standard" /></FormControl>
                          <FormLabel className="font-normal">Standard</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors flex-1">
                          <FormControl><RadioGroupItem value="expedited" /></FormControl>
                          <FormLabel className="font-normal">Expedited (+30%)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supportPlan"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{isWebDev ? '4.' : '3.'} Technical Support Plan</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                          <FormControl><RadioGroupItem value="none" /></FormControl>
                          <FormLabel className="font-normal">None</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                          <FormControl><RadioGroupItem value="monthly" /></FormControl>
                          <FormLabel className="font-normal">Monthly</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground transition-colors">
                          <FormControl><RadioGroupItem value="yearly" /></FormControl>
                          <FormLabel className="font-normal">Yearly</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                     <FormDescription>
                        Choose a recurring support and maintenance plan{isWebDev && ' (includes hosting costs)'}.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </>
              )}

              <Button type="submit" className="w-full !mt-10">
                Get My Estimate
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
