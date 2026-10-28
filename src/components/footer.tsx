import Link from 'next/link';
import { Mail, Phone, Linkedin, Facebook, Goal, Zap, Eye, Youtube, Instagram } from 'lucide-react';

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

export default function Footer() {
  return (
    <footer
      id="footer"
      className="py-12 px-4 mt-16 border-t bg-secondary/50"
    >
      <div className="container mx-auto text-sm text-muted-foreground">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 items-start">
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/>Our Mission</h3>
                <p>To empower businesses by providing integrated, reliable, and innovative solutions across technology, design, and essential services, ensuring our clients can focus on what they do best: growing their business.</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary"/>Our Vision</h3>
                <p>To be the most trusted single-source partner for businesses of all sizes, recognized for our commitment to excellence, customer success, and comprehensive support in a dynamic world.</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Goal className="w-5 h-5 text-primary"/>Our Goal</h3>
                <p>To deliver seamless and superior service by understanding our clients&apos; unique needs, fostering long-term partnerships, and continuously adapting our offerings to provide maximum value and impact.</p>
            </div>
            <div className="grid gap-8">
              <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                  Contact Us
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a
                      href="mailto:contact@allinonesolution.com"
                      className="hover:text-primary transition-colors break-all"
                  >
                      contact@allinonesolution.com
                  </a>
                  </div>
                  <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a
                      href="tel:0813210332"
                      className="hover:text-primary transition-colors"
                  >
                      081-321-0332
                  </a>
                  </div>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                  Follow Us
                  </h3>
                  <div className="flex flex-wrap gap-4">
                  <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Twitter"
                  >
                      <XIcon className="w-6 h-6" />
                  </a>
                  <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="LinkedIn"
                  >
                      <Linkedin className="w-6 h-6" />
                  </a>
                  <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Facebook"
                  >
                      <Facebook className="w-6 h-6" />
                  </a>
                  <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="YouTube"
                  >
                      <Youtube className="w-6 h-6" />
                  </a>
                  <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Instagram"
                  >
                      <Instagram className="w-6 h-6" />
                  </a>
                  <a
                      href="https://whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="WhatsApp"
                  >
                      <WhatsAppIcon className="w-6 h-6" />
                  </a>
                  </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Join Our Team
                </h3>
                <Link
                  href="/careers"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Careers
                </Link>
              </div>
            </div>
        </div>

        <div className="border-t pt-8 text-center">
            <h3 className="text-lg font-bold text-foreground mb-4">
              All In One Solution
            </h3>
            <p className="mb-4 italic">
              Simplifying Your Path to Success.
            </p>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <p>
              &copy; {new Date().getFullYear()} All In One Solution. All rights
              reserved.
            </p>
            <Link
              href="/login"
              title="Staff sign-in"
              className="rounded-full opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100"
              aria-label="Staff sign-in"
            >
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
