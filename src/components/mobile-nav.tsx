'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import AuthButton from './auth-button';
import Logo from './logo';
import { Separator } from './ui/separator';
import { useUser } from '@/auth/provider';
import { isAdministratorRole, isStaffRole } from '@/lib/roles';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader className="flex-row justify-between items-center mb-6">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Logo />
          </Link>
          <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <nav className="flex flex-col items-start gap-2 text-lg font-medium">
            <Link
              href="/about"
              className="hover:text-primary w-full p-3 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/announcements"
              className="hover:text-primary w-full p-3 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Announcements
            </Link>
            <Link
              href="/contact"
              className="hover:text-primary w-full p-3 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>
            {user && isStaffRole(user.role) && (
              <>
                <Separator className="my-2" />
                <Link
                  href="/admin"
                  className="hover:text-primary w-full p-3 rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Lead Dashboard
                </Link>
                 <Link
                    href="/admin/chat"
                    className="hover:text-primary w-full p-3 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                    >
                    Admin Chat
                </Link>
                <Link
                    href="/admin/submissions"
                    className="hover:text-primary w-full p-3 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                    >
                    Submissions
                </Link>
                 <Link
                    href="/admin/quotations"
                    className="hover:text-primary w-full p-3 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                    >
                    Quotations
                </Link>
                 <Link
                    href="/admin/announcements"
                    className="hover:text-primary w-full p-3 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                    >
                    Announcements
                </Link>
                {user && isAdministratorRole(user.role) && (
                    <>
                      <Link
                        href="/admin/content"
                        className="hover:text-primary w-full p-3 rounded-md transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Public Page Content
                      </Link>
                      <Link
                        href="/admin/users"
                        className="hover:text-primary w-full p-3 rounded-md transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Team &amp; Access
                      </Link>
                    </>
                )}
              </>
            )}
          </nav>
          <div className="mt-auto pt-4">
             <Separator className="mb-4" />
            <div className="flex w-full flex-col gap-2">
              <AuthButton onAction={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
