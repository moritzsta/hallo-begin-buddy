import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only on mobile and if not already installed
      if (isMobile && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isMobile]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt || localStorage.getItem('install-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
      <Download className="w-6 h-6 text-primary flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">App installieren</p>
        <p className="text-xs text-muted-foreground">Schnellerer Zugriff ohne Browser</p>
      </div>
      <Button size="sm" onClick={handleInstall}>
        Installieren
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDismiss}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
