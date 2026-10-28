import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/auth/provider';
import SiteLiveChat from '@/components/site-live-chat';
import PwaRegister from '@/components/pwa-register';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'All In One Solution | Integrated Business Services',
  description:
    'Your one-stop partner for comprehensive business solutions, from web development and IT support to business consulting and office supplies.',
  applicationName: 'All In One Solution',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'All In One Solution',
  },
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4a82b8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <PwaRegister />
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <SiteLiveChat />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
