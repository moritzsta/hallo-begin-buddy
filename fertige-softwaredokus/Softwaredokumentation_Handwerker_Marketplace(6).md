# Software-Dokumentation: Handwerker Marketplace

**Version:** 2.0  
**Datum:** 3. September 2025
**Projekt:** Handwerker Marketplace Platform

---

## 1. Einleitung & Überblick

### 1.1 Zweck & Zielgruppe

Dieses Dokument stellt eine umfassende Softwaredokumentation für den Handwerker Marketplace dar - eine Online-Plattform, die Kunden mit verifizierten Handwerkern verbindet. 

**Zielgruppe:**
- Entwickler und technische Teams
- Projektmanager und Stakeholder
- QA/Testing Teams
- DevOps und Infrastruktur-Teams
- Externe Entwickler für künftige Erweiterungen

### 1.2 Projektzusammenfassung

Der Handwerker Marketplace ist eine webbasierte Plattform, die als vertrauensvolles Ökosystem zwischen Kunden und Handwerkern fungiert. 

**Hauptziele:**
- Vereinfachung der Handwerker-Suche für Privat- und Geschäftskunden
- Bereitstellung einer verifizierten Handwerker-Datenbank
- Automatisierung von Angebotsprozessen und Projektmanagement
- Integration einer kostenlosen Rechnungsstellung über Stripe Invoice API
- Aufbau eines nachhaltigen Geschäftsmodells durch Abonnement-Gebühren

**Scope:**
- Vollständige Projektabwicklung von Erstellung bis Bewertung
- Gastzugang für Projekterstellung ohne initiale Registrierung
- Echtzeit-Kommunikation zwischen Beteiligten
- Administratives Back-Office für Handwerker
- Verifizierungssystem für Qualitätssicherung
- Multi-Platform-Anwendung: Web-Browser, iOS und Android Apps
- Cross-Platform-Entwicklung mit Capacitor für native Mobile-Features

### 1.3 Dokumentenstruktur

1. **Einleitung & Überblick** - Projektzusammenfassung und Dokumentationszweck
2. **Systemarchitektur** - Technische Architektur und Komponentenübersicht
3. **Daten- & Datenmodell-Design** - Datenbankstruktur und Datenflüsse
4. **Schnittstellen** - APIs, externe Integrationen und Sicherheit
5. **Komponentendesign** - Detaillierte Komponentenbeschreibungen
6. **Benutzeroberfläche** - UI-Design und User Experience
7. **Anforderungen (Requirements/SRD)** - Funktionale und nicht-funktionale Anforderungen
8. **Annahmen & Abhängigkeiten** - Technische Grundlagen und externe Faktoren
9. **Glossar & Begriffe** - Definitionen und Terminologie

---

## 2. Systemarchitektur

### 2.1 Architekturdiagramm

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Supabase      │    │   Stripe        │
│   (React/Vite)  │◄──►│   Backend       │◄──►│   Payment       │
│                 │    │                 │    │   Processing    │
├─────────────────┤    ├─────────────────┤    └─────────────────┘
│ • shadcn/ui     │    │ • PostgreSQL    │
│ • Tailwind CSS  │    │ • Auth System   │    ┌─────────────────┐
│ • React Router  │    │ • Edge Functions│    │   Vercel        │
│ • Tanstack Query│    │ • Realtime      │◄──►│   Hosting       │
│ • React Hook    │    │ • RLS Policies  │    │                 │
│   Form + Zod    │    │ • Storage       │    └─────────────────┘
└─────────────────┘    └─────────────────┘
        ▲
        │ Shared Codebase
        ▼
┌─────────────────┐    ┌─────────────────┐
│  Mobile Apps    │    │  App Stores     │
│  (Capacitor)    │◄──►│  Distribution   │
│                 │    │                 │
├─────────────────┤    ├─────────────────┤
│ • iOS App       │    │ • App Store     │
│ • Android App   │    │ • Play Store    │
│ • Native APIs   │    │ • Auto-Updates  │
│ • Push Notifications│ │ • Review Process│
└─────────────────┘    └─────────────────┘
```

### 2.2 Komponentenbeschreibung

**Frontend Layer (React/TypeScript)**
- **React 18** mit TypeScript für typisierte Entwicklung
- **Vite** als Build-Tool für optimierte Performance
- **shadcn/ui** Komponentenbibliothek für konsistentes Design
- **Tailwind CSS** mit semantischen Design-Tokens
- **React Router DOM** für client-seitiges Routing
- **Tanstack Query** für Server-State-Management
- **React Hook Form + Zod** für Formular-Validierung

**Backend Layer (Supabase)**
- **PostgreSQL** als primäre Datenbank
- **Supabase Auth** für Authentifizierung und Autorisierung
- **Row Level Security (RLS)** für datenbasierte Sicherheit
- **Edge Functions** für Server-seitige Logik
- **Realtime** für Live-Updates (Nachrichten, Projektstatuses)
- **Storage** für Datei-Uploads (geplant)

**Payment Layer (Stripe)**
- **Stripe Subscriptions** für wiederkehrende Handwerker-Gebühren
- **Stripe Invoice API** für kostenlose Rechnungsstellung
- Dual-Account-Struktur: Platform-Fees + Back-Office

**Mobile Layer (Capacitor)**
- **Capacitor** als Cross-Platform Framework für native Apps
- **iOS App** mit nativen iOS-Features und App Store Distribution
- **Android App** mit nativen Android-Features und Play Store Distribution
- **Shared Codebase** zwischen Web und Mobile für effiziente Entwicklung

**Hosting & Deployment**
- **Vercel** für Frontend-Hosting mit automatischem CI/CD
- **Supabase Cloud** für Backend-Services
- **GitHub Actions** für automatisierte Deployments
- **App Store Connect** für iOS App Distribution
- **Google Play Console** für Android App Distribution

### 2.3 Architektonische Entscheidungen

**Warum Supabase über traditionelles Backend:**
- Integrierte Auth-Lösung mit JWT
- RLS für sichere Multi-Tenancy
- Realtime-Funktionalität out-of-the-box
- Reduzierte Entwicklungszeit und Maintenance-Overhead

**Warum Stripe Invoice API:**
- Kostenlose Rechnungsstellung für Handwerker
- Einheitliche API für Subscriptions und Invoicing
- Europäische Compliance (GDPR, PCI-DSS)

**Warum React + TypeScript:**
- Starke Typisierung für weniger Runtime-Fehler
- Große Community und Ökosystem
- Optimale Performance durch React 18 Features

---

## 3. Daten- & Datenmodell-Design

### 3.1 Datenbankstruktur

**Kern-Entitäten:**

```sql
-- Benutzerprofile (erweitert Supabase Auth)
profiles {
  id: uuid (PK)
  user_id: uuid (FK zu auth.users, für registrierte Benutzer)
  email: text (NOT NULL)
  role: user_role (customer, craftsman, admin)
  first_name: text
  last_name: text
  phone: text
  avatar_url: text
  registered: boolean (DEFAULT true, für Gastbenutzer false)
  access_token: text (für Gastzugang)
  created_at: timestamptz
  updated_at: timestamptz
}

-- Handwerker-spezifische Profile
craftsman_profiles {
  id: uuid (PK)
  user_id: uuid (FK zu profiles)
  craft_categories: craft_category[]
  team_size: integer
  years_experience: integer
  hourly_rate_min: numeric
  hourly_rate_max: numeric
  work_radius_km: integer
  rating_speed: numeric
  rating_quality: numeric
  rating_reliability: numeric
  rating_friendliness: numeric
  total_ratings: integer
  created_at: timestamptz
  updated_at: timestamptz
}

-- Projekte
projects {
  id: uuid (PK)
  customer_id: uuid (FK zu profiles.user_id)
  title: text
  description: text
  category: project_category
  budget_min: numeric
  budget_max: numeric
  location: text
  preferred_start_date: date
  deadline: date
  status: project_status
  questions_data: jsonb (strukturierte Antworten aus Fragebogen)
  images: text[] (Array von Bild-URLs)
  created_at: timestamptz
  updated_at: timestamptz
}

-- Projekt-Angebote
project_bids {
  id: uuid (PK)
  project_id: uuid (FK zu projects)
  craftsman_id: uuid (FK zu profiles)
  bid_amount: numeric
  message: text
  proposed_start_date: date
  proposed_end_date: date
  is_accepted: boolean
  created_at: timestamptz
}

-- Nachrichten-System
messages {
  id: uuid (PK)
  sender_id: uuid (FK zu profiles)
  receiver_id: uuid (FK zu profiles)
  project_id: uuid (FK zu projects, optional)
  content: text
  is_read: boolean
  created_at: timestamptz
  updated_at: timestamptz
}

-- Rechnungssystem
invoices {
  id: uuid (PK)
  craftsman_id: uuid (FK zu profiles)
  customer_id: uuid (FK zu profiles)
  project_id: uuid (FK zu projects, optional)
  invoice_number: text (auto-generated)
  issue_date: date
  due_date: date
  total_amount: numeric
  tax_amount: numeric
  currency: text
  status: text
  notes: text
  stripe_invoice_id: text
  created_at: timestamptz
  updated_at: timestamptz
}

-- Rechnungspositionen
invoice_line_items {
  id: uuid (PK)
  invoice_id: uuid (FK zu invoices)
  description: text
  quantity: numeric
  unit_price: numeric
  total_amount: numeric
  created_at: timestamptz
}

-- Bewertungssystem
ratings {
  id: uuid (PK)
  project_id: uuid (FK zu projects)
  customer_id: uuid (FK zu profiles)
  craftsman_id: uuid (FK zu profiles)
  speed_rating: integer (1-5)
  quality_rating: integer (1-5)
  reliability_rating: integer (1-5)
  friendliness_rating: integer (1-5)
  comment: text
  created_at: timestamptz
}

-- Zwischenspeicherung für Gastbenutzer-Projekte (kritisch für Workflow)
pending_projects {
  email: text (PK, eindeutige Identifizierung für Gastbenutzer)
  user_id: uuid (FK zu auth.users, temporäre Zuordnung vor E-Mail-Bestätigung)
  title: text (NOT NULL)
  description: text (NOT NULL)
  category: project_category (NOT NULL)
  questions_data: jsonb (strukturierte Antworten aus Fragebogen)
  images: text[] (Array von Bild-URLs, optional)
  budget_min: numeric (optional)
  budget_max: numeric (optional)
  preferred_start_date: date (optional)
  deadline: date (optional)
  location: text (NOT NULL)
  created_at: timestamptz (DEFAULT now())
  updated_at: timestamptz (DEFAULT now())
}

