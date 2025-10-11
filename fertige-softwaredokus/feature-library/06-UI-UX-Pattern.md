# UI/UX Pattern
**Kategorie:** Frontend & Design System  
**Verwendung in:** Smarte Dokumentenablage, PromptManager, Handwerker Marketplace  
**Komplexität:** Mittel  
**Dependencies:** React, TailwindCSS, shadcn/ui, next-themes

---

## Überblick

Dieses Pattern beschreibt wiederverwendbare UI/UX-Muster für:
- Theme Management (Light/Dark/Custom)
- Design System mit HSL-Tokens
- Responsive Design Patterns
- shadcn/ui Best Practices
- Internationalisierung (i18n)
- Loading States & Skeletons
- Toast Notifications

---

## Architektur

### Design System Pyramide
```
┌────────────────────────────────────┐
│   Design Tokens (HSL Variables)    │  ← index.css
├────────────────────────────────────┤
│   Tailwind Config (Semantic Names) │  ← tailwind.config.ts
├────────────────────────────────────┤
│   shadcn/ui Components (Variants)  │  ← components/ui/*
├────────────────────────────────────┤
│   Custom Components (Composition)  │  ← components/*
└────────────────────────────────────┘
```

---

## 1. Theme Management

### Use Case
- Light/Dark Mode Support
- Custom Theme (z.B. "Colorful" in Dokumentenablage)
- User Preferences persistent speichern

### Implementierung

**ThemeProvider Setup:**
```typescript
// src/App.tsx oder src/main.tsx
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="app-theme"
    >
      {/* App Content */}
    </ThemeProvider>
  );
}
```

**Theme Switcher Component:**
```typescript
// src/components/ThemeSwitcher.tsx
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes = [
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
  { value: 'colorful', label: 'Farbenfroh', icon: Palette },
] as const;

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Theme wechseln</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {theme === value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

**Persistence in Supabase:**
```typescript
// Bei Theme-Änderung: in profiles speichern
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useThemeSync = () => {
  const { theme, setTheme } = useTheme();
  const { user, profile } = useAuth();

  // Theme beim Login laden
  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme]);

  // Theme bei Änderung speichern
  const syncTheme = async (newTheme: string) => {
    setTheme(newTheme);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', user.id);
    }
  };

  return { theme, syncTheme };
};
```

---

## 2. Design System (HSL-Token-System)

### Prinzip: Semantic Color Tokens

**KRITISCH:** Niemals direkte Farben verwenden (`text-white`, `bg-red-500`), sondern **immer** semantische Tokens!

### index.css - Design Tokens

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base Colors (HSL ohne hsl()) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    /* Primary */
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    
    /* Secondary */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    /* Accent */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    /* Muted */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    /* Destructive */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    /* Border & Input */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    
    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }

  /* Custom Theme: Colorful */
  .colorful {
    --background: 280 60% 98%;
    --foreground: 280 80% 10%;
    --primary: 280 80% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 320 70% 60%;
    --accent: 200 80% 60%;
    --muted: 280 40% 95%;
    --border: 280 40% 85%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### tailwind.config.ts - Semantic Mapping

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### Usage in Components

```typescript
// ✅ RICHTIG - Semantic Tokens verwenden
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Speichern
</Button>

<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  Card Content
</div>

// ❌ FALSCH - Direkte Farben
<Button className="bg-blue-500 text-white hover:bg-blue-600">
  Speichern
</Button>
```

---

## 3. Responsive Design Patterns

### Mobile-First Breakpoints

```typescript
// src/hooks/use-mobile.tsx
import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

### Responsive Component Patterns

**Adaptive Layout:**
```typescript
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export const AdaptiveModal = ({ children, trigger }: {
  children: React.ReactNode;
  trigger: React.ReactNode;
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile: Sheet (Bottom Drawer)
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom">
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog (Modal)
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  );
};
```

**Responsive Grid:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

**Responsive Navigation:**
```typescript
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export const ResponsiveNav = ({ items }: { items: NavItem[] }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col gap-4">
            {items.map(item => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="flex gap-6">
      {items.map(item => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
};
```

---

## 4. shadcn/ui Best Practices

### Component Variants

**Button mit Custom Variants:**
```typescript
// src/components/ui/button.tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Custom Variants
        gradient: 'bg-gradient-to-r from-primary to-secondary text-primary-foreground',
        success: 'bg-green-600 text-white hover:bg-green-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export { Button, buttonVariants };
```

### Composable Components

**Example: DocumentCard**
```typescript
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Share } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  type: string;
  size: string;
  onDownload: () => void;
  onShare: () => void;
}

export const DocumentCard = ({ title, type, size, onDownload, onShare }: DocumentCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Badge variant="secondary">{type}</Badge>
          <Badge variant="outline">{size}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share className="h-4 w-4 mr-2" />
          Teilen
        </Button>
      </CardFooter>
    </Card>
  );
};
```

---

## 5. Internationalisierung (i18n)

### Setup mit react-i18next

