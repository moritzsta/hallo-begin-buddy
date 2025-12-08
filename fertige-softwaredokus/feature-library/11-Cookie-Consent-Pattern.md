# 11-Cookie-Consent-Pattern

## Überblick

**Was:** DSGVO-konforme Cookie-Verwaltung mit Kategorien, Consent-Banner und detaillierten Einstellungen.

**Wann verwenden:**
- Für alle Apps die Cookies/localStorage nutzen
- Bei Einsatz von Analytics, Tracking oder Marketing-Tools
- Für EU-Compliance (DSGVO/GDPR)

**Komplexität:** Niedrig

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                   Cookie Consent System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │        CookieConsentContext.tsx         │               │
│  │  - preferences (necessary, functional)   │               │
│  │  - hasConsent boolean                    │               │
│  │  - acceptAll(), acceptNecessary()        │               │
│  │  - resetConsent()                        │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├────────────────────┬───────────────────┐       │
│           ▼                    ▼                   ▼       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  CookieConsent  │  │ CookieSettings  │  │  Footer     │ │
│  │    Banner       │  │    Dialog       │  │   Link      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Cookie Consent Context

```typescript
// src/contexts/CookieConsentContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface CookiePreferences {
  timestamp: string;
  version: string;
  necessary: boolean;      // Immer true
  functional: boolean;     // Spracheinstellungen, Theme, etc.
  analytics?: boolean;     // Google Analytics, etc.
  marketing?: boolean;     // Werbe-Cookies
}

interface CookieConsentContextValue {
  preferences: CookiePreferences | null;
  hasConsent: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  updatePreferences: (prefs: Partial<CookiePreferences>) => void;
  resetConsent: () => void;
  hasCategory: (category: CookieCategory) => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

const STORAGE_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0';

const defaultPreferences: CookiePreferences = {
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
  necessary: true,
  functional: false,
};

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        // Version-Check: Bei neuer Version erneut fragen
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed);
          setHasConsent(true);
        }
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setPreferences(prefs);
      setHasConsent(true);
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
    }
  };

  const acceptAll = () => {
    savePreferences({
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptNecessary = () => {
    savePreferences({
      ...defaultPreferences,
      timestamp: new Date().toISOString(),
    });
  };

  const updatePreferences = (prefs: Partial<CookiePreferences>) => {
    savePreferences({
      ...(preferences || defaultPreferences),
      ...prefs,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      necessary: true, // always true
    });
  };

  const resetConsent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPreferences(null);
      setHasConsent(false);
    } catch (error) {
      console.error('Error resetting cookie preferences:', error);
    }
  };

  const hasCategory = (category: CookieCategory): boolean => {
    if (!preferences) return false;
    return preferences[category] === true;
  };

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsent,
        acceptAll,
        acceptNecessary,
        updatePreferences,
        resetConsent,
        hasCategory,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};
```

### Schritt 2: Cookie Consent Banner

```typescript
// src/components/CookieConsent.tsx
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useState } from 'react';
import { CookieSettings } from './CookieSettings';

export const CookieConsent = () => {
  const { hasConsent, acceptAll, acceptNecessary } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  if (hasConsent) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Cookie-Einstellungen</h3>
              <p className="text-sm text-muted-foreground">
                Wir nutzen Cookies, um Ihre Erfahrung zu verbessern. 
                Einige sind notwendig, andere helfen uns die Seite zu optimieren.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowSettings(true)}>
                Einstellungen
              </Button>
              <Button variant="outline" onClick={acceptNecessary}>
                Nur Notwendige
              </Button>
              <Button onClick={acceptAll}>
                Alle akzeptieren
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CookieSettings open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};
```

### Schritt 3: Detaillierte Cookie-Einstellungen

