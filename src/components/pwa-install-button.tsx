'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallButtonProps {
  className?: string;
}

export default function PwaInstallButton({
  className,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onAppInstalled = () => setInstallPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(null);
    } catch (error) {
      console.error('Failed to prompt for PWA installation:', error);
    }
  };

  if (!installPrompt) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={installApp}
    >
      <Download aria-hidden="true" />
      Install app
    </Button>
  );
}