**Config:**
```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: 'de',
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**Translation Files:**
```json
// src/i18n/locales/de.json
{
  "auth": {
    "login": "Anmelden",
    "logout": "Abmelden",
    "email": "E-Mail",
    "password": "Passwort"
  },
  "documents": {
    "title": "Dokumente",
    "upload": "Hochladen",
    "empty": "Keine Dokumente vorhanden"
  }
}
```

**Usage in Components:**
```typescript
import { useTranslation } from 'react-i18next';

export const LoginForm = () => {
  const { t } = useTranslation();

  return (
    <form>
      <Label>{t('auth.email')}</Label>
      <Input type="email" />
      
      <Label>{t('auth.password')}</Label>
      <Input type="password" />
      
      <Button>{t('auth.login')}</Button>
    </form>
  );
};
```

**Language Switcher:**
```typescript
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2">
      <Button
        variant={i18n.language === 'de' ? 'default' : 'outline'}
        size="sm"
        onClick={() => i18n.changeLanguage('de')}
      >
        DE
      </Button>
      <Button
        variant={i18n.language === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => i18n.changeLanguage('en')}
      >
        EN
      </Button>
    </div>
  );
};
```

---

## 6. Loading States & Skeletons

### Skeleton Components

```typescript
// src/components/ui/skeleton.tsx
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
};

// Usage: Document List Skeleton
export const DocumentListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

### Suspense Pattern

```typescript
import { Suspense } from 'react';
import { DocumentList } from './DocumentList';
import { DocumentListSkeleton } from './DocumentListSkeleton';

export const DocumentsPage = () => {
  return (
    <Suspense fallback={<DocumentListSkeleton />}>
      <DocumentList />
    </Suspense>
  );
};
```

---

## 7. Toast Notifications

### Setup mit sonner

```typescript
// src/main.tsx
import { Toaster } from '@/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
```

### Usage

```typescript
import { toast } from 'sonner';

// Success
toast.success('Dokument erfolgreich hochgeladen');

// Error
toast.error('Upload fehlgeschlagen', {
  description: 'Bitte versuchen Sie es erneut.',
});

// Loading
const toastId = toast.loading('Dokument wird verarbeitet...');
// Later:
toast.success('Fertig!', { id: toastId });

// Custom Action
toast('Dokument gelöscht', {
  action: {
    label: 'Rückgängig',
    onClick: () => restoreDocument(),
  },
});
```

---

## Best Practices

### Theme Management
- **System Preference**: Immer `enableSystem` aktivieren
- **Persistence**: Theme in `profiles` speichern
- **Preload**: Theme vor Render laden (Flash vermeiden)

### Design System
- **Niemals direkte Farben**: `text-white` → `text-primary-foreground`
- **HSL Format**: Ohne `hsl()` in CSS-Variablen
- **Kontrast-Check**: WCAG AA Standard (4.5:1 Ratio)

### Responsive Design
- **Mobile-First**: Basis-Styles für Mobile, dann Breakpoints
- **Touch-Targets**: Min. 44x44px für Buttons
- **Adaptive Components**: Sheet (Mobile) vs Dialog (Desktop)

### shadcn/ui
- **Variants nutzen**: Nicht jedes Mal neue Classes
- **Composition**: Kleine, wiederverwendbare Components
- **Accessibility**: aria-labels, keyboard navigation

### i18n
- **Nested Keys**: Struktur nach Features (`auth.login`)
- **Interpolation**: `t('welcome', { name: 'Max' })`
- **Plurals**: `t('items', { count: 5 })`

---

## Checkliste für Implementierung

- [ ] ThemeProvider integriert
- [ ] Design Tokens in index.css definiert
- [ ] tailwind.config.ts konfiguriert
- [ ] Theme Switcher Component erstellt
- [ ] Theme Persistence in Supabase
- [ ] Responsive Breakpoints getestet
- [ ] shadcn/ui Components installiert
- [ ] Custom Variants für Buttons/Cards
- [ ] i18n Setup mit react-i18next
- [ ] Translation Files erstellt (DE/EN)
- [ ] Skeleton Components implementiert
- [ ] Toast Notifications konfiguriert
- [ ] Accessibility getestet (Keyboard, Screen Reader)

---

## Häufige Fehler & Lösungen

**Problem:** Theme-Flash beim Laden  
**Lösung:** Theme aus localStorage preloaden mit Inline-Script in index.html

**Problem:** HSL-Farben funktionieren nicht  
**Lösung:** `hsl()` NICHT in CSS-Variablen, nur Werte (`222.2 47.4% 11.2%`)

**Problem:** Mobile Navigation überlappt Content  
**Lösung:** `z-index` Hierarchie prüfen, Sheet sollte `z-50` haben

**Problem:** Translations laden nicht  
**Lösung:** `i18n.init()` in `main.tsx` **vor** `ReactDOM.render()`

---

## Querverweise
- → `01-Auth-Profile-Pattern.md` (Theme/Locale Persistence)
- → `05-Datenstruktur-Pattern.md` (Tree Component Styling)
- → `08-File-Management-Pattern.md` (Upload UI Components)
