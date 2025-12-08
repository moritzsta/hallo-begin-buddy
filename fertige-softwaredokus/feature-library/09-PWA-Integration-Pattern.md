# 09-PWA-Integration-Pattern

## Überblick

**Was:** Progressive Web App (PWA) Integration mit Install-Prompts, Service Worker und Standalone-Mode-Erkennung.

**Wann verwenden:**
- Wenn die App als "native-ähnliche" App installierbar sein soll
- Für Offline-Support und Caching
- Wenn unterschiedliches Verhalten für Browser vs. installierte App nötig ist

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        PWA System                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  vite.config.ts │───▶│  manifest.json  │                │
│  │  (PWA Plugin)   │    │  (Auto-generiert)│                │
│  └─────────────────┘    └─────────────────┘                │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │            PWAContext.tsx               │               │
│  │  - beforeinstallprompt Event            │               │
│  │  - isInstalled State                    │               │
│  │  - installApp() Function                │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├──────────────────┬──────────────────┐          │
│           ▼                  ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────────┐   ┌─────────────┐  │
│  │InstallPrompt│    │InstallInstructions│ │ Conditional │  │
│  │  Component  │    │    Dialog       │   │  Footer     │  │
│  └─────────────┘    └─────────────────┘   └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Vite PWA Plugin Konfiguration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192x192.png'],
      manifest: {
        name: 'AllMyPrompts - Prompt Manager',
        short_name: 'AllMyPrompts',
        description: 'Verwalte und optimiere deine KI-Prompts',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Schritt 2: PWA Context

```typescript
// src/contexts/PWAContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  };

  const value: PWAContextType = {
    deferredPrompt,
    isInstallable: !!deferredPrompt,
    isInstalled,
    installApp,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
```

### Schritt 3: Service Worker Registrierung

```typescript
// src/registerServiceWorker.ts
import { Workbox } from 'workbox-window';

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // Neue Version verfügbar - Nutzer informieren
        if (confirm('Neue Version verfügbar. Jetzt aktualisieren?')) {
          window.location.reload();
        }
      }
    });

    wb.register();
  }
};
```

### Schritt 4: Install Instructions Dialog (für alle Plattformen)

```typescript
// src/components/InstallInstructionsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWA } from '@/contexts/PWAContext';

interface InstallInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstallInstructionsDialog = ({ open, onOpenChange }: InstallInstructionsDialogProps) => {
  const { isInstallable, installApp } = usePWA();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (success) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>App installieren</DialogTitle>
        </DialogHeader>
        
        {isInstallable ? (
          <div className="space-y-4">
            <p>Klicke auf den Button, um die App zu installieren:</p>
            <Button onClick={handleInstall} className="w-full">
              App installieren
            </Button>
          </div>
        ) : isIOS ? (
          <div className="space-y-4">
            <p>Um die App auf iOS zu installieren:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Tippe auf das Teilen-Symbol (📤) unten in Safari</li>
              <li>Scrolle nach unten und tippe auf "Zum Home-Bildschirm"</li>
              <li>Tippe auf "Hinzufügen"</li>
            </ol>
          </div>
        ) : isAndroid ? (
          <div className="space-y-4">
            <p>Um die App auf Android zu installieren:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Tippe auf das Menü-Symbol (⋮) oben rechts in Chrome</li>
              <li>Tippe auf "App installieren" oder "Zum Startbildschirm hinzufügen"</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-4">
            <p>Um die App auf dem Desktop zu installieren:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Klicke auf das Installations-Symbol in der Adressleiste</li>
              <li>Oder öffne das Browser-Menü und wähle "App installieren"</li>
            </ol>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

### Schritt 5: Conditional Rendering für Standalone-Mode

```typescript
// src/hooks/useIsStandalone.ts
import { useState, useEffect } from 'react';

export const useIsStandalone = (): boolean => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => mediaQuery.removeEventListener('change', checkStandalone);
  }, []);

  return isStandalone;
};

// Verwendung in Layout-Komponenten:
const Footer = () => {
  const isStandalone = useIsStandalone();
  
  // Footer nur im Browser anzeigen, nicht in PWA
  if (isStandalone) return null;
  
  return <footer>...</footer>;
};
```

---

## Best Practices

1. **Icons bereitstellen:** Mindestens 192x192 und 512x512 PNG Icons
2. **Maskable Icons:** Für Android Adaptive Icons ein maskable Icon erstellen
3. **Offline-First:** Kritische Assets cachen, Offline-Fallback-Seite bereitstellen
4. **Update-Handling:** Nutzer über neue Versionen informieren
5. **Conditional UI:** UI-Elemente je nach Installationsstatus anzeigen/verstecken

---

## Checkliste

- [ ] `vite-plugin-pwa` installiert und konfiguriert
- [ ] PWAContext erstellt und in App integriert
- [ ] Service Worker registriert
- [ ] Install-Dialog für alle Plattformen implementiert
- [ ] Icons in richtigen Größen bereitgestellt
- [ ] Conditional Rendering für Standalone-Mode
- [ ] Offline-Caching-Strategie definiert

---

## Querverweise

- **06-UI-UX-Pattern:** Design-System-Integration für PWA-spezifische UI
- **16-i18n-Pattern:** Mehrsprachige Install-Dialoge

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
