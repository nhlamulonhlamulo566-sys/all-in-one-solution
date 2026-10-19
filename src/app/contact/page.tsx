import { Mail, Phone, Linkedin, Facebook, Youtube, Instagram, MapPin, Building2, Globe } from 'lucide-react';
import ContactForm from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveChatWidget from '@/components/live-chat-widget';

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.12c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.51-6.13c-.25-.12-1.47-.72-1.7-.85-.23-.12-.39-.12-.56.12-.17.25-.64.85-.79 1.02-.15.17-.29.18-.54.06s-1.02-.37-1.94-1.2c-.72-.65-1.2-1.45-1.34-1.7s-.02-.38.11-.51c.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.42h-.5c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.9 2.4 1.02 2.57c.12.17 1.76 2.67 4.25 3.73.59.25 1.05.41 1.41.52.59.18 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18s-.22-.16-.47-.28z"/>
    </svg>
);


const socialLinks = [
    { name: 'Twitter', icon: XIcon, href: 'https://twitter.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'WhatsApp', icon: WhatsAppIcon, href: 'https://whatsapp.com' },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  const defaultRequestType = request === 'callback' ? 'callback' : 'message';

  return (
    <>
      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto text-center px-4">
            <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
                <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get In Touch</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto break-words">
                We&apos;re here to help and answer any question you might have. We look forward to hearing from you.
            </p>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Email</h3>
                    <a href="mailto:contact@allinonesolution.com" className="text-muted-foreground hover:text-primary transition-colors break-all">
                      contact@allinonesolution.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Phone</h3>
                    <a href="tel:0813210332" className="text-muted-foreground hover:text-primary transition-colors block">
                      081-321-0332
                    </a>
                     <a href="tel:0113210332" className="text-muted-foreground hover:text-primary transition-colors block">
                      011-321-0332
                    </a>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                  <Globe className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Website</h3>
                    <a href="https://www.allinonesolution.co.za" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors break-all">
                        www.allinonesolution.co.za
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Office Address</h3>
                    <p className="text-muted-foreground">123 Business Rd, Suite 101<br />Innovation City, 12345</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                    Stay connected with us on social media for the latest updates and news.
                </p>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map(({ name, icon: Icon, href }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={name}
                    >
                      <Icon className="w-7 h-7" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3" id="contact-form">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Request a Quote or Call Back</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        Have a question or a project in mind? Fill out the form below and our team will get back to you as soon as possible.
                    </p>
                    <ContactForm defaultRequestType={defaultRequestType} />
                </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <LiveChatWidget />
    </>
  );
}

export const metadata = {
    title: 'Contact Us | All In One Solution',
    description: 'Get in touch with All In One Solution for questions, project inquiries, or support. We look forward to hearing from you.',
};
