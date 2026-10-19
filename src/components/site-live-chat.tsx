'use client';

import { usePathname } from 'next/navigation';
import LiveChatWidget from '@/components/live-chat-widget';

export default function SiteLiveChat() {
  const pathname = usePathname();

  if (
    pathname.startsWith('/admin')
    || pathname.startsWith('/login')
    || pathname.startsWith('/signup')
  ) {
    return null;
  }

  return <LiveChatWidget />;
}