```typescript
// src/components/CookieSettings.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useState } from 'react';

interface CookieSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CookieSettings = ({ open, onOpenChange }: CookieSettingsProps) => {
  const { preferences, updatePreferences } = useCookieConsent();
  
  const [functional, setFunctional] = useState(preferences?.functional ?? false);
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false);
  const [marketing, setMarketing] = useState(preferences?.marketing ?? false);

  const handleSave = () => {
    updatePreferences({
      functional,
      analytics,
      marketing,
    });
    onOpenChange(false);
  };

  const cookieCategories = [
    {
      id: 'necessary',
      name: 'Notwendig',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich.',
      enabled: true,
      disabled: true, // Cannot be disabled
    },
    {
      id: 'functional',
      name: 'Funktional',
      description: 'Speichern Ihre Einstellungen wie Sprache und Theme.',
      enabled: functional,
      onChange: setFunctional,
    },
    {
      id: 'analytics',
      name: 'Analyse',
      description: 'Helfen uns zu verstehen, wie Besucher die Website nutzen.',
      enabled: analytics,
      onChange: setAnalytics,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Werden für personalisierte Werbung verwendet.',
      enabled: marketing,
      onChange: setMarketing,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Wählen Sie, welche Cookies Sie akzeptieren möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cookieCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-start justify-between gap-4 p-3 rounded-lg border"
            >
              <div className="flex-1">
                <Label className="font-medium">{category.name}</Label>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Switch
                checked={category.enabled}
                onCheckedChange={category.onChange}
                disabled={category.disabled}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Einstellungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### Schritt 4: Integration in Footer

```tsx
// src/components/Footer.tsx
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CookieSettings } from './CookieSettings';
import { useState } from 'react';

export const Footer = () => {
  const { resetConsent } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <footer className="...">
      {/* ... andere Footer-Inhalte ... */}
      
      <div className="flex gap-4 text-sm text-muted-foreground">
        <Link to="/privacy">Datenschutz</Link>
        <button 
          onClick={() => setShowSettings(true)}
          className="hover:underline"
        >
          Cookie-Einstellungen
        </button>
      </div>
      
      <CookieSettings open={showSettings} onOpenChange={setShowSettings} />
    </footer>
  );
};
```

### Schritt 5: Conditional Feature Loading

```typescript
// Beispiel: Analytics nur laden wenn erlaubt
import { useCookieConsent } from '@/contexts/CookieConsentContext';

const AnalyticsLoader = () => {
  const { hasCategory } = useCookieConsent();
  
  useEffect(() => {
    if (hasCategory('analytics')) {
      // Google Analytics laden
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
      document.head.appendChild(script);
    }
  }, [hasCategory]);

  return null;
};
```

---

## Best Practices

1. **Consent First:** Keine Cookies setzen vor expliziter Zustimmung
2. **Necessary Always On:** Notwendige Cookies nicht deaktivierbar
3. **Versionierung:** Bei Änderungen der Cookie-Policy erneut fragen
4. **Detaillierte Kontrolle:** Nutzer sollen Kategorien einzeln wählen können
5. **Leichter Zugang:** Cookie-Einstellungen jederzeit erreichbar (Footer)
6. **Reset-Option:** Möglichkeit, Zustimmung zurückzuziehen

---

## Cookie-Kategorien

| Kategorie | Beispiele | Immer aktiv? |
|-----------|-----------|--------------|
| Notwendig | Session, CSRF, Auth | ✅ Ja |
| Funktional | Sprache, Theme, Preferences | ❌ Nein |
| Analyse | Google Analytics, Hotjar | ❌ Nein |
| Marketing | Facebook Pixel, Ad Tracking | ❌ Nein |

---

## Checkliste

- [ ] CookieConsentContext erstellt
- [ ] Consent-Banner mit 3 Optionen (Alle, Notwendig, Einstellungen)
- [ ] Detaillierte Cookie-Einstellungen Dialog
- [ ] Versionierung der Consent-Preferences
- [ ] Reset-Funktion implementiert
- [ ] Footer-Link zu Cookie-Einstellungen
- [ ] Conditional Loading für Analytics/Marketing
- [ ] Datenschutzerklärung verlinkt

---

## Querverweise

- **16-i18n-Pattern:** Mehrsprachige Cookie-Texte
- **06-UI-UX-Pattern:** Dialog-Styling

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
