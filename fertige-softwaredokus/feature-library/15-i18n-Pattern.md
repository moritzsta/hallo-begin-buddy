# 15-i18n-Pattern

## Überblick

**Was:** Lightweight Internationalisierung ohne externe Libraries wie react-i18next, basierend auf React Context und TypeScript-Objects.

**Wann verwenden:**
- Für Apps mit wenigen Sprachen (2-3)
- Wenn volle Kontrolle über Translations gewünscht ist
- Als schlanke Alternative zu react-i18next

**Komplexität:** Niedrig

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                      i18n System                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │          LanguageContext.tsx             │               │
│  │  - language: 'de' | 'en'                 │               │
│  │  - setLanguage()                         │               │
│  │  - localStorage Persistence              │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├───────────────────┬───────────────────┐        │
│           ▼                   ▼                   ▼        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ translations.ts │ │ protected       │ │ tour            ││
│  │ (Public Pages)  │ │ Translations.ts │ │ Translations.ts ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │          useTranslation() Hook           │               │
│  │  - Auto-detect current language          │               │
│  │  - Return typed translation object       │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Language Context

```typescript
// src/contexts/LanguageContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // 1. Check localStorage
    const stored = localStorage.getItem('preferred-language');
    if (stored === 'de' || stored === 'en') return stored;
    
    // 2. Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de') return 'de';
    
    // 3. Default to German
    return 'de';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
```

### Schritt 2: Translation Objects

```typescript
// src/i18n/translations.ts (Öffentliche Seiten)
export const translationsDE = {
  common: {
    loading: 'Laden...',
    error: 'Fehler',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schließen',
  },
  landing: {
    hero: {
      title: 'Verwalte deine KI-Prompts intelligent',
      subtitle: 'Organisiere, optimiere und teile deine Prompts an einem Ort.',
      cta: 'Kostenlos starten',
    },
    features: {
      title: 'Features',
      organize: 'Organisieren',
      organizeDesc: 'Ordne deine Prompts in Ordnern und mit Tags.',
      improve: 'Verbessern',
      improveDesc: 'Nutze KI zur Optimierung deiner Prompts.',
      share: 'Teilen',
      shareDesc: 'Teile Prompts und Ordner mit deinem Team.',
    },
  },
  footer: {
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    imprint: 'Impressum',
  },
};

export const translationsEN = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  landing: {
    hero: {
      title: 'Manage your AI prompts intelligently',
      subtitle: 'Organize, optimize and share your prompts in one place.',
      cta: 'Start for free',
    },
    features: {
      title: 'Features',
      organize: 'Organize',
      organizeDesc: 'Organize your prompts in folders and with tags.',
      improve: 'Improve',
      improveDesc: 'Use AI to optimize your prompts.',
      share: 'Share',
      shareDesc: 'Share prompts and folders with your team.',
    },
  },
  footer: {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    imprint: 'Imprint',
  },
};

export type Translations = typeof translationsDE;
```

### Schritt 3: Protected Translations (Eingeloggte Bereiche)

```typescript
// src/i18n/protectedTranslations.ts
export const protectedTranslationsDE = {
  dashboard: {
    title: 'Dashboard',
    welcome: 'Willkommen zurück',
    recentPrompts: 'Letzte Prompts',
    noPrompts: 'Noch keine Prompts vorhanden',
  },
  promptCard: {
    copy: 'Kopieren',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    share: 'Teilen',
    analyze: 'Analysieren',
    improve: 'Verbessern',
    versions: 'Versionen',
    confirmDelete: 'Prompt wirklich löschen?',
    toasts: {
      copied: {
        title: 'Kopiert',
        description: 'Prompt in Zwischenablage kopiert.',
      },
      deleted: {
        title: 'Gelöscht',
        description: 'Prompt wurde gelöscht.',
      },
    },
  },
  sidebar: {
    allPrompts: 'Alle Prompts',
    folders: 'Ordner',
    newFolder: 'Neuer Ordner',
    shared: 'Geteilt',
    duplicated: 'Dupliziert',
  },
  // Dynamische Strings mit Parametern
  trialCountdown: {
    daysRemaining: (days: number) => `${days} Tage verbleibend`,
    hoursRemaining: (hours: number) => `${hours} Stunden verbleibend`,
    lessThanOneHour: 'Weniger als 1 Stunde',
  },
};

export const protectedTranslationsEN = {
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back',
    recentPrompts: 'Recent Prompts',
    noPrompts: 'No prompts yet',
  },
  promptCard: {
    copy: 'Copy',
    edit: 'Edit',
    delete: 'Delete',
    share: 'Share',
    analyze: 'Analyze',
    improve: 'Improve',
    versions: 'Versions',
    confirmDelete: 'Really delete this prompt?',
    toasts: {
      copied: {
        title: 'Copied',
        description: 'Prompt copied to clipboard.',
      },
      deleted: {
        title: 'Deleted',
        description: 'Prompt was deleted.',
      },
    },
  },
  sidebar: {
    allPrompts: 'All Prompts',
    folders: 'Folders',
    newFolder: 'New Folder',
    shared: 'Shared',
    duplicated: 'Duplicated',
  },
  trialCountdown: {
    daysRemaining: (days: number) => `${days} days remaining`,
    hoursRemaining: (hours: number) => `${hours} hours remaining`,
    lessThanOneHour: 'Less than 1 hour',
  },
};

export type ProtectedTranslations = typeof protectedTranslationsDE;
```