-- Handwerker-Verifizierung
craftsman_verification {
  id: uuid (PK)
  user_id: uuid (FK zu profiles)
  status: verification_status
  submitted_at: timestamptz
  verified_at: timestamptz
  verified_by: uuid (FK zu profiles)
  business_license_url: text
  tax_number: text
  chamber_registration: text
  insurance_url: text
  qualification_urls: text[]
  admin_notes: text
}
```

**Enums:**
```sql
user_role: 'customer' | 'craftsman' | 'admin'
project_category: 'electrician' | 'plumber' | 'painter' | 'carpenter' | 'mason' | 'mechanic' | 'hvac' | 'it' | 'cleaner' | 'gardener'
project_status: 'draft' | 'published' | 'in_bidding' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
verification_status: 'pending' | 'verified' | 'rejected'
bid_status: 'pending' | 'accepted' | 'rejected'
invoice_status: 'draft' | 'sent' | 'paid' | 'overdue'
message_type: 'text' | 'file' | 'system'
```

### 3.2 Row Level Security (RLS) Policies

**Sicherheitsprinzipien:**
- Jeder Benutzer kann nur seine eigenen Daten einsehen und bearbeiten
- Öffentliche Daten (Profile, Projekte, Bewertungen) sind für alle lesbar
- Sensible Daten (Nachrichten, Rechnungen) nur für Beteiligte zugänglich
- Admin-Rollen haben erweiterte Berechtigungen für Verifizierung

**Beispiel-Policies:**
```sql
-- Benutzer können nur eigene Profile bearbeiten
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Anonyme Benutzer können Gastprofile erstellen
CREATE POLICY "Allow anonymous profile creation" ON profiles
FOR INSERT TO anon
WITH CHECK (registered = false);

-- Handwerker können nur eigene Angebote erstellen
CREATE POLICY "Craftsmen can insert bids" ON project_bids
FOR INSERT WITH CHECK (auth.uid() = craftsman_id);

-- Nachrichten nur zwischen Sender und Empfänger
CREATE POLICY "Users can view messages sent to them or by them" ON messages
FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- RLS Policies für pending_projects (kritisch für Gastbenutzer-Sicherheit)
CREATE POLICY "Anyone can insert pending projects" ON pending_projects
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view pending projects by email" ON pending_projects
FOR SELECT USING (true);

CREATE POLICY "Anyone can update pending projects by email" ON pending_projects
FOR UPDATE USING (true);

-- Gastbenutzer können ihre Projekte über Token einsehen
CREATE POLICY "Guest customers can view their projects via token" ON projects
FOR SELECT USING (customer_id IN (
  SELECT p.user_id FROM profiles p 
  WHERE p.access_token = ((current_setting('request.headers'::text, true))::json ->> 'x-access-token'::text)
));
```

### 3.3 Datenflüsse & Performance

**Kritische Datenflüsse:**
1. **Gastbenutzer-Projekterstellung (kritisch):** 
   - Projektdefinition → GuestEmailCapture → Supabase Auth SignUp → `pending_projects` Speicherung
   - E-Mail-Bestätigung → `on_user_email_confirmed` Trigger → Profile Erstellung → Projekt-Transfer → `pending_projects` Cleanup
2. **Projektmatching:** Projekte → Filter nach Kategorie/Location → Handwerker-Anzeige
3. **Angebotsprozess:** Projekt → Angebot → Nachricht → Annahme → Status-Update
4. **Rechnungsstellung:** Projekt → Rechnung erstellen → Stripe Integration → Versand
5. **Bewertung:** Projekt abgeschlossen → Bewertungsaufforderung → Bewertung → Profil-Update

**Performance-Optimierungen:**
- Indizierung auf häufig abgefragte Felder (location, craft_category, user_id)
- Pagination für Listen-Views
- Optimistic Updates für bessere UX
- Lazy Loading für Komponenten

---

## 4. Schnittstellen (Interface Design)

### 4.1 API-Endpunkte (Supabase Database Functions)

**Kritische Database Functions für Gastbenutzer-Workflow:**

```sql
-- Sichere Projekterstellung für Gastbenutzer (Security Definer)
SELECT create_pending_project_for_guest(
  p_user_id uuid,
  p_email text,
  p_title text,
  p_description text,
  p_category project_category,
  p_questions_data jsonb,
  p_location text
) RETURNS text

-- Automatische Projektübertragung nach E-Mail-Bestätigung
SELECT transfer_pending_project_to_main(
  pending_project_email text
) RETURNS boolean

-- Automatischer Trigger bei E-Mail-Bestätigung
TRIGGER on_user_email_confirmed
  ON auth.users
  AFTER UPDATE OF email_confirmed_at
  EXECUTE FUNCTION handle_user_email_confirmed()
```

**Aktuelle Edge Functions:**

```typescript
// Rechnung versenden
POST /functions/v1/send-invoice
Headers: Authorization: Bearer <jwt_token>
Body: { invoiceId: string }
Response: { success: boolean, stripeInvoiceId?: string, error?: string }

// Test-User erstellen (Development)
POST /functions/v1/create-test-user
Body: { email: string, password: string, role: string }
Response: { success: boolean, userId?: string, error?: string }
```

**Geplante Edge Functions:**
```typescript
// Projektmatching mit AI
POST /functions/v1/match-projects
Body: { craftsman_id: string, location?: string, categories?: string[] }
Response: { projects: Project[], score: number }

// Automatische Bewertungserinnerung
POST /functions/v1/send-rating-reminder
Body: { project_id: string }
Response: { success: boolean }

// KI-Chatbot für Kundenservice
POST /functions/v1/ai-support
Body: { message: string, context?: object }
Response: { reply: string, actions?: object[] }
```

### 4.2 Externe Integrationen

**Stripe Integration:**
```typescript
// Subscription erstellen
interface StripeSubscription {
  customer_email: string;
  price_id: string;
  success_url: string;
  cancel_url: string;
}

// Invoice API
interface StripeInvoice {
  customer_id: string;
  line_items: LineItem[];
  currency: 'EUR' | 'USD';
  auto_advance?: boolean;
}
```

**Supabase Auth Integration:**
```typescript
// Benutzer-Registrierung
interface SignUpData {
  email: string;
  password: string;
  options: {
    data: {
      first_name: string;
      last_name: string;
      role: 'customer' | 'craftsman';
    }
  }
}

