# PROGRESS LOG – Smart Document Storage MVP

**Projekt:** Smart Document Storage (Smarte Dokumentenablage)  
**Stand:** 2025-10-09 UTC  
**Commit/Tag:** Initial Setup  
**Phase:** Pre-Development / Planning

---

## Status Board

| Task ID | Title | Status |
|---------|-------|--------|
| T01 | Enable Lovable Cloud | ✅ Done |
| T02 | Database Schema & RLS | ✅ Done |
| T03 | Storage Buckets & Signed URLs | ✅ Done |
| T04 | Auth & Profil-Management | ✅ Done |
| T05 | Create `document_fields` Table | Backlog |
| T06 | Create `document_types` Table | Backlog |
| T05 | Create `user_roles` Table | Backlog |
| T06 | RLS Policies – Owner-Only Access | Backlog |
| T07 | Storage Bucket & RLS | Backlog |
| T08 | Admin-Gate Verification Function | Backlog |
| T09 | Free-Tier Upload Limit Function | Backlog |
| T10 | Smart Upload Edge Function (OCR + AI) | Backlog |
| T11 | Cost Guard Function | Backlog |
| T12 | Document Preview Edge Function | Backlog |
| T13 | Base Layout & Navigation | Backlog |
| T14 | Design System Tokens (index.css / tailwind.config.ts) | Backlog |
| T15 | Upload UI Component | Backlog |
| T16 | Document List Component | Backlog |
| T17 | Document Detail & Field Editor | Backlog |
| T18 | Admin Panel (Type & Field Config) | Backlog |
| T19 | i18n Setup (German/English) | Backlog |
| T20 | Dark Mode & Theme Switcher | Backlog |
| T21 | Stripe Subscription Gating (Premium Tier) | Backlog |
| T22 | Settings Page (Profile, Plan, API Keys) | Backlog |
| T23 | Integration Tests (Auth, Upload, RLS) | Backlog |
| T24 | Deployment & Observability | Backlog |

---

## Milestones

| Milestone | Target Date | Criteria |
|-----------|-------------|----------|
| M1: Backend Foundation | TBD | Lovable Cloud enabled, all tables & RLS policies deployed, user roles functional |
| M2: Smart Upload Pipeline | TBD | OCR + AI extraction working, preview generation functional, cost guards active |
| M3: Core UI Complete | TBD | Upload, list, detail views responsive & accessible, i18n & dark mode working |
| M4: Feature Gating Live | TBD | Stripe integration functional, free/premium tiers enforced, admin panel protected |
| M5: MVP Deployment | TBD | All tests passing, deployed to production, monitoring active, backups configured |

---

## Change Log

*Neueste Einträge oben. Format: [UTC Timestamp] [Task-ID] Beschreibung – Dateien/Ordner – Diffs (Stichpunkte)*

### 2025-10-09T16:00:00Z – T04 Completed
- **[T04]** Auth & Profil-Management implementiert
- Supabase Auth konfiguriert:
  - Email/Password aktiviert
  - Auto-Confirm aktiviert (kein Email-Bestätigung erforderlich)
  - Anonymous Sign-Ups deaktiviert
- Komponenten erstellt:
  - `src/contexts/AuthContext.tsx` – Auth State Management mit User, Session & Profile
  - `src/components/auth/ProtectedRoute.tsx` – Route Guard für authentifizierte Bereiche
  - `src/pages/Auth.tsx` – Login/Signup UI mit Tabs
- `src/App.tsx` aktualisiert:
  - AuthProvider integriert
  - Protected Routes für Index-Seite
  - Auth-Route hinzugefügt
- `src/pages/Index.tsx` aktualisiert:
  - Zeigt User-Email und Profil-Daten
  - Logout-Button implementiert
- Next Step: T05 – Smart Upload UI

### 2025-10-09T15:30:00Z – T03 Completed
- **[T03]** Storage-Buckets & Signed URLs erstellt
- Migration `002_storage_buckets.sql` deployed:
  - Buckets: `documents` (2GB max), `previews` (100MB max) – beide private
  - RLS-Policies für storage.objects (Owner-Only Upload/View/Update/Delete)
  - File size limits: documents 2GB, previews 100MB
- Edge Function `generate-signed-url` implementiert:
  - Auth-Check + Owner-Verification
  - Signierte URLs mit konfigurierbarer Ablaufzeit (default 5 Min)
  - CORS-Header konfiguriert
  - Logging für Debugging
- `supabase/config.toml` aktualisiert mit Function-Config
- Next Step: T04 – Auth & Profil-Management

### 2025-10-09T15:00:00Z – T02 Completed
- **[T02]** Datenbank-Schema & RLS erstellt
- Migration `001_initial_schema.sql` deployed:
  - Tabellen: `profiles`, `user_roles`, `folders`, `files`, `usage_tracking`, `schema_config`, `audit_log`
  - RLS Owner-Only Policies für alle Tabellen aktiv
  - Indexes: hash_sha256, tags (GIN), user_id/feature/date
  - Trigger: `updated_at` auto-update für alle Tabellen
  - Security Definer Function: `has_role()` für Admin-Checks
  - Auto-Trigger: Profile & user_role bei Signup
- Foreign Keys mit CASCADE konfiguriert
- Next Step: T03 – Storage-Buckets & Signed URLs

### 2025-10-09T14:30:00Z – T01 Completed
- **[T01]** Lovable Cloud aktiviert
- Backend provisioniert:
  - PostgreSQL Database
  - Auth (Email/Password)
  - Storage Bucket
  - Edge Functions Runtime
