
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
  projectType: z.enum(['standard', 'ecommerce', 'pos', 'custom'], {
    required_error: 'You need to select a project type.',
  }),
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
  website: 500,
  database: 800,
};

const VAT_RATE = 0.15;

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
    let oneTimeSubtotal = 0;
    let supportBase = 0;

    if ('projectType' in data) { // Web Development
      const projectTypeFactors = {
        standard: { base: 4000, range: 2000, support: 300 },
        ecommerce: { base: 25000, range: 15000, support: 2000 },
        pos: { base: 40000, range: 20000, support: 3000 },
        custom: { base: 60000, range: 40000, support: 4000 },
      };
      const factors = projectTypeFactors[data.projectType];
      oneTimeSubtotal = factors.base + Math.random() * factors.range;
      supportBase = factors.support;
      
      if (data.websiteHosting) oneTimeSubtotal += hostingCosts.website * 12; // Initial annual cost
      if (data.databaseHosting) oneTimeSubtotal += hostingCosts.database * 12; // Initial annual cost

    } else if ('projectScale' in data) { // General Services
      const scaleFactors = {
        small: { base: 2000, range: 1500, support: 250 },
        medium: { base: 5000, range: 3000, support: 600 },
        large: { base: 12000, range: 8000, support: 1500 },
      };
      const scale = scaleFactors[data.projectScale];
      oneTimeSubtotal = scale.base + Math.random() * scale.range;
      supportBase = scale.support;

      if (data.advancedCustomization) {
        oneTimeSubtotal *= 1.25;
      }
    }
    
    oneTimeSubtotal *= timelineFactors[data.timeline];

    let recurringSubtotal = 0;
    let recurringPeriod = '';
    if (data.supportPlan !== 'none') {
        const plan = supportPlanFactors[data.supportPlan];
        recurringSubtotal = supportBase * plan.multiplier;
        recurringPeriod = data.supportPlan === 'monthly' ? '/month' : '/year';
    }
     if ('projectType' in data && data.supportPlan !== 'none') {
        if (data.websiteHosting) recurringSubtotal += hostingCosts.website;
        if (data.databaseHosting) recurringSubtotal += hostingCosts.database;
        if(data.supportPlan === 'yearly') recurringSubtotal *= 10; // Apply yearly discount to hosting too
    }


    const oneTimeVat = oneTimeSubtotal * VAT_RATE;
    const recurringVat = recurringSubtotal * VAT_RATE;

    setFormData(data);
    setEstimate({
      oneTime: {
        subtotal: Math.round(oneTimeSubtotal / 10) * 10,
        vat: Math.round(oneTimeVat / 10) * 10,
        total: Math.round((oneTimeSubtotal + oneTimeVat) / 10) * 10,
      },
      recurring: {
        subtotal: Math.round(recurringSubtotal / 10) * 10,
        vat: Math.round(recurringVat / 10) * 10,
        total: Math.round((recurringSubtotal + recurringVat) / 10) * 10,
      },
      recurringPeriod: recurringPeriod,
    });
  }

  function handleRecalculate() {
    setEstimate(null);
    setFormData(null);
    form.reset();
  }

  const renderSummary = (data: QuotationFormValues) => {
    if ('projectType' in data) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          Instant Quotation Calculator
        </CardTitle>
        <CardDescription>
          Get a quick estimate for our {serviceName} service. Adjust the
          options below to match your needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {estimate && formData ? (
           <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Estimated Total One-Time Cost</p>
              <p className="text-5xl font-bold tracking-tight text-primary">
                R {estimate.oneTime.total.toLocaleString()}
              </p>
               <p className="text-muted-foreground text-sm mt-1">(Including 15% VAT)</p>
              
              {estimate.recurring.total > 0 && (
                 <div className="mt-6">
                    <p className="text-muted-foreground">Estimated Total Support Cost</p>
                     <p className="text-3xl font-bold text-primary">
                        + R {estimate.recurring.total.toLocaleString()}{estimate.recurringPeriod}
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
                    <div className="flex justify-between capitalize"><span>Timeline:</span> <span className="font-medium">{formData.timeline}</span></div>
                    <div className="flex justify-between capitalize"><span>Support Plan:</span> <span className="font-medium">{supportPlanFactors[formData.supportPlan].label}</span></div>
                </CardContent>
                <Separator />
                <CardFooter className="flex-col items-start gap-2 pt-4 text-sm">
                    <div className="font-semibold text-base">Cost Breakdown:</div>
                    <div className="w-full">
                        <div className="flex justify-between"><span>One-Time Subtotal:</span> <span className="font-medium">R {estimate.oneTime.subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>VAT (15%):</span> <span className="font-medium">R {estimate.oneTime.vat.toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>One-Time Total:</span> <span>R {estimate.oneTime.total.toLocaleString()}</span></div>
                    </div>
                     {estimate.recurring.total > 0 && (
                        <div className="w-full mt-2">
                            <div className="flex justify-between"><span>Support & Hosting Subtotal:</span> <span className="font-medium">R {estimate.recurring.subtotal.toLocaleString()}{estimate.recurringPeriod}</span></div>
                            <div className="flex justify-between"><span>Support & Hosting VAT (15%):</span> <span className="font-medium">R {estimate.recurring.vat.toLocaleString()}{estimate.recurringPeriod}</span></div>
                            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Support & Hosting Total:</span> <span>R {estimate.recurring.total.toLocaleString()}{estimate.recurringPeriod}</span></div>
                        </div>
                     )}
                </CardFooter>
            </Card>
            <div className="text-center text-xs text-muted-foreground">
                This is a preliminary estimate. For a detailed and binding quotation, please contact us directly.
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
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                    <FormLabel>Website Hosting</FormLabel>
                                    <FormDescription>Reliable and fast hosting for your site or application.</FormDescription>
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
                                    <FormLabel>Database Hosting</FormLabel>
                                    <FormDescription>Secure and scalable hosting for your application&apos;s data.</FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    </div>
                  </FormItem>
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
