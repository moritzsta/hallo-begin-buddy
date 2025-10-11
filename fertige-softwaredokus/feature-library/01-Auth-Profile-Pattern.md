# Auth & Profile Pattern
**Kategorie:** Authentifizierung & Benutzerverwaltung  
**Verwendung in:** Smarte Dokumentenablage, PromptManager, Handwerker Marketplace  
**Komplexität:** Mittel  
**Dependencies:** Supabase Auth, PostgreSQL

---

## Überblick

Dieses Pattern beschreibt die Implementierung von Authentifizierung und Profilverwaltung mit Supabase Auth, einschließlich:
- Email/Password Authentication
- Profile-Management mit erweiterten Daten
- Gastbenutzer-Workflow (optional)
- Automatische Profile-Erstellung bei Registrierung
- RLS-Policies für Profile-Zugriff

---

## Architektur

### Komponenten
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Supabase Auth  │────▶│  auth.users     │────▶│  profiles       │
│  (Email/PW)     │     │  (System)       │     │  (Custom)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  AuthContext    │                           │  RLS Policies   │
│  (Frontend)     │                           │  (Security)     │
└─────────────────┘                           └─────────────────┘
```

### Datenfluss
1. Benutzer registriert sich → `auth.users` Eintrag
2. Trigger `handle_new_user()` → `profiles` Eintrag erstellen
3. Frontend lädt Profile-Daten via RLS-gesicherte Query
4. Profile-Updates nur durch Owner möglich

---

## Implementierung

### 1. Datenbank-Schema

```sql
-- Profiles Tabelle (Basis-Version)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  plan_tier text DEFAULT 'free',
  locale text DEFAULT 'de',
  theme text DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Erweiterte Version (PromptManager)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  email text,
  avatar_url text,
  plan_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Erweiterte Version mit Gastbenutzer (Handwerker Marketplace)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL, -- 'customer' | 'craftsman' | 'admin'
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  registered boolean DEFAULT true,
  access_token text, -- für Gastbenutzer
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Automatische Profile-Erstellung (Trigger)

```sql
-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, locale, theme)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'light')
  );
  RETURN NEW;
END;
$$;

-- Trigger erstellen
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3. RLS Policies

```sql
-- RLS aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Benutzer können ihr eigenes Profil sehen
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Benutzer können ihr eigenes Profil aktualisieren
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- OPTIONAL: Öffentliche Profile (für Marketplace, Sharing)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);
```

### 4. Frontend-Integration (React)

**AuthContext.tsx:**
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  plan_tier?: string;
  locale?: string;
  theme?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile laden
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  // Auth State Listener
  useEffect(() => {
    // Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign Up
  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    
    return { error };
  };

  // Sign In
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Refresh Profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Protected Route Component:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

---

## Varianten & Erweiterungen

### Gastbenutzer-Workflow (Handwerker Marketplace)

**Zweck:** Benutzer können ohne initiale Registrierung Projekte erstellen.

**Datenbank-Erweiterung:**
```sql
-- Temporäre Projektspeicherung
CREATE TABLE public.pending_projects (
  email text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  questions_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Trigger bei E-Mail-Bestätigung
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Profile erstellen
  INSERT INTO public.profiles (user_id, email, registered)
  VALUES (NEW.id, NEW.email, true);
  
  -- Projekt übertragen
  INSERT INTO public.projects (customer_id, title, description, ...)
  SELECT NEW.id, title, description, ...
  FROM public.pending_projects
  WHERE email = NEW.email;
  
  -- Cleanup
  DELETE FROM public.pending_projects WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION handle_user_email_confirmed();
```

### Multi-Role System (Handwerker Marketplace)

**Enum für Rollen:**
```sql
CREATE TYPE user_role AS ENUM ('customer', 'craftsman', 'admin');

-- Profile mit Rolle
ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'customer';
```

**RLS für Rollen:**
```sql
-- Admin kann alle Profile sehen
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Best Practices

### Security
- **IMMER** `SECURITY DEFINER` bei Trigger-Functions verwenden
- **NIEMALS** `auth.users` direkt referenzieren (nur `id`)
- Email-Bestätigung aktivieren (außer in Dev-Umgebung)
- `emailRedirectTo` bei SignUp IMMER setzen

### Performance
- Profile-Daten cachen in Frontend (AuthContext)
- Optimistic Updates für Profile-Änderungen
- Index auf `email` für schnelle Lookups

### UX
- Loading-States während Auth-Checks
- Freundliche Fehlermeldungen
- Auto-Redirect nach Login/Logout

---

## Checkliste für Implementierung

- [ ] `profiles` Tabelle erstellt
- [ ] `handle_new_user()` Trigger implementiert
- [ ] RLS Policies aktiviert und getestet
- [ ] AuthContext im Frontend integriert
- [ ] Protected Routes eingerichtet
- [ ] Email-Bestätigung konfiguriert
- [ ] Redirect-URLs in Supabase gesetzt
- [ ] Error Handling implementiert
- [ ] Loading States hinzugefügt
- [ ] Auto-Confirm für Dev aktiviert (optional)

---

## Häufige Fehler & Lösungen

**Problem:** Profile wird nicht erstellt nach SignUp  
**Lösung:** Trigger prüfen, `SECURITY DEFINER` sicherstellen

**Problem:** "requested path is invalid" bei Login  
**Lösung:** Site URL und Redirect URLs in Supabase Auth Settings konfigurieren

**Problem:** RLS blockiert Profile-Zugriff  
**Lösung:** Policies prüfen, `auth.uid()` korrekt verwenden

**Problem:** Session geht verloren  
**Lösung:** Session-State und User-State beide speichern, nicht nur User

---

## Querverweise
- → `02-Subscription-Feature-Gating-Pattern.md` (plan_tier Nutzung)
- → `03-Security-Pattern.md` (RLS Details)
- → `07-UI-UX-Pattern.md` (Auth-UI Components)