// Anmeldung
interface SignInData {
  email: string;
  password: string;
}
```

### 4.3 Sicherheit & Authentifizierung

**JWT-basierte Authentifizierung:**
- Automatische Token-Erneuerung durch Supabase Client
- Role-based Access Control über RLS Policies
- Sichere Session-Verwaltung im localStorage

**API-Sicherheit:**
```typescript
// Alle Edge Functions verwenden JWT-Validierung
const authHeader = req.headers.get("Authorization");
const token = authHeader.replace("Bearer ", "");
const { data: userData, error } = await supabase.auth.getUser(token);
```

**CORS-Konfiguration:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 5. Komponentendesign

### 5.1 Seiten-Komponenten (Pages)

**LandingPage.tsx**
- **Zweck:** Marketing-Landingpage für unregistrierte Benutzer
- **Verantwortung:** Hero-Section, Feature-Übersicht, Call-to-Action
- **Ein-/Ausgabe:** Navigation zu Auth/Dashboard je nach Login-Status
- **Abhängigkeiten:** useAuth Hook, shadcn/ui Komponenten

**AuthPage.tsx**
- **Zweck:** Kombinierte Login/Registrierung Seite
- **Verantwortung:** Benutzer-Authentifizierung, Rollenauswahl
- **Algorithmus:** Form-Validierung mit Zod, Supabase Auth Integration
- **Abhängigkeiten:** React Hook Form, Supabase Client, useAuth Hook

**DashboardPage.tsx**
- **Zweck:** Rollenspezifisches Dashboard für alle Benutzertypen
- **Verantwortung:** Übersichts-Widgets, schnelle Aktionen, Navigation
- **Ein-/Ausgabe:** Benutzerrolle → spezifische Dashboard-Inhalte
- **Abhängigkeiten:** useAuth, Tanstack Query für Daten-Fetching

**ProjectsPage.tsx**
- **Zweck:** Projekt-Übersicht und -Management
- **Verantwortung:** 
  - Kunden: eigene Projekte verwalten
  - Handwerker: verfügbare Projekte durchsuchen, Angebote abgeben
- **Algorithmus:** Filtering nach Kategorie, Location, Status
- **Abhängigkeiten:** Supabase Client, Project/Bid Komponenten

**ProjectCreation.tsx**
- **Zweck:** Neue Projekte erstellen für registrierte Benutzer und Gastbenutzer mit nahtlosem Übergang zwischen den Modi
- **Route:** `/projects/create` (öffentlich zugänglich ohne Authentifizierungs-Schutz)
- **Verantwortung:** 
  - **Dualer Modus:** Automatische Unterscheidung zwischen authentifizierten und Gastbenutzern
  - **Registrierte Benutzer:** Direkte Projekterstellung in `projects` Tabelle
  - **Gastbenutzer-Flow:** Umleitung zur GuestEmailCapture-Komponente nach Projektdefinition
  - **Kategorien-Mapping:** Transformation deutscher Kategorienamen zu englischen Enum-Werten
  - **State-Management:** Zwischenspeicherung von Projektdaten für Gastbenutzer-Workflow
- **Algorithmus:** 
  - Bedingtes Routing basierend auf Authentifizierungsstatus (`user` vorhanden/nicht vorhanden)
  - Automatische `customer_id` Zuordnung für registrierte Benutzer
  - Kategorien-Mapping mit Fallback auf 'renovation' für ungültige Kategorien
  - Strukturierte Datenspeicherung in `questions_data` JSONB-Feld
- **Gastbenutzer-Workflow:**
  - Projektdaten in `pendingProjectData` State zwischenspeichern
  - GuestEmailCapture-Komponente mit E-Mail-Erfassung und Projekterstellung
  - Erfolgreiche Weiterleitung zur Startseite mit Bestätigungshinweis
- **Navigation-Logic:** 
  - Authentifizierte Benutzer: Weiterleitung zu `/customer-dashboard`
  - Gastbenutzer: Zurück zur Startseite (`/`) nach erfolgreicher E-Mail-Bestätigung
- **Integration:** 
  - ProjectCreationFlow-Komponente für gesamten UI-Workflow
  - GuestEmailCapture für E-Mail-Erfassung und Registrierung
  - Supabase Direct Insert für authentifizierte Benutzer
  - Toast-Benachrichtigungen für Benutzer-Feedback
- **Abhängigkeiten:** ProjectCreationFlow, GuestEmailCapture, useAuth Hook, Supabase Client, React Router, Toast (Sonner)**

**ProjectCreationFlow.tsx**
- **Zweck:** Zentrale UI-Komponente für mehrstufigen Projekterstellungs-Workflow ohne Authentifizierungslogik
- **Verantwortung:**
  - **Kategorieauswahl:** Grid-Layout mit interaktiven Kategorie-Karten aus `question_trees_full.json`
  - **Dynamische Fragen:** Sequentielle Abarbeitung gewerkspezifischer Fragenbäume
  - **Fortschrittsanzeige:** Visueller Progress-Bar mit Schritt-Indikator
  - **Antworten-Sammlung:** State-Management für alle Benutzerantworten in strukturiertem Format
  - **Eingabevalidierung:** Pflichtfeld-Prüfung mit bedingter Weiterleitung
  - **Abschluss-Screen:** Erfolgreiche Projektbestätigung mit Weiterleitungsoptionen
- **Algorithmus:**
  - State-Management: `selectedCategory`, `currentQuestionIndex`, `answers`, `isComplete`
  - Bedingte Navigation: Rückwärts zu Kategorieauswahl, vorwärts durch Fragenkatalog
  - Validierungslogik: `canProceed()` prüft Pflichtfelder vor Navigation
  - Abschluss-Trigger: `onComplete()` Callback mit aggregierten Projektdaten
- **Workflow-Phasen:**
  1. **Kategorieauswahl:** Grid-View aller verfügbaren Handwerks-Kategorien
  2. **Fragensequenz:** Schrittweise Abarbeitung kategoriespezifischer Fragen
  3. **Projektabschluss:** Bestätigungsscreen mit Weiterleitung-Optionen
- **Datenstruktur:**
  - Input: `onComplete` und `onBack` Callback-Funktionen
  - Output: Strukturierte Projektdaten `{ category: string, answers: Record<string, any> }`
- **Navigation-Logik:**
  - Hierarchische Rücknavigation: Frage → vorherige Frage → Kategorieauswahl → Parent
  - Fortschritts-Navigation mit Validierung für Pflichtfelder
- **Integration:** 
  - `question_trees_full.json` für Fragenstruktur
  - DynamicQuestionRenderer für UI-Rendering der Einzelfragen
  - shadcn/ui Komponenten für konsistentes Design
- **Abhängigkeiten:** DynamicQuestionRenderer, useAuth Hook (für Gastbenutzer-Erkennung), React State Management**

**GuestEmailCapture.tsx**
- **Zweck:** Kritische Komponente für nahtlose Gastbenutzer-Registrierung und Projektübertragung
- **Verantwortung:**
  - **E-Mail-Erfassung:** Benutzerfreundliches Formular für Gastbenutzer-E-Mail
  - **Supabase Auth Integration:** Automatische Benutzer-Registrierung über `supabase.auth.signUp()`
  - **Projekt-Speicherung:** Sichere Zwischenspeicherung in `pending_projects` Tabelle
  - **Kategorien-Mapping:** Transformation deutscher zu englischen Kategoriennamen (identisch zu ProjectCreation.tsx)
  - **Security Definer RPC:** Verwendung von `create_pending_project_for_guest` Funktion
- **Algorithmus:**
  - Zufällige Passwort-Generierung für Gastbenutzer (`crypto.randomUUID()`)
  - Email-Redirect-URL Konfiguration für Verifizierung (`/verify-email`)
  - User-Metadata mit Role 'guest-customer' für spätere Profilzuordnung
  - Transaktionale Projekt-Speicherung mit Fehlerbehandlung
- **Kritische Features:**
  - **Atomare Operation:** Benutzer-Erstellung und Projekt-Speicherung in einer Transaktion
  - **Email-Verifizierung:** Automatischer Versand von Bestätigungslinks über Supabase Auth
  - **Fehlerbehandlung:** Umfassende Try-Catch-Blöcke mit benutzerfreundlichen Fehlermeldungen
  - **Loading-States:** Visuelles Feedback während des Registrierungsprozesses
- **Integration:**
  - Kategorie-Mapping synchron zu ProjectCreation.tsx (Konsistenz-kritisch)
  - `create_pending_project_for_guest` RPC-Funktion für sichere Datenspeicherung
  - Toast-Benachrichtigungen für Benutzer-Feedback
- **Abhängigkeiten:** Supabase Auth, Supabase RPC, Toast (Sonner), React Hook Form**

**EmailVerification.tsx**
- **Zweck:** E-Mail-Bestätigung und automatische Projektübertragung mit robuster Fehlerbehandlung
- **Route:** `/verify-email` (öffentlich zugänglich für Bestätigungslinks)
- **Verantwortung:**
  - **Token-Verarbeitung:** Extraktion von access_token und refresh_token aus URL-Parametern
  - **Session-Management:** Automatische Supabase-Session-Erstellung nach erfolgreicher Verifizierung
  - **Projekt-Transfer:** Backend-getriggerte Übertragung via `handle_user_email_confirmed` Trigger
  - **Benutzer-Navigation:** Intelligente Weiterleitung zu Customer Dashboard
- **Algorithmus:**
  1. **Session-Check:** Prüfung auf bereits authentifizierte Benutzer
  2. **Token-Extraktion:** URL-Parameter Parsing für Supabase-Tokens
  3. **Session-Setup:** `supabase.auth.setSession()` für Token-basierte Authentifizierung
  4. **Automatische Weiterleitung:** 2-Sekunden Delay und Navigation zu Dashboard
- **Backend-Integration:**
  - **Database Trigger:** `on_user_email_confirmed` feuert bei `auth.users.email_confirmed_at` Update
  - **Automatische Profilerstellung:** `handle_user_email_confirmed()` Funktion erstellt Profile
  - **Projekt-Transfer:** Pending Project wird automatisch zu Main Project migriert
  - **Cleanup:** Aufräumen der `pending_projects` Tabelle nach erfolgreichem Transfer
- **Fehlerbehandlung:**
  - Umfassende Validierung aller Eingangsdaten
  - Graceful Fallbacks bei fehlenden Tokens oder Session-Fehlern
  - Benutzerfreundliche Fehlermeldungen mit Retry-Optionen
- **Loading States:** Separates UI für Ladezustand, Erfolg und Fehlerzustände
- **Abhängigkeiten:** Supabase Auth, useAuth Hook, React Router, Toast (Sonner)**

**CraftsmanActiveProjects.tsx**
- **Zweck:** Übersicht laufender Projekte für Handwerker
- **Route:** `/craftsman-active-projects` (authentifiziert, nur Handwerker)
- **Verantwortung:**
  - Anzeige aller Projekte mit akzeptierten Angeboten des Handwerkers
  - Projekt-Status-Management (Assigned → In Progress → Completed)
  - Direkter Zugang zu Projekt- und Kundendetails
  - Integration mit Kommunikationssystem
- **Algorithmus:**
  - Filter: Nur Projekte mit `project_bids.status = 'accepted'` für aktuellen Handwerker
  - Statusübergänge mit Validierung und Kundenbenachrichtigung
  - Realtime-Updates für Projektänderungen
- **Features:**
  - Projektstatistiken und Übersichtskarten
  - Schnellzugriff auf Projektdetails und Kundenkommunikation
  - Bulk-Aktionen für Statusupdates
- **Integration:** ProjectStatusActions, Messaging, ProjectDetails
- **Abhängigkeiten:** useAuth Hook, Supabase Client, React Router, Toast

**CraftsmanProfile.tsx**
- **Zweck:** Vollständige Handwerker-Profilverwaltung mit Verifizierungssystem
- **Route:** `/craftsman-profile` (authentifiziert, nur Handwerker)
- **Verantwortung:**
  - Umfassende Profil-Bearbeitung mit Portfolio-Management
  - Kategorien-Management mit Multi-Select
  - Geschäftsdaten (Firma, Standort, Arbeitsradius, Stundensatz)
  - Verifizierungsstatus-Anzeige mit Badge-System
  - Website-URL und Kontaktdaten-Verwaltung
- **Enhanced Features:**
  - Live-Validierung für alle Eingabefelder
  - Kategorien-Chips mit visueller Auswahl
  - Portfolio-Bilder-Upload (vorbereitet für Supabase Storage)
  - Preisgestaltung mit Minimum/Maximum-Bereichen
  - SEO-optimierte Profil-URLs
- **Verifizierungssystem:**
  - Visueller Verifizierungsstatus (Pending, Verified, Rejected)
  - Integration mit craftsman_verification Tabelle
  - Automatische Badge-Anzeige im öffentlichen Profil
- **Abhängigkeiten:** craftsman_profiles Table, Verification System, File Upload Components

**CraftsmanPublicProfile.tsx**
- **Zweck:** Öffentliche Handwerker-Profilseite für Kunden
- **Route:** `/craftsman-profile/:userId` (öffentlich zugänglich)
- **Verantwortung:**
  - Vollständige Handwerker-Informationen für Kundenentscheidung
  - Bewertungsanzeige mit detaillierter Statistik
  - Portfolio-Galerie und Referenzen
  - Kontaktaufnahme-Integration für Kunden
- **Features:**
  - Responsive Design für alle Geräteklassen
  - Strukturierte Daten für SEO (JSON-LD)
  - Social Sharing und Bookmark-Funktionen
  - Bewertungs-Durchschnitte mit visueller Darstellung
- **Integration:** Rating System, Messaging, Project Creation
- **Abhängigkeiten:** craftsman_profiles, ratings, Bewertungskomponenten

**SubscriptionManagement.tsx**
- **Zweck:** Zentrale Abonnement-Verwaltung für Handwerker
- **Route:** `/subscription` (authentifiziert, alle Rollen)
- **Verantwortung:** 
  - Aktuelle Abonnement-Details mit visueller Status-Anzeige
  - Plan-Upgrade/Downgrade mit Stripe Checkout Integration
  - Billing-Historie mit Download-Funktionalität
  - Zahlungsmethoden-Verwaltung über Stripe Customer Portal
- **Business-Logic:** 
  - Plan-Vergleich mit Feature-Matrix und Kostenrechner
  - Proaktive Benachrichtigungen bei Zahlungsproblemen
  - Usage-Metriken für verbrauchsbasierte Features
  - Kündigungsoptionen mit Retention-Flows
- **Integration:** Stripe Customer Portal, Edge Functions für Subscription-Management
- **Abhängigkeiten:** Stripe APIs, customer-portal Edge Function, check-subscription Edge Function

**ProjectDetails.tsx**
- **Zweck:** Detailansicht für Projekte mit rollenspezifischen Features
- **Route:** `/project/:projectId` (authentifiziert, Customer + Handwerker)
- **Verantwortung:**
  - Vollständige Projektinformationen mit strukturierten Antworten
  - Angebots-Management für Kunden (Annahme/Ablehnung)
  - Kommunikations-Integration zwischen Beteiligten
  - Projekt-Status-Tracking und Updates
- **Rollenspezifische Features:**
  - **Kunden:** Angebots-Vergleich, Handwerker-Profile, Annahme-Workflows
  - **Handwerker:** Projekt-Insights, Kunde-Kommunikation, Status-Updates
- **Advanced Features:**
  - Strukturierte Anzeige von questions_data mit benutzerfreundlicher Formatierung
  - Bildergalerie mit Lightbox-Integration
  - Export-Funktionen für Projektdaten
- **Integration:** BidSubmissionModal, RatingModal, ProjectStatusActions, Messaging
- **Abhängigkeiten:** Supabase Queries, Toast System, Navigation

### 5.2 UI-Komponenten

**Handwerker-spezifische Komponenten:**

**BidSubmissionModal.tsx**
- **Zweck:** Modal für Angebots-Abgabe durch Handwerker
- **Verantwortung:**
  - Strukturiertes Angebotsformular mit Validierung
  - Preis- und Zeitschätzungen mit visueller Aufbereitung
  - Nachrichtenintegration für direkte Kundenkommunikation
- **Integration:** Project Details, Handwerker Dashboard
- **Abhängigkeiten:** React Hook Form, Zod Validation, project_bids Table

**RatingModal.tsx**
- **Zweck:** 4-Dimensionen Bewertungssystem für Kunden
- **Verantwortung:**
  - Bewertungsformular nach Projektabschluss
  - 5-Sterne-Rating für Geschwindigkeit, Qualität, Zuverlässigkeit, Freundlichkeit
  - Optionale Kommentar-Funktionalität
- **Business Logic:**
  - Validierung: Nur nach erfolgreichem Projektabschluss
  - Einmaligkeit: Eine Bewertung pro Kunde-Handwerker-Projekt
  - Automatische Durchschnittsberechnung für Handwerker-Profile
- **Integration:** Project Completion Workflow, Handwerker Public Profiles
- **Abhängigkeiten:** ratings Table, can_customer_rate_craftsman Function

**ProjectStatusActions.tsx**
- **Zweck:** Status-Management für laufende Projekte
- **Verantwortung:**
  - Projekt-Workflow-Steuerung (Draft → Published → In Progress → Completed)
  - Rollenbasierte Aktionen (Kunde: Abschluss, Handwerker: Fortschritt)
  - Automatische Benachrichtigungen bei Status-Änderungen
- **Workflow-Integration:**
  - Projekt-Abschluss triggert automatische Bewertungsaufforderung
  - Status-Updates aktivieren entsprechende Kommunikationskanäle
- **Abhängigkeiten:** Project Management System, Notification System

**Advanced UI-Komponenten:**

**DynamicQuestionRenderer.tsx**
- **Zweck:** Rendering verschiedener Fragetypen aus question_trees_full.json
- **Supported Types:**
  - Text-Input, Number-Input, Single/Multi-Select
  - Boolean-Checkboxes, Range-Slider
  - File-Upload (Image/Document)
- **Features:**
  - Conditional Logic für Folgefragen
  - Live-Validierung mit visuellen Feedback
  - Responsive Design für alle Geräteklassen
- **Integration:** ProjectCreationFlow, Dynamic Form Systems

**ProjectCreationFlow.tsx**
- **Zweck:** Mehrstufiger Workflow für Projekterstellung
- **Workflow-Phasen:**
  1. Kategorieauswahl mit visuellen Karten
  2. Kategorie-spezifische Fragensequenz
  3. Projektübersicht und Bestätigung
- **State Management:**
  - Zentrale Antworten-Sammlung in strukturiertem Format
  - Fortschritts-Tracking mit visueller Progress-Bar
  - Validation Gates vor Phasen-Übergängen
- **Integration:** question_trees_full.json, DynamicQuestionRenderer

**shadcn/ui Integration:**
```typescript
// Design-System mit semantischen Tokens
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Projekt erstellen
</Button>

