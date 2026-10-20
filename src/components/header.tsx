import Link from 'next/link';
import { Button } from './ui/button';
import Logo from './logo';
import AuthButton from './auth-button';
import MobileNav from './mobile-nav';

export default function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold text-foreground hover:text-foreground/80 transition-colors"
        >
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/about">About Us</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/announcements">Announcements</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">Contact Us</Link>
          </Button>
          <div className="flex items-center gap-2 pl-2 ml-2 border-l">
            <AuthButton compact />
          </div>
        </nav>
        <div className="lg:hidden">
            <MobileNav />
        </div>
      </div>
    </header>
  );
}

    