### Schritt 4: useTranslation Hook

```typescript
// src/i18n/translations.ts (ergänzen)
import { useLanguage } from '@/contexts/LanguageContext';

// Hook für öffentliche Seiten
export const useTranslation = () => {
  const { language } = useLanguage();
  const t = language === 'de' ? translationsDE : translationsEN;
  return { t, language };
};

// Hook für geschützte Bereiche
export const useProtectedTranslation = () => {
  const { language } = useLanguage();
  const t = language === 'de' ? protectedTranslationsDE : protectedTranslationsEN;
  return { t, language };
};
```

### Schritt 5: Verwendung in Komponenten

```typescript
// Öffentliche Seite
import { useTranslation } from '@/i18n/translations';

const LandingPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t.landing.hero.title}</h1>
      <p>{t.landing.hero.subtitle}</p>
      <Button>{t.landing.hero.cta}</Button>
    </div>
  );
};

// Geschützter Bereich
import { useLanguage } from '@/contexts/LanguageContext';
import { protectedTranslationsDE, protectedTranslationsEN } from '@/i18n/protectedTranslations';

const PromptCard = () => {
  const { language } = useLanguage();
  const t = language === 'de' ? protectedTranslationsDE : protectedTranslationsEN;
  
  return (
    <div>
      <Button>{t.promptCard.copy}</Button>
      <Button>{t.promptCard.edit}</Button>
      {/* Dynamischer String */}
      <span>{t.trialCountdown.daysRemaining(5)}</span>
    </div>
  );
};
```

### Schritt 6: Sprach-Umschalter

```typescript
// In ProfileMenu oder Settings
import { useLanguage, Language } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {languages.find(l => l.code === language)?.flag} {language.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.flag} {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## Best Practices

1. **Typisierung:** Alle Translations als TypeScript-Objekte für Autocompletion
2. **Trennung:** Public vs. Protected Translations in separate Dateien
3. **Dynamische Strings:** Funktionen für Strings mit Parametern
4. **Fallback:** Default-Sprache wenn nicht gesetzt
5. **Persistenz:** Sprachauswahl in localStorage speichern
6. **Browser-Detection:** Initial Browser-Sprache erkennen
7. **Konsistenz:** Gleiche Struktur in allen Sprach-Objekten

---

## Translations-Struktur

```
src/i18n/
├── translations.ts           # Öffentliche Seiten (Landing, Footer, etc.)
├── protectedTranslations.ts  # Eingeloggte Bereiche (Dashboard, Prompts)
└── tourTranslations.ts       # Guided Tour Texte (optional)
```

---

## Checkliste

- [ ] LanguageContext erstellt
- [ ] LanguageProvider in App integriert
- [ ] translations.ts für öffentliche Bereiche
- [ ] protectedTranslations.ts für geschützte Bereiche
- [ ] useTranslation Hook(s) erstellt
- [ ] Sprach-Umschalter in UI
- [ ] localStorage Persistenz
- [ ] Browser-Sprache als Fallback
- [ ] Alle Texte in allen Sprachen vorhanden

---

## Querverweise

- **06-UI-UX-Pattern:** Sprach-Umschalter UI
- **10-Guided-Tour-Pattern:** Tour-Translations

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