// Enhanced Form Components
<Select onValueChange={(value) => setCategory(value)}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Kategorie auswählen" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((cat) => (
      <SelectItem key={cat.value} value={cat.value}>
        {cat.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Formular-System:**
```typescript
// React Hook Form + Zod Integration mit Enhanced Validation
const projectSchema = z.object({
  title: z.string().min(5, "Titel zu kurz").max(100, "Titel zu lang"),
  description: z.string().min(20, "Beschreibung zu kurz").max(1000, "Beschreibung zu lang"),
  budget_min: z.number().positive("Budget muss positiv sein").optional(),
  budget_max: z.number().positive("Budget muss positiv sein").optional(),
  category: z.enum(PROJECT_CATEGORIES),
  location: z.string().min(1, "Standort erforderlich"),
}).refine((data) => !data.budget_max || !data.budget_min || data.budget_max >= data.budget_min, {
  message: "Maximum-Budget muss größer als Minimum-Budget sein",
  path: ["budget_max"],
});

// Advanced Validation for Craftsman Profiles
const craftsmanProfileSchema = z.object({
  company_name: z.string().min(2, "Firmenname zu kurz"),
  description: z.string().min(50, "Beschreibung sollte mindestens 50 Zeichen haben"),
  categories: z.array(z.enum(CRAFTSMAN_CATEGORIES)).min(1, "Mindestens eine Kategorie erforderlich"),
  hourly_rate: z.number().min(10, "Stundensatz zu niedrig").max(200, "Stundensatz zu hoch").optional(),
  radius_km: z.number().min(5, "Mindestradius 5km").max(100, "Maximalradius 100km"),
  website_url: z.string().url("Ungültige URL").optional().or(z.literal("")),
});
```

### 5.3 Custom Hooks

**useAuth.tsx**
- **Zweck:** Zentrale Authentifizierungs-Logik mit Enhanced Session Management
- **State:** user, session, loading, profile, signIn, signUp, signOut
- **Features:**
  - Automatische Token-Refresh mit Retry-Logic
  - Rollenbasierte Navigations-Guards
  - Profile-Sync zwischen Supabase Auth und Application State
  - Gastbenutzer-Support mit seamloser Upgrade-Funktionalität
- **Session-Management:** 
  - Persistente Session-Storage mit Encryption
  - Cross-Tab-Synchronisation für Session-Updates
  - Automatic Logout bei Token-Expiration mit User-Notification

**usePlatform.ts**
- **Zweck:** Platform-Detection für responsive und mobile-optimierte Features
- **Features:**
  - Mobile/Desktop/Tablet Detection
  - Capacitor Native App Detection
  - Device-specific Feature Toggles
- **Integration:** UI Component Responsive Behavior, Navigation Patterns

**use-mobile.tsx**
- **Zweck:** Mobile-spezifische UI-Anpassungen
- **Breakpoint-Management:** Tailwind-integrierte Media Queries
- **Features:** Touch-friendly Interactions, Mobile Navigation

---

## 6. Benutzeroberfläche (UI-Design)

### 6.1 Design-System

**Farb-Palette (HSL-basiert):**
```css
:root {
  --primary: 210 100% 50%;          /* Hauptfarbe (Blau) */
  --primary-foreground: 0 0% 100%;  /* Text auf Primär */
  --secondary: 210 40% 96%;         /* Sekundäre Hintergrundfarbe */
  --accent: 210 100% 95%;           /* Akzentfarbe */
  --destructive: 0 84% 60%;         /* Fehlerzustände */
  --muted: 210 40% 95%;             /* Gedämpfte Elemente */
  --border: 214 32% 91%;            /* Rahmenfarben */
}
```

**Typography Scale:**
```css
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;

.text-h1 { font-size: 2.5rem; font-weight: 700; }
.text-h2 { font-size: 2rem; font-weight: 600; }
.text-body { font-size: 1rem; line-height: 1.5; }
```

**Spacing System:**
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
```

### 6.2 User Flows

**Registrierter Kunde - Projekt erstellen:**
```
1. Dashboard → "Neues Projekt" Button
2. ProjectCreation (/projects/create) → Authentifizierter Workflow
   - Schritt 1: Kategorieauswahl mit visuellen Karten
   - Schritt 2: Dynamische Fragenerstellung basierend auf question_trees_full.json
   - Schritt 3: Automatische Projekterstellung mit strukturierten Daten
3. Weiterleitung → Customer Dashboard mit neuem Projekt
4. Handwerker-Angebote verwalten → Angebots-Auswahl
5. Angebot annehmen → Projekt "In Bearbeitung"
6. Projekt abschließen → Bewertung abgeben
```

**Gastbenutzer - Projekt erstellen (Neuer Gastzugang):**
```
1. Landingpage → "Projekt erstellen" Button (ohne Login)
2. ProjectCreation (/projects/create) → Gast-Workflow
   - Schritt 1: Kategorieauswahl mit visuellen Karten
   - Schritt 2: Dynamische Fragenerstellung basierend auf Kategorie
     • Gewerkspezifische Fragen aus question_trees_full.json
     • Verschiedene Fragetypen (Text, Auswahl, Numerisch, Boolean)
     • Bedingte Logik für Folgefragen
   - Schritt 3: Email-Erfassung für Gastzugang
   - Schritt 4: Automatische Konto- und Projekterstellung
3. Projekt erstellt → Gastprofil mit access_token generiert
4. Email-Benachrichtigung → Link zum Gast-Dashboard
5. One-Click-Zugang → Vollwertiger Kunden-Account via Email-Link
6. Handwerker-Angebote verwalten → Normale Projekt-Abwicklung
```

**Handwerker - Aktive Projekte verwalten:**
```
1. Dashboard → "Aktive Projekte" Bereich oder direkter Link
2. CraftsmanActiveProjects → Übersicht aller laufenden Projekte
   - Projekte mit akzeptierten Angeboten
   - Status-Indikatoren (Assigned, In Progress, Completed)
   - Schnellzugriff auf Projektdetails und Kundenkommunikation
3. Projekt-Status-Update → Fortschritts-Tracking für Kunden
4. Projekt-Abschluss → Automatische Benachrichtigung und Bewertungsaufforderung
5. Integration → Rechnungsstellung, Kundenbewertung, Portfolio-Update
```

**Handwerker - Profil verwalten (Enhanced):**
```
1. Dashboard → "Profil bearbeiten" Link
2. CraftsmanProfile → Umfassende Profilverwaltung
   - Firmendaten (Name, Beschreibung, Website)
   - Standort und Arbeitsradius-Definition
   - Kategorien-Management mit Multi-Select
   - Preisgestaltung (Stundensätze, Service-Pakete)
   - Verifizierungsstatus-Anzeige
3. Portfolio-Management → Bilder-Upload und Referenzen
4. SEO-Optimierung → Automatische Meta-Tags für öffentliches Profil
5. Verifizierung → Direktlink zu Verifizierungs-Workflow
```

**Handwerker - Abonnement verwalten:**
```
1. Dashboard → "Abonnement verwalten" Link
2. SubscriptionManagement → Übersicht aktueller Plan
   - Aktuelle Plan-Details mit Feature-Matrix
   - Billing-Historie mit Download-Optionen
   - Usage-Metriken und Limits
   - Automatische Subscription-Status-Checks
3. Plan-Upgrade/Downgrade → Stripe Checkout Integration
4. Zahlungsmethoden → Stripe Customer Portal
5. Kündigungsoptionen → Self-Service mit Retention-Angeboten
```

**Handwerker - Angebot abgeben:**
```
1. Dashboard → "Verfügbare Projekte" oder CraftsmanProjectBrowse
2. Projekt-Filtering → Kategorie, Standort, Budget-Range
3. Projekt-Details → Vollständige Projektinformationen mit strukturierten Antworten
4. BidSubmissionModal → Angebots-Erstellung
   - Preis-Kalkulation mit Hilfetools
   - Zeitschätzung und Verfügbarkeit
   - Persönliche Nachricht an Kunden
5. Angebot übermittelt → Automatische Kundenbenachrichtigung
6. Angebots-Tracking → CraftsmanBids für Status-Monitoring
7. Angebot angenommen → Projektübertragung zu CraftsmanActiveProjects
```

**Admin - Handwerker verifizieren:**
```
1. Dashboard → "Pending Verifications" Übersicht
2. AdminVerificationPage → Liste unbearbeiteter Anträge
3. Verification-Details → Dokumente prüfen
4. Entscheidung treffen → Approve/Reject mit Kommentar
5. Handwerker-Benachrichtigung → Status-Update
```

### 6.3 Responsive Design

**Breakpoints:**
```css
/* Mobile First Approach */
.mobile    { /* bis 768px - Standard */ }
.tablet    { @media (min-width: 768px) }
.desktop   { @media (min-width: 1024px) }
.wide      { @media (min-width: 1280px) }
```

**Navigation:**
- **Mobile:** Hamburger-Menü mit Overlay
- **Desktop:** Horizontale Navigation mit Dropdown-Menüs
- **Dashboard:** Sidebar auf Desktop, Bottom-Navigation auf Mobile

### 6.4 Accessibility (WCAG 2.1)

**Implementierte Standards:**
- Semantic HTML (header, main, nav, section)
- Keyboard-Navigation für alle interaktiven Elemente
- Screen-Reader-kompatible Labels und Descriptions
- Kontrast-Verhältnis min. 4.5:1 für normalen Text
- Focus-Indikatoren für alle fokussierbaren Elemente

**Accessibility Features:**
```typescript
// Beispiel: Barrierefreie Button-Komponente
<button 
  aria-label="Projekt löschen"
  aria-describedby="delete-confirmation"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>
```

---

## 7. Anforderungen (Requirements) / SRD

### 7.1 Funktionale Anforderungen

#### 7.1.1 Benutzer-Management (UM) ✅

**UM-001: Benutzer-Registrierung ✅**
- **Beschreibung:** Neue Benutzer können sich mit E-Mail und Passwort registrieren
- **Status:** Vollständig implementiert mit Enhanced Features
- **Akzeptanzkriterien:**
  - ✅ Eindeutige E-Mail-Adresse erforderlich
  - ✅ Passwort-Mindestanforderungen (8+ Zeichen, Groß-/Kleinschreibung, Zahlen)
  - ✅ Rollenauswahl (Kunde/Handwerker) während Registrierung
  - ✅ E-Mail-Bestätigung vor Account-Aktivierung
  - ✅ Automatische Profil-Erstellung in `profiles` Tabelle via Database Trigger
- **Enhanced Features:**
  - ✅ Gastbenutzer-zu-Vollaccount Upgrade-Workflow
  - ✅ Social Login vorbereitet (Google, Apple)
  - ✅ Progressive Profil-Vervollständigung nach Registrierung
- **Implementierung:** Auth.tsx, useAuth Hook, handle_new_user() Trigger

**UM-002: Benutzer-Anmeldung ✅**
- **Beschreibung:** Registrierte Benutzer können sich mit ihren Anmeldedaten einloggen
- **Status:** Vollständig implementiert mit Session Management
- **Akzeptanzkriterien:**
  - ✅ E-Mail/Passwort Login mit Validation
  - ✅ "Remember Me" Option mit sicherer Token-Storage
  - ✅ Automatische Weiterleitung zu rollenspezifischen Dashboards
  - ✅ Session-Persistierung über Browser-Refresh
- **Enhanced Features:**
  - ✅ Cross-Tab Session Synchronisation
  - ✅ Automatic Session Refresh mit Background Token Update
  - ✅ Login-Rate-Limiting über Supabase

**UM-003: Gastbenutzer-System ✅**
- **Beschreibung:** Nicht-registrierte Benutzer können Projekte erstellen
- **Status:** Vollständig implementiert mit Backend-Automation
- **Akzeptanzkriterien:**
  - ✅ Projekterstellung ohne vorherige Registrierung
  - ✅ E-Mail-basierte Account-Erstellung mit zufälligem Passwort
  - ✅ Automatische Projektübertragung bei E-Mail-Bestätigung
  - ✅ Seamloser Upgrade zu Vollaccount
- **Kritische Komponenten:**
  - ✅ GuestEmailCapture.tsx für sichere E-Mail-Erfassung
  - ✅ EmailVerification.tsx für Token-basierte Bestätigung
  - ✅ pending_projects Tabelle mit permissiven RLS Policies
  - ✅ on_user_email_confirmed Trigger für automatischen Transfer
  - Login mit E-Mail und Passwort
  - Session-Persistierung zwischen Browser-Sessions
  - Automatische Weiterleitung basierend auf Benutzerrolle
  - "Passwort vergessen" Funktionalität
  - JWT-Token für API-Authentifizierung
- **Priorität:** Hoch
- **User Story:** "Als registrierter Benutzer möchte ich mich einfach einloggen können, um auf meine Projekte und Nachrichten zuzugreifen."

**UM-003: Gastzugang-Management**
- **Beschreibung:** Gastbenutzer können Projekte erstellen und erhalten automatisch Zugang zur Plattform
- **Akzeptanzkriterien:**
  - Projekterstellung ohne vorherige Registrierung möglich
  - Email-Erfassung am Ende des Projekterstellungsprozesses
  - Automatische Generierung eines Kundenprofils aus Projektdaten
  - Email-Versand mit sicherem Zugangslink zum Kunden-Dashboard
  - One-Click-Zugang zum vollwertigen Account via Email-Link
  - Integration in bestehende Authentifizierung ohne separaten Login
- **Priorität:** Hoch
- **User Story:** "Als Interessent möchte ich sofort ein Projekt erstellen können, ohne mich registrieren zu müssen, und später einfachen Zugang zu meinem Account erhalten."

**UM-004: Profil-Management**
- **Beschreibung:** Benutzer können ihre Profildaten verwalten und aktualisieren
- **Akzeptanzkriterien:**
  - Bearbeitung von Basisdaten (Name, Telefon, Adresse)
  - Upload von Profilbild (geplant)
  - Handwerker: Spezialisierungen, Erfahrung, Stundenraten
  - Kunden: Firmeninformationen (optional)
  - Echtzeit-Validierung aller Eingaben
- **Priorität:** Mittel
- **User Story:** "Als Benutzer möchte ich mein Profil vollständig ausfüllen können, um Vertrauen bei anderen Nutzern zu schaffen."

#### 7.1.2 Projekt-Management (PM)

**PM-001: Projekt erstellen (Gastzugang und Dynamisches Fragebogen-System)**
- **Beschreibung:** Registrierte Kunden und Gastbenutzer können neue Projekte mit einem intelligenten, adaptiven Fragebogen erstellen
- **Akzeptanzkriterien:**
  - **Gastzugang ohne Registrierung:** Sofortige Projekterstellung über `/projects/create` Route
  - **Kategorieauswahl:** Visuelle Karten-Interface für Handwerks-Kategorien
  - **Dynamische Fragenerstellung:** JSON-basiertes System (`question_trees_full.json`) für gewerkspezifische Fragen
  - **Mehrstufiger Workflow:** ProjectCreationFlow-Komponente mit Fortschrittsanzeige
  - **Bedingte Logik:** Folgefragen erscheinen basierend auf vorherigen Antworten
  - **Verschiedene Fragetypen:** Text, Auswahl, Numerisch, Boolean
  - **Strukturierte Datenspeicherung:** JSONB-Feld (`questions_data`) für vollständige Antwort-Persistierung
  - **Automatische Titel/Beschreibung:** Generierung aus kategoriespezifischen Antworten
  - **Gast-Email-Erfassung:** Email-Sammlung am Ende für Gastbenutzer-Zugang
  - **Automatische Profil-Erstellung:** Gastprofil mit `registered: false` und eindeutigem `access_token`
  - **Sichere RLS-Policies:** Anonyme Benutzer können nur Gastprofile erstellen
  - **Email-Zugangslink:** Zukünftige Implementierung für direkten Dashboard-Zugang
  - **Nahtlose Integration:** Gastbenutzer erhalten vollwertigen Kunden-Account
- **Priorität:** Hoch
- **User Story:** "Als Interessent möchte ich sofort ein Projekt erstellen können, ohne mich registrieren zu müssen, und am Ende einfachen Zugang zu meinem Account erhalten."

**PM-002: Projekte durchsuchen**
- **Beschreibung:** Handwerker können verfügbare Projekte finden und filtern
- **Akzeptanzkriterien:**
  - Filter nach Kategorie, Standort, Budget, Dringlichkeit
  - Sortierung nach Entfernung, Budget, Erstellungsdatum
  - Pagination für große Ergebnismengen
  - Projekt-Detail-Ansicht mit allen Informationen
  - Nur veröffentlichte Projekte sichtbar
- **Priorität:** Hoch
- **User Story:** "Als Handwerker möchte ich schnell Projekte finden, die zu meinen Fähigkeiten und meinem Standort passen."

**PM-003: Projekt-Status-Verwaltung**
- **Beschreibung:** Automatische und manuelle Status-Updates für Projekte
- **Akzeptanzkriterien:**
  - Status-Übergänge: Draft → Published → In Progress → Completed → Cancelled
  - Nur Projekt-Eigentümer können Status ändern
  - Automatische Status-Änderung bei Angebots-Annahme
  - Benachrichtigungen bei Status-Änderungen
  - Audit-Trail für alle Änderungen
- **Priorität:** Mittel
- **User Story:** "Als Kunde möchte ich jederzeit den aktuellen Status meiner Projekte einsehen können."

#### 7.1.3 Angebots-System (AS)

**AS-001: Angebot erstellen**
- **Beschreibung:** Handwerker können Angebote für Projekte abgeben
- **Akzeptanzkriterien:**
  - Angebot nur für veröffentlichte Projekte möglich
  - Pflichtfelder: Angebotspreis, Beschreibung
  - Optionale Felder: Zeitrahmen, detaillierte Aufschlüsselung
  - Ein Angebot pro Handwerker pro Projekt
  - Angebot-Bearbeitung bis zur Annahme möglich
- **Priorität:** Hoch
- **User Story:** "Als Handwerker möchte ich detaillierte Angebote abgeben können, um meine Leistungen zu verkaufen."

**AS-002: Angebots-Verwaltung**
- **Beschreibung:** Kunden können eingegangene Angebote verwalten
- **Akzeptanzkriterien:**
  - Übersicht aller Angebote pro Projekt
  - Detailansicht für jedes Angebot
  - Handwerker-Profil aus Angebots-Ansicht erreichbar
  - Ein Angebot pro Projekt annehmbar
  - Automatische Ablehnung anderer Angebote bei Annahme
- **Priorität:** Hoch
- **User Story:** "Als Kunde möchte ich alle Angebote übersichtlich vergleichen können, um die beste Entscheidung zu treffen."

**AS-003: Angebots-Annahme**
- **Beschreibung:** Prozess der Angebots-Annahme und Projekt-Aktivierung
- **Akzeptanzkriterien:**
  - Bestätigungsdialog vor Angebots-Annahme
  - Automatische Projekt-Status-Änderung zu "In Progress"
  - Benachrichtigung an gewählten Handwerker
  - Ablehnungs-Benachrichtigung an andere Bieter
  - Chat-Aktivierung zwischen Kunde und Handwerker
- **Priorität:** Hoch
- **User Story:** "Als Kunde möchte ich ein Angebot mit einem Klick annehmen und sofort mit dem Handwerker kommunizieren können."

#### 7.1.4 Kommunikations-System (CS)

**CS-001: Direktnachrichten**
- **Beschreibung:** Echtzeit-Messaging zwischen Benutzern
- **Akzeptanzkriterien:**
  - 1:1 Chat zwischen Kunden und Handwerkern
  - Echtzeit-Updates via Supabase Realtime
  - Nachrichten-Historie persistiert
  - Unread-Status für neue Nachrichten
  - Nachrichten-Suche (geplant)
- **Priorität:** Hoch
- **User Story:** "Als Nutzer möchte ich direkt mit anderen Beteiligten kommunizieren können, um Projektdetails zu klären."

**CS-002: Projekt-Kontext**
- **Beschreibung:** Nachrichten können projektbezogen organisiert werden
- **Akzeptanzkriterien:**
  - Nachrichten-Threads pro Projekt
  - Projekt-Informationen im Chat sichtbar
  - Automatische Chat-Erstellung bei Angebots-Annahme
  - Chat-Zugriff nur für Projekt-Beteiligte
- **Priorität:** Mittel
- **User Story:** "Als Nutzer möchte ich projektbezogene Gespräche getrennt von allgemeinen Nachrichten führen können."

#### 7.1.5 Rechnungs-System (RS)

**RS-001: Rechnung erstellen**
- **Beschreibung:** Handwerker können Rechnungen für abgeschlossene Projekte erstellen
- **Akzeptanzkriterien:**
  - Automatische Rechnungsnummer-Generierung (Format: RG-YYYY-NNNN)
  - Multiple Line-Items mit Beschreibung, Menge, Preis
  - Automatische MwSt-Berechnung (19%)
  - Fälligkeitsdatum-Berechnung (+30 Tage)
  - Draft-Modus vor Finalisierung
- **Priorität:** Hoch
- **User Story:** "Als Handwerker möchte ich professionelle Rechnungen erstellen können, ohne externe Tools zu benötigen."

**RS-002: Rechnung versenden**
- **Beschreibung:** Integration mit Stripe Invoice API für Rechnungsversand
- **Akzeptanzkriterien:**
  - Automatischer Stripe-Customer-Abgleich
  - PDF-Generierung durch Stripe
  - E-Mail-Versand an Kunden
  - Tracking von Rechnungsstatus
  - Kostenlose Nutzung für Handwerker
- **Priorität:** Hoch
- **User Story:** "Als Handwerker möchte ich Rechnungen direkt an Kunden senden können, ohne zusätzliche Kosten."

**RS-003: Rechnungsübersicht**
- **Beschreibung:** Dashboard für alle Rechnungen mit Status-Tracking
- **Akzeptanzkriterien:**
  - Liste aller erstellten Rechnungen
  - Filter nach Status, Datum, Kunde
  - Rechnungsdetails mit Zahlungsstatus
  - Export-Funktionen (geplant)
  - Mahnwesen-Integration (geplant)
- **Priorität:** Mittel
- **User Story:** "Als Handwerker möchte ich eine Übersicht über alle meine Rechnungen und deren Zahlungsstatus haben."

#### 7.1.6 Bewertungs-System (BS)

**BS-001: Bewertung abgeben ✅**
- **Beschreibung:** Kunden können Handwerker nach Projektabschluss bewerten
- **Status:** Vollständig implementiert mit Enhanced UX
- **Akzeptanzkriterien:**
  - ✅ 4-Dimensionen-Bewertung: Geschwindigkeit, Qualität, Zuverlässigkeit, Freundlichkeit
  - ✅ 5-Sterne-Scale pro Dimension mit visueller Feedback
  - ✅ Optionaler Text-Kommentar mit Zeichenbegrenzung
  - ✅ Bewertung nur nach Projektabschluss mit Database Function Validation
  - ✅ Eine Bewertung pro Projekt mit Duplicate Prevention
- **Enhanced Features:**
  - ✅ RatingModal mit React Hook Form Integration
  - ✅ can_customer_rate_craftsman() Database Function für Security
  - ✅ Automatische Bewertungsaufforderung bei Projektabschluss
  - ✅ Live-Preview der Sterne-Bewertung während Eingabe
- **Security Features:**
  - ✅ RLS Policies verhindern Bewertungsmanipulation
  - ✅ Validation gegen Fake-Bewertungen und Spam
  - ✅ Audit-Trail für alle Bewertungsaktivitäten
- **Implementierung:** RatingModal.tsx, can_customer_rate_craftsman Function

**BS-002: Bewertungsanzeige ✅**
- **Beschreibung:** Öffentliche Anzeige von Handwerker-Bewertungen
- **Status:** Vollständig implementiert mit SEO-Optimierung
- **Akzeptanzkriterien:**
  - ✅ Durchschnittswerte aller Bewertungsdimensionen mit visueller Darstellung
  - ✅ Gesamtanzahl der Bewertungen mit Vertrauens-Indikatoren
  - ✅ Neueste Kommentare in chronologischer Reihenfolge
  - ✅ Detaillierte Bewertungsstatistiken in Handwerker-Profilen
  - ✅ Privacy-konforme Anzeige bei wenigen Bewertungen
- **Enhanced Features:**
  - ✅ Sterne-Durchschnitte mit Decimal-Präzision
  - ✅ Bewertungsverteilung (Histogram) für jede Dimension
  - ✅ Zeitbasierte Bewertungsfilter (letzte 6/12 Monate)
  - ✅ Strukturierte Daten (JSON-LD) für SEO
- **Integration:**
  - ✅ CraftsmanPublicProfile.tsx für öffentliche Anzeige
  - ✅ ProjectDetails.tsx für Angebots-Entscheidung
  - ✅ Search-Ranking basierend auf Bewertungsqualität

#### 7.1.7 Verifizierungs-System (VS)

**VS-001: Verifizierungsantrag**
- **Beschreibung:** Handwerker können Verifizierung ihrer Qualifikationen beantragen
- **Akzeptanzkriterien:**
  - Upload von Geschäftslizenz, Versicherungsnachweis
  - Angabe von Steuernummer und Kammer-Registrierung
  - Upload von Qualifikationsnachweisen
  - Status-Tracking des Antrags
  - Wiederholte Antragstellung bei Ablehnung möglich
- **Priorität:** Mittel
- **User Story:** "Als Handwerker möchte ich meine Qualifikationen verifizieren lassen, um mehr Vertrauen bei Kunden zu schaffen."

**VS-002: Verifizierungsprüfung**
- **Beschreibung:** Administratoren können Verifizierungsanträge prüfen
- **Akzeptanzkriterien:**
  - Übersicht aller pendenten Anträge
  - Detailansicht mit allen eingereichten Dokumenten
  - Approve/Reject-Entscheidung mit Kommentar
  - Benachrichtigung an Handwerker bei Entscheidung
  - Audit-Trail aller Verifizierungsentscheidungen
- **Priorität:** Mittel
- **User Story:** "Als Administrator möchte ich Verifizierungsanträge effizient bearbeiten können, um die Qualität der Plattform sicherzustellen."

#### 7.1.8 Admin-Funktionen (AF)

**AF-001: Benutzer-Verwaltung**
- **Beschreibung:** Administratoren können Benutzer verwalten und moderieren
- **Akzeptanzkriterien:**
  - Übersicht aller registrierten Benutzer
  - Benutzer-Suche und -Filter
  - Profil-Einsicht und -Bearbeitung
  - Account-Sperrung und -Entsperrung
  - Aktivitäts-Logs pro Benutzer
- **Priorität:** Niedrig
- **User Story:** "Als Administrator möchte ich problematische Benutzer identifizieren und entsprechende Maßnahmen ergreifen können."

**AF-002: Plattform-Statistiken**
- **Beschreibung:** Dashboard mit wichtigen Plattform-Metriken
- **Akzeptanzkriterien:**
  - Benutzer-Registrierungen über Zeit
  - Projekt-Erstellungen und Completion-Rate
  - Rechnungsvolumen und Gebühren
  - Bewertungsdurchschnitte
  - Export-Funktionen für Reports
- **Priorität:** Niedrig
- **User Story:** "Als Administrator möchte ich die Leistung der Plattform überwachen und datenbasierte Entscheidungen treffen können."

### 7.2 Nicht-funktionale Anforderungen

#### 7.2.1 Performance-Anforderungen

**PF-001: Seitenladezeiten**
- **Anforderung:** Initiale Seitenladezeit unter 3 Sekunden
- **Metriken:** 
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3s
- **Implementierung:** 
  - Code-Splitting für Route-basiertes Lazy Loading
  - Optimierte Bundle-Größen durch Tree-Shaking
  - CDN-basierte Asset-Auslieferung über Vercel

**PF-002: API-Response-Zeiten**
- **Anforderung:** 95% aller API-Requests unter 500ms
- **Metriken:**
  - Datenbankabfragen < 200ms
  - Edge Functions < 300ms
  - Stripe API Calls < 1s
- **Implementierung:**
  - Datenbankindizierung für häufige Queries
  - Supabase Connection Pooling
  - Request-Batching wo möglich

**PF-003: Skalierbarkeit**
- **Anforderung:** System soll 10.000 gleichzeitige Benutzer unterstützen
- **Metriken:**
  - Horizontal Skalierung über Supabase
  - Vercel Edge Functions Auto-Scaling
  - Database Connection Limits beachten
- **Implementierung:**
  - Stateless Architecture
  - Database Read Replicas (bei Bedarf)
  - CDN für statische Assets

#### 7.2.2 Sicherheits-Anforderungen

**SI-001: Daten-Verschlüsselung**
- **Anforderung:** Alle sensiblen Daten verschlüsselt übertragen und gespeichert
- **Implementierung:**
  - HTTPS für alle Client-Server Kommunikation
  - JWT-Token für API-Authentifizierung
  - Supabase Database Encryption at Rest
  - Stripe PCI-DSS Compliance für Zahlungsdaten

**SI-002: Authentifizierung & Autorisierung**
- **Anforderung:** Sichere Benutzer-Authentifizierung mit Role-Based Access Control
- **Implementierung:**
  - Supabase Auth mit Email/Password
  - Row Level Security (RLS) für Datenzugriff
  - JWT-Token mit automatischer Refresh
  - Session-Management mit sicherer Storage

**SI-003: Input-Validierung**
- **Anforderung:** Alle Benutzereingaben validiert und sanitized
- **Implementierung:**
  - Zod-Schema Validierung auf Client-Side
  - Supabase RLS als Server-Side Validation
  - XSS-Schutz durch CSP Headers
  - SQL-Injection Schutz durch Supabase Client

#### 7.2.3 Verfügbarkeits-Anforderungen

**AV-001: System-Verfügbarkeit**
- **Anforderung:** 99.9% Uptime (8.76 Stunden Downtime/Jahr)
- **SLA-Grundlage:**
  - Vercel: 99.99% SLA
  - Supabase: 99.9% SLA
  - Stripe: 99.95% SLA
- **Monitoring:** Uptimerobot, Vercel Analytics, Supabase Logs

**AV-002: Fehlerbehandlung**
- **Anforderung:** Graceful Degradation bei Service-Ausfällen
- **Implementierung:**
  - Retry-Logic für temporäre Fehler
  - Fallback-Mechanismen für kritische Features
  - User-friendly Error Messages
  - Offline-Support für PWA (geplant)

**AV-003: Backup & Recovery**
- **Anforderung:** Daily Backups mit Point-in-Time Recovery
- **Implementierung:**
  - Supabase Automated Backups
  - 7-Tage Retention für Point-in-Time Recovery
  - Disaster Recovery Plan dokumentiert

#### 7.2.4 Usability-Anforderungen

**US-001: Responsive Design**
- **Anforderung:** Vollständige Funktionalität auf allen Gerätetypen
- **Breakpoints:**
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
- **Testing:** Cross-Browser Testing (Chrome, Firefox, Safari, Edge)

**US-002: Accessibility (WCAG 2.1)**
- **Anforderung:** Level AA Compliance
- **Implementierung:**
  - Keyboard-Navigation für alle Features
  - Screen-Reader kompatible Markup
  - Farbkontrast min. 4.5:1
  - Focus-Indikatoren
  - Alt-Text für alle Bilder

**US-003: Internationalization**
- **Anforderung:** Deutsche und Englische Sprache (MVP: nur Deutsch)
- **Implementierung:**
  - React-i18next für String-Management
  - Date/Currency Formatting für Deutschland
  - RTL-Support vorbereitet (für zukünftige Erweiterungen)

#### 7.2.5 Compliance-Anforderungen

**CO-001: GDPR Compliance**
- **Anforderung:** Vollständige DSGVO-Konformität
- **Implementierung:**
  - Cookie-Banner mit Consent-Management
  - Datenschutzerklärung und AGB
  - Right to be Forgotten (Account-Löschung)
  - Data Export für Benutzer
  - Privacy by Design Prinzipien

**CO-002: Handwerks-Regulierung**
- **Anforderung:** Einhaltung deutscher Handwerksordnung
- **Implementierung:**
  - Verifizierung von Handwerksqualifikationen
  - Kammer-Registrierung für relevante Gewerke
  - Versicherungsnachweis-Pflicht
  - Steuerliche Compliance (Rechnungsstellung)

### 7.3 Technische Constraints

**TC-001: Browser-Support**
- Modern Browsers: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- Progressive Enhancement für ältere Browser
- ES2020+ JavaScript Features

**TC-002: Mobile-Support**
- iOS 14+ (Safari, Chrome, Native App)
- Android 10+ (Chrome, Samsung Browser, Native App)
- PWA-Capabilities für Web-Anwendung
- Capacitor für Cross-Platform native App-Entwicklung
- Native Device-Features: Push-Notifications, Kamera, Standort

**TC-003: External Dependencies**
- Supabase: Latest Stable Version
- Stripe: API Version 2023-10-16
- React: 18.x LTS
- TypeScript: 5.x

### 7.4 Integration Requirements

**IN-001: Payment Integration**
- Stripe Checkout für Subscription-Management
- Stripe Invoice API für Rechnungsstellung
- Webhook-Handling für Payment-Status-Updates

**IN-002: Email-Integration**
- Supabase Auth für Transactional Emails
- Stripe für Invoice-Emails
- Custom Email-Templates (geplant)

**IN-003: File Storage Integration**
- Supabase Storage für Dokument-Uploads
- Image-Optimization für Avatar/Project-Images
- CDN-Integration für optimale Performance

---

## 8. Annahmen & Abhängigkeiten

### 8.1 Technische Annahmen

**TA-001: Hosting-Umgebung**
- **Annahme:** Vercel bietet ausreichende Performance und Skalierung für erwarteten Traffic
- **Risiko:** Bei exponentiellem Wachstum könnten Vercel-Limits erreicht werden
- **Mitigation:** Migration zu AWS/GCP vorbereitet durch portable Architektur

**TA-002: Browser-Kompatibilität**
- **Annahme:** 95% der Nutzer verwenden moderne Browser (Chrome 90+, Firefox 90+, Safari 14+)
- **Basis:** Statista Browser-Statistiken Deutschland 2024
- **Fallback:** Progressive Enhancement für kritische Features

**TA-003: JavaScript-Verfügbarkeit**
- **Annahme:** JavaScript ist bei 99.5% der Nutzer aktiviert
- **Risiko:** Geschäftskunden mit restriktiven IT-Policies
- **Mitigation:** Server-Side Rendering für kritische Landing-Pages (zukünftig)

**TA-004: Internet-Konnektivität**
- **Annahme:** Stabile Internetverbindung (min. 1 Mbps) bei Nutzung
- **Consideration:** Handwerker arbeiten oft in Gebieten mit schlechter Verbindung
- **Mitigation:** PWA mit Offline-Capabilities für kritische Features (Phase 2)

### 8.2 Business-Annahmen

**BA-001: Markt-Akzeptanz**
- **Annahme:** Handwerker sind bereit, 3-5% Provision für Aufträge zu zahlen
- **Basis:** Konkurrenzanalyse (MyHammer: 3-8%, Blauarbeit: 5-7%)
- **Validierung:** MVP-Testing mit Beta-Handwerkern erforderlich

**BA-002: Verifizierungs-Bereitschaft**
- **Annahme:** Handwerker investieren Zeit in Verifizierungsprozess für Vertrauen
- **Basis:** Erfolg anderer Plattformen mit Verifizierung (Uber, Airbnb)
- **Kritisch:** Verifizierungsprozess darf nicht zu komplex werden

**BA-003: Digitale Affinität**
- **Annahme:** Target-Handwerker sind digital affin genug für Online-Plattform
- **Demografisch:** Fokus auf Handwerker 25-55 Jahre
- **Unterstützung:** Onboarding-Hilfe und Support für weniger digital-affine Nutzer

**BA-004: Projektvolumen**
- **Annahme:** Durchschnittlicher Projektwert 500-5000€ rechtfertigt Plattform-Nutzung
- **Basis:** Handwerker-Umfragen zu typischen Auftragswerten
- **Flexibilität:** Plattform skaliert auch für kleinere/größere Projekte

### 8.3 Regulatorische Abhängigkeiten

**RD-001: GDPR/DSGVO**
- **Abhängigkeit:** EU-Datenschutzgrundverordnung
- **Impact:** Datenverarbeitung, Consent-Management, Right-to-be-Forgotten
- **Compliance:** Supabase ist GDPR-konform, zusätzliche Maßnahmen implementiert

**RD-002: Handwerksordnung (HwO)**
- **Abhängigkeit:** Deutsche Handwerksordnung und Gewerberecht
- **Impact:** Verifizierung zulassungspflichtiger vs. zulassungsfreier Handwerke
- **Implementierung:** Kategorie-spezifische Verifizierungsanforderungen

**RD-003: Umsatzsteuergesetz (UStG)**
- **Abhängigkeit:** Deutsche Steuergesetze für Rechnungsstellung
- **Impact:** MwSt-Berechnung, Rechnungsanforderungen, Archivierung
- **Stripe-Vorteil:** Automatische Compliance durch Stripe Invoice API

**RD-004: Zahlungsdiensteaufsichtsgesetz (ZAG)**
- **Abhängigkeit:** Regulierung von Zahlungsdienstleistern
- **Compliance:** Über Stripe als lizenzierter Zahlungsdienstleister
- **Scope:** Plattform agiert nicht als Zahlungsdienstleister

### 8.4 Externe Service-Abhängigkeiten

**SD-001: Supabase**
- **Services:** Database, Auth, Realtime, Edge Functions, Storage
- **SLA:** 99.9% Uptime
- **Risiko:** Vendor Lock-in
- **Mitigation:** Standard PostgreSQL, exportierbare Auth-Daten

**SD-002: Stripe**
- **Services:** Subscriptions, Invoice API, Payment Processing
- **SLA:** 99.95% Uptime
- **Billing:** Pay-as-you-go, keine Setup-Kosten
- **Alternativen:** PayPal, Mollie (höhere Integrationskosten)

**SD-003: Vercel**
- **Services:** Hosting, CDN, Edge Functions, CI/CD
- **SLA:** 99.99% Uptime
- **Scaling:** Automatisch bis Fair Use Policy
- **Backup-Plan:** Netlify oder AWS Amplify als Alternative

**SD-004: External APIs (geplant)**
- **Google Maps:** Standort-Services und Entfernungsberechnung
- **OpenAI:** KI-Chatbot und Content-Generierung
- **Email-Provider:** Transactional Emails (SendGrid/Postmark)

### 8.5 Team-Abhängigkeiten

**TD-001: Entwicklungs-Kapazitäten**
- **Aktuell:** 1 Full-Stack Developer (AI-assisted)
- **MVP-Timeframe:** 4-6 Wochen für vollständiges MVP
- **Scaling:** Zusätzliche Entwickler für Post-MVP Features

**TD-002: Design & UX**
- **Abhängigkeit:** shadcn/ui für konsistentes Design
- **Custom Design:** Minimaler Aufwand durch Design-System
- **UX-Testing:** Community-Feedback für Iterationen

**TD-003: Legal & Compliance**
- **Abhängigkeit:** Rechtsberatung für AGB, Datenschutz, Handwerksrecht
- **Kritisch:** Vor Live-Gang erforderlich
- **Budget:** 2.000-5.000€ für initiale Rechtsberatung

### 8.6 Daten-Abhängigkeiten

**DD-001: Handwerks-Kategorien**
- **Abhängigkeit:** Standardisierte Handwerks-Klassifikation
- **Basis:** Handwerkskammern, Gewerberegister-Kategorien
- **Erweiterbarkeit:** Flexibles Enum-System für neue Kategorien

**DD-002: Standort-Daten**
- **Abhängigkeit:** Deutsche Postleitzahlen und Orte
- **Source:** Öffentliche PLZ-Datenbanken
- **Updates:** Jährliche Aktualisierung erforderlich

**DD-003: Test-Daten**
- **Abhängigkeit:** Realistische Test-Daten für Development/Testing
- **Generate:** Faker.js für anonyme Test-Accounts
- **GDPR:** Keine Real-User-Daten in Development

### 8.7 Infrastruktur-Abhängigkeiten

**ID-001: Domain & DNS**
- **Abhängigkeit:** Professionelle Domain für Production
- **Aktuell:** Vercel-Subdomain für Development
- **Requirement:** Custom Domain für Vertrauensbildung

**ID-002: SSL/TLS Certificates**
- **Abhängigkeit:** HTTPS für alle Produktions-Umgebungen
- **Provider:** Vercel/Let's Encrypt (automatisch)
- **Compliance:** Erforderlich für GDPR und Payment-Processing

**ID-003: Monitoring & Logging**
- **Abhängigkeit:** Application Performance Monitoring
- **Tools:** Vercel Analytics, Supabase Logs, Sentry (geplant)
- **Alerts:** Uptime-Monitoring für kritische Services

**ID-004: Backup & Disaster Recovery**
- **Abhängigkeit:** Automatisierte Backup-Strategien
- **Database:** Supabase Daily Backups mit 7-Tage Retention
- **Code:** Git-Repository mit Multiple Remotes
- **Recovery-Time:** RTO 4 Stunden, RPO 24 Stunden

---

## 9. Glossar & Begriffe

### 9.1 Business-Begriffe

**Craftsman (Handwerker)**
- Verifizierter oder unverifizierter Facharbeiter, der seine Dienstleistungen über die Plattform anbietet
- Kategorien: Installateur, Elektriker, Maler, Tischler, Maurer, Mechaniker, HLK, IT

**Customer (Kunde)**
- Privat- oder Geschäftskunden, die Handwerkerdienstleistungen suchen
- Rollen: Projekt erstellen, Angebote verwalten, Bewertungen abgeben

**Project (Projekt)**
- Arbeitsauftrag oder Dienstleistungsanfrage eines Kunden
- Lifecycle: Draft → Published → In Progress → Completed/Cancelled

**Bid (Angebot)**
- Angebot eines Handwerkers für ein spezifisches Projekt
- Enthält: Preis, Zeitrahmen, Beschreibung der Leistung

**Verification (Verifizierung)**
- Prozess zur Überprüfung der Qualifikationen und Legitimität von Handwerkern
- Dokumente: Gewerbeschein, Versicherung, Qualifikationsnachweise

**Invoice (Rechnung)**
- Abrechnungsdokument für erbrachte Dienstleistungen
- Integration: Stripe Invoice API für automatischen Versand

**Rating (Bewertung)**
- 4-dimensionale Bewertung von Handwerkern durch Kunden
- Dimensionen: Geschwindigkeit, Qualität, Zuverlässigkeit, Freundlichkeit

### 9.2 Technische Begriffe

**Row Level Security (RLS)**
- PostgreSQL-Feature für datenbasierte Zugriffskontrolle
- Sicherstellt, dass Benutzer nur ihre eigenen Daten sehen/bearbeiten können

**Edge Functions**
- Server-seitige JavaScript-Funktionen in Supabase
- Verwendung: API-Integration, Geschäftslogik, Webhook-Handling

**JWT (JSON Web Token)**
- Standard für sichere Übertragung von Benutzer-Authentifizierung
- Enthält: User-ID, Rolle, Ablaufzeit

**Realtime**
- Supabase-Feature für Live-Updates von Datenbankänderungen
- Verwendung: Chat-Nachrichten, Projekt-Status-Updates

**shadcn/ui**
- React-Komponentenbibliothek basierend auf Radix UI
- Bietet: Accessibility, Theming, Konsistenz

**Tailwind CSS**
- Utility-First CSS Framework
- Semantic Tokens: Definierte Design-Variablen für konsistente Gestaltung

**Zod**
- TypeScript-Schema-Validierungsbibliothek
- Verwendung: Formular-Validierung, API-Input-Validation

**Tanstack Query**
- Daten-Fetching und State-Management-Bibliothek
- Features: Caching, Background-Updates, Optimistic Updates

### 9.3 Payment-Begriffe

**Stripe Customer**
- Stripe-Entity für Kunden mit Zahlungshistorie
- Ermöglicht: Wiederkehrende Zahlungen, Invoice-Versand

**Stripe Invoice API**
- Kostenlose Rechnungsstellung über Stripe
- Features: PDF-Generierung, E-Mail-Versand, Tracking

**Subscription**
- Wiederkehrende Zahlung für Handwerker-Platform-Zugang
- Modelle: Basic, Premium, Enterprise

**Platform Fee**
- Provision der Plattform auf erfolgreiche Projektabschlüsse
- Planned: 3-5% je nach Subscription-Tier

### 9.4 Regulatorische Begriffe

**GDPR/DSGVO**
- EU-Datenschutzgrundverordnung
- Anforderungen: Consent, Right-to-be-Forgotten, Data Portability

**Handwerksordnung (HwO)**
- Deutsche Gesetzgebung für Handwerksbetriebe
- Unterscheidung: Zulassungspflichtige vs. zulassungsfreie Handwerke

**Gewerbeschein**
- Amtliche Erlaubnis zur Ausübung eines Gewerbes
- Erforderlich für: Verifizierung von Handwerkern

**Handwerkskammer**
- Berufsständische Körperschaft für Handwerker
- Registrierung: Pflicht für zulassungspflichtige Handwerke

**Umsatzsteuer (MwSt)**
- 19% Standardsatz in Deutschland
- Automatische Berechnung in Rechnungsmodul

### 9.5 User Experience Begriffe

**User Journey**
- Kompletter Pfad eines Nutzers durch die Anwendung
- Beispiel: Registrierung → Profil → Projekt → Angebot → Abschluss

**Progressive Web App (PWA)**
- Web-Anwendung mit App-ähnlichen Features
- Geplant: Offline-Funktionalität, Push-Notifications

**Responsive Design**
- Anpassung der Benutzeroberfläche an verschiedene Bildschirmgrößen
- Breakpoints: Mobile (768px), Tablet (1024px), Desktop (1280px+)

**Accessibility (A11y)**
- Barrierefreiheit für Nutzer mit Behinderungen
- Standards: WCAG 2.1 Level AA Compliance

### 9.6 Entwicklungs-Begriffe

**MVP (Minimum Viable Product)**
- Grundfunktionalität für ersten Produktlaunch
- Scope: Auth, Projekte, Angebote, Chat, Rechnungen, Bewertungen

**Code Splitting**
- Aufteilung des JavaScript-Codes in kleinere Bundles
- Benefit: Schnellere initiale Ladezeiten

**Server-Side Rendering (SSR)**
- Generierung von HTML auf dem Server
- Geplant für: SEO-kritische Landing-Pages

**Optimistic Updates**
- Sofortige UI-Updates vor Server-Bestätigung
- Verwendung: Chat-Nachrichten, Status-Änderungen

**Tree Shaking**
- Entfernung ungenutzter Code-Teile beim Build
- Tool: Vite für optimierte Bundle-Größen

### 9.7 Projekt-Management Begriffe

**Sprint**
- 1-2 Wochen Entwicklungszyklus
- Deliverables: Funktionale Features, Tests, Dokumentation

**User Story**
- Anforderung aus Nutzersicht
- Format: "Als [Rolle] möchte ich [Funktion], um [Ziel] zu erreichen"

**Acceptance Criteria**
- Messbare Kriterien für Feature-Vollständigkeit
- Definition of Done für jede User Story

**Technical Debt**
- Aufschiebung von Code-Qualitätsverbesserungen
- Management: Regelmäßige Refactoring-Sprints

**Stakeholder**
- Alle Beteiligten am Projekt
- Gruppen: Entwickler, Benutzer, Investoren, Regulatoren

---

## 10. Kritische Implementierungshinweise

### 10.1 Implementierte Features & Best Practices ✅

**Status-Update: Vollständig Funktionsfähige Core-Features**

Die folgenden kritischen Workflows sind vollständig implementiert und getestet:

#### 10.1.1 Gastbenutzer-Projekterstellung ✅
**Status:** Produktionsreif mit Backend-Automation
**Architektur:** Backend-getriggerte Projektübertragung

**Implementierte Komponenten:**

1. **GuestEmailCapture.tsx ✅ - Sichere Gastbenutzer-Registrierung:**
   ```typescript
   // ✅ Implementiert: Zufällige Passwort-Generierung für Gastbenutzer
   password: crypto.randomUUID()
   
   // ✅ Implementiert: Korrekte Role-Zuordnung für Trigger-System
   data: { role: 'guest-customer' }
   
   // ✅ Implementiert: Konsistente Kategorie-Mappings zwischen Komponenten
   const categoryMapping = {
     'Elektriker': 'electrician',
     'Installateur': 'plumber',
     // ... vollständiges Mapping implementiert
   }
   ```

2. **Database Trigger `handle_user_email_confirmed` ✅ - Automatische Projektmigration:**
   ```sql
   -- ✅ Produktiv: Trigger automatisiert kompletten Workflow
   CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
   RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN
     -- Profil-Erstellung und Projekt-Transfer in einer Transaktion
     IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
       -- Automatische Profil-Erstellung mit Role aus Metadata
       -- Projekt-Transfer von pending_projects zu projects
       -- Cleanup der temporären Daten
     END IF;
     RETURN NEW;
   END;
   $$;
   ```

3. **Security Definer Function `create_pending_project_for_guest` ✅:**
   ```sql
   -- ✅ Produktiv: UPSERT verhindert Duplikate und ermöglicht Updates
   CREATE OR REPLACE FUNCTION public.create_pending_project_for_guest(...)
   RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN
     INSERT INTO public.pending_projects (...) VALUES (...)
     ON CONFLICT (email) DO UPDATE SET
       -- Aktualisierung bei erneutem Projekt-Submit
     RETURN p_email;
   END;
   $$;
   ```

4. **EmailVerification.tsx ✅ - Token-basierte Session-Wiederherstellung:**
   ```typescript
   // ✅ Implementiert: Minimale Frontend-Logik, Backend macht Automation
   const { data, error } = await supabase.auth.setSession({
     access_token: accessToken,
     refresh_token: refreshToken
   });
   // Automatische Weiterleitung ohne manuelle Projektübertragung
   ```

#### 10.1.2 Handwerker-Profilverwaltung & Bewertungssystem ✅

**CraftsmanProfile.tsx ✅ - Vollständige Profilverwaltung:**
- ✅ Multi-Kategorien-Management mit Chip-Interface
- ✅ Verifizierungsstatus-Integration mit Badge-System
- ✅ Arbeitsradius und Stundensatz-Konfiguration
- ✅ Website-URL und Firmendaten-Management
- ✅ Portfolio-Vorbereitung für Bildupload

**RatingModal.tsx ✅ - 4-Dimensionen-Bewertungssystem:**
- ✅ can_customer_rate_craftsman() Validation für Security
- ✅ Geschwindigkeit, Qualität, Zuverlässigkeit, Freundlichkeit Rating
- ✅ Automatische Durchschnittsberechnung
- ✅ Einmaligkeits-Garantie pro Kunde-Handwerker-Projekt

#### 10.1.3 Projektmanagement-Workflow ✅

**CraftsmanActiveProjects.tsx ✅ - Handwerker-Projektübersicht:**
- ✅ Status-Management: Assigned → In Progress → Completed
- ✅ Integration mit ProjectStatusActions für Workflow-Kontrolle
- ✅ Direktzugriff auf Kundenkommunikation
- ✅ Projekt-Abschluss triggert automatische Bewertungsaufforderung

**ProjectDetails.tsx ✅ - Umfassende Projektansicht:**
- ✅ Angebots-Management mit Accept/Reject-Workflow
- ✅ Handwerker-Profil-Integration für Entscheidungshilfe
- ✅ Structured Data Display für question_trees_full.json Antworten
- ✅ Role-basierte Feature-Toggles (Kunde vs. Handwerker)

#### 10.1.4 Subscription-Management ✅

**SubscriptionManagement.tsx ✅ - Stripe-Integration vorbereitet:**
- ✅ Edge Functions: customer-portal, check-subscription, create-subscription
- ✅ Subscription-Status-Tracking in craftsman_profiles
- ✅ Customer Portal Integration für Self-Service

### 10.2 Architektur-Prinzipien für Maintenance ✅

**Bewährte Patterns (Beibehalten bei Erweiterungen):**

- ✅ **Database Triggers:** Backend-getriggerte Automation reduziert Frontend-Komplexität
- ✅ **Security Definer Functions:** Zentrale Business-Logic in der Datenbank
- ✅ **Konsistente Mappings:** Synchrone Kategorie-Transformationen zwischen Komponenten
- ✅ **Permissive RLS:** `pending_projects` ermöglicht Gastbenutzer-Zugriff
- ✅ **Component Composition:** BidSubmissionModal, RatingModal als wiederverwendbare Einheiten
- ✅ **Progressive Enhancement:** Features funktionieren auch bei JavaScript-Fehlern

**Performance & Sicherheit (Implementiert):**
- ✅ `pending_projects` mit E-Mail als Primary Key verhindert Duplikate
- ✅ Automatisches Cleanup nach Transfer verhindert Datenballooning
- ✅ RLS Policies mit Role-basierter Granularität
- ✅ can_customer_rate_craftsman() verhindert Bewertungsmanipulation
- ✅ Input-Validation auf Client- und Server-Seite (Zod + Supabase)

### 10.3 Nächste Entwicklungsschritte

**Phase 1: File Upload & Storage**
- Supabase Storage Bucket-Konfiguration für Portfolio-Bilder
- Image Optimization und CDN-Integration
- Drag-and-Drop Upload-Komponenten

**Phase 2: Real-time Messaging**
- Supabase Realtime für Live-Chat
- Push-Notifications über Browser API
- Typing-Indicators und Read-Receipts

**Phase 3: Advanced Search & Filtering**
- Elasticsearch-Integration für Projekt-/Handwerker-Suche
- Location-basierte Filtering mit Radius-Berechnung
- AI-powered Matching zwischen Projekten und Handwerkern

**Phase 4: Mobile App (Capacitor)**
- Native Push-Notifications
- Offline-Capabilities für kritische Features
- App Store Deployment für iOS/Android

---

**Ende der Software-Dokumentation**

*Dieses Dokument wird kontinuierlich aktualisiert und erweitert während der Entwicklung des Handwerker Marketplace.*