- Supabase Client automatisch konfiguriert
- Next Step: T02 – Create `documents` Table

### 2025-10-09T12:00:00Z – Initial Setup
- **[SETUP]** Projekt initialisiert
- Dokumente erstellt:
  - `BUILD_PROMPTS.md` (24 Tasks definiert)
  - `PROGRESS_LOG.md` (dieses Dokument)
- Status: Alle Tasks im Backlog
- Next Step: T01 – Enable Lovable Cloud

---

## Decisions (ADR-Light)

*Format: [Datum] Entscheidung | Begründung | Alternativen | Auswirkungen*

### 2025-10-09 – Lovable Cloud als Backend
- **Entscheidung:** Lovable Cloud (Supabase) statt eigener Backend-Infrastruktur
- **Begründung:** Zero-Config, integrierte Auth, RLS, Storage, Edge Functions
- **Alternativen:** Firebase, AWS Amplify, Custom Node.js Backend
- **Auswirkungen:** Schnellerer MVP-Launch, geringere Infrastruktur-Komplexität, Vendor-Lock-In zu Supabase-Ökosystem

### 2025-10-09 – Separate `user_roles` Table
- **Entscheidung:** Rollen in separater Tabelle statt Flags auf `profiles`
- **Begründung:** Verhindert Privilege-Escalation, ermöglicht Multi-Role pro User
- **Alternativen:** Boolean-Flags (`is_admin`), JWT-Claims
- **Auswirkungen:** Security-Definer-Funktion erforderlich, sauberere RLS-Policies

### 2025-10-09 – OpenAI für Smart Extraction
- **Entscheidung:** OpenAI GPT-4 Vision für OCR & Strukturierung (via Lovable AI Gateway)
- **Begründung:** Bessere Genauigkeit als reine OCR-Tools, flexibles Schema
- **Alternativen:** Tesseract.js, Google Vision API, Azure Form Recognizer
- **Auswirkungen:** Kosten pro Upload, Rate-Limits, Abhängigkeit von Lovable AI Gateway

---

## Issues / Blocker

*Format: [ID] Beschreibung | Owner | Nächster Versuch | ETA*

*Aktuell keine offenen Issues.*

---

## Test- & Audit-Matrix

| Test Case | Task | Status | Notes |
|-----------|------|--------|-------|
| **Auth & RLS** | | | |
| User kann nur eigene Docs sehen | T06 | ⬜ Pending | Owner-Only Policy |
| Admin sieht alle Docs | T08 | ⬜ Pending | Admin-Gate Function |
| Anonym hat keinen Zugriff | T06 | ⬜ Pending | RLS Default Deny |
| **Upload & Smart Extraction** | | | |
| PDF Upload → OCR erfolgt | T10 | ⬜ Pending | Tesseract.js |
| Bild Upload → AI extrahiert Felder | T10 | ⬜ Pending | GPT-4 Vision |
| Free-User blockt bei >5 MB | T09 | ⬜ Pending | Limit Function |
| Premium-User erlaubt >5 MB | T09 | ⬜ Pending | Stripe Tier Check |
| **Feature Gating** | | | |
| Free-User: max 50 Docs | T21 | ⬜ Pending | Stripe Integration |
| Premium-User: unbegrenzt | T21 | ⬜ Pending | Subscription Check |
| **Preview Generation** | | | |
| PDF → Thumbnail erstellt | T12 | ⬜ Pending | pdf-lib |
| Image → resized & cached | T12 | ⬜ Pending | Sharp / Canvas |
| **UI / i18n / Theme** | | | |
| Dark Mode funktioniert | T20 | ⬜ Pending | CSS Variables |
| DE/EN Sprachumschaltung | T19 | ⬜ Pending | i18next |
| Mobile Responsive | T15-T17 | ⬜ Pending | Tailwind Breakpoints |

---

## Kosten- & Nutzungshinweise

*Tracking von geschätzten Kosten & Ressourcenverbrauch*

| Kategorie | Aktuell | Limit | Notes |
|-----------|---------|-------|-------|
| **AI Tokens (Lovable AI)** | 0 | Free Tier: 1M/Mo | Gemini 2.5 Flash aktuell kostenlos bis 13.10.2025 |
| **Storage (Supabase)** | 0 GB | Free: 1 GB | Uploads in `documents` Bucket |
| **Edge Function Invocations** | 0 | Free: 500K/Mo | T10, T11, T12 |
| **Database Rows** | 0 | Free: Unlimited | PostgreSQL |
| **Bandwidth** | 0 GB | Free: 5 GB/Mo | Previews & Downloads |

**Kostenoptimierung:**
- Previews cachen (CDN oder Storage-Metadaten)
- AI-Calls batchen wenn möglich
- Compression für Uploads (Client-Side)

---

## Next Step

**Task ID:** T05 – Smart Upload UI  
**Akzeptanzkriterien:**
- Upload-Komponente mit Drag & Drop
- Dateivalidierung (MIME-Type, Größe nach Plan-Tier)
- Multi-File Upload mit Progress
- Datei-Preview (Thumbnails)
- Integration mit Smart Upload Edge Function
- Toast-Feedback bei Erfolg/Fehler

**Aktion:** Upload-Komponente erstellen, Dateivalidierung implementieren, Progress-Anzeige, Smart Upload Integration.

---

*Hinweis: Dieses Dokument wird nach JEDER abgeschlossenen Task automatisch aktualisiert (Status Board, Change Log, Next Step). Bei Abweichungen oder Blockern wird der Issues-Abschnitt befüllt.*
