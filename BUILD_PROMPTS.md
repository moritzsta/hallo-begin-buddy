# BUILD_PROMPTS.md – Smarte Dokumentenablage (MVP)

**Version:** 1.0.0  
**Datum:** 2025-10-08  
**Projekt:** Smarte Dokumentenablage – B2C Cloud-Dokumentenverwaltung mit Smart Upload

---

## 📋 Überblick

Dieses Dokument enthält eine **sequenzielle Liste ausführbarer Build-Tasks** zum Aufbau der „Smarten Dokumentenablage" (MVP). Jede Task ist idempotent, enthält klare Akzeptanzkriterien und verweist auf die nächste Task.

**Architektur-Grundlagen:**
- **Frontend:** React 18 + TypeScript, Tailwind CSS (HSL), shadcn/ui, Framer Motion (sparsam), i18n (DE/EN)
- **Backend:** Supabase (PostgreSQL + RLS, Auth, Storage, Edge Functions)
- **KI:** OCR lokal (Tesseract), OpenAI (kompakt) für Metadaten/Titel
- **Payments:** Stripe (Checkout, Portal, Webhooks)
- **Sicherheit:** Strikte Owner-Isolation via RLS; signierte URLs für Downloads/Previews

**Leitplanken:**
- Security by default: RLS Owner-Only
- EU-Region, DE/EN Lokalisierung
- Kein Drittanbieter für Office-Previews
- Konfigurierbares Ablageschema (prospektiv wirksam)
- Kostenbremse: OCR nur Seite 1, kurze Prompts, Caching

---

## 🎯 Task-Sequenz

### Task #1: Lovable Cloud aktivieren & Basis-Setup

**Ziel:** Lovable Cloud (Supabase) aktivieren und Projektstruktur für Backend-Funktionalität vorbereiten.

**Inputs:**
- Bestehende React-App (Vite, Tailwind, TypeScript)
- Anforderungen aus „Smarte Dokumentenablage – Softwaredokumentation (MVP).md"

**ToDo:**
1. Lovable Cloud aktivieren (Tool verwenden)
2. Projekt-Ordnerstruktur anlegen:
   ```
   src/
   ├── components/
   │   ├── documents/
   │   ├── folders/
   │   ├── upload/
   │   └── ui/ (shadcn)
   ├── contexts/
   ├── hooks/
   ├── lib/
   ├── pages/
   └── types/
   supabase/
   ├── functions/
   └── migrations/
   ```
3. i18n-Setup (DE/EN) mit react-i18next vorbereiten
4. HSL-Design-System in `index.css` und `tailwind.config.ts` definieren (Light/Dark/Colorful Themes)

**Output/Artefakt:**
- Aktivierte Lovable Cloud
- Basis-Ordnerstruktur
- `src/lib/i18n.ts` mit DE/EN Ressourcen
- `index.css` und `tailwind.config.ts` mit HSL-Tokens

**Akzeptanztests:**
- Lovable Cloud Dashboard ist erreichbar
- Projektstruktur existiert
- i18n liefert DE/EN Strings
- HSL-Variablen funktionieren in Components

**Risiken/Guardrails:**
- Keine direkte Farb-Verwendung (text-white, bg-black etc.), nur HSL-Tokens
- Keine env-Variablen wie VITE_*

**Weiter mit → #2**

---

### Task #2: Datenbank-Schema & RLS (Owner-Only)

**Ziel:** PostgreSQL-Tabellen erstellen mit strikter Owner-Isolation via RLS.

**Inputs:**
- Datenmodell aus Abschnitt 5 der Softwaredokumentation
- Owner-Isolation-Anforderungen aus Abschnitt 6

**ToDo:**
1. Migration erstellen: `supabase/migrations/001_initial_schema.sql`
2. Tabellen anlegen:
   - `profiles(id uuid pk, plan_tier text, locale text, theme text, created_at, updated_at)`
   - `folders(id uuid pk, owner_id uuid fk, parent_id uuid null, name text, meta jsonb, inherited_meta jsonb, created_at, updated_at)`
   - `files(id uuid pk, owner_id uuid fk, folder_id uuid fk, storage_path text, mime text, size bigint, hash_sha256 text, title text, meta jsonb, tags text[], preview_state text, created_at, updated_at)`
   - `usage_tracking(id bigserial pk, user_id uuid fk, feature text, date date, count int)`
   - `schema_config(id uuid pk, user_id uuid fk, version int, rules jsonb, active bool)`
   - `audit_log(id bigserial pk, user_id uuid, action text, entity text, entity_id uuid, details jsonb, created_at)`
3. RLS-Policies:
   - `profiles`: SELECT/UPDATE nur für `auth.uid() = id`
   - `folders`: SELECT/UPDATE/DELETE/INSERT nur wenn `owner_id = auth.uid()`
   - `files`: SELECT/UPDATE/DELETE/INSERT nur wenn `owner_id = auth.uid()`
   - `usage_tracking`: SELECT/INSERT/UPDATE nur wenn `user_id = auth.uid()`
4. Indizes:
   - `files(hash_sha256)`, `files(tags) GIN`, `usage_tracking(user_id, feature, date)`
5. Foreign Keys mit `ON DELETE CASCADE`

**Output/Artefakt:**
- `supabase/migrations/001_initial_schema.sql`
- RLS-Policies für alle Tabellen
- TypeScript-Typen generieren via Supabase CLI (optional)

**Akzeptanztests:**
- User A kann keine Ordner/Dateien von User B sehen (SELECT gibt leer zurück)
- Direkter ID-Zugriff via API scheitert an RLS
- INSERT erzwingt `owner_id = auth.uid()`
- Indizes existieren und beschleunigen Queries

**Risiken/Guardrails:**
- RLS muss **vor** ersten Daten-Inserts aktiv sein
- Keine `nullable owner_id` bei `files`/`folders`
- Audit-Logging für kritische Aktionen (Upload, Verschieben, Löschen)

**Weiter mit → #3**

---

### Task #3: Storage-Buckets & Signed URLs

**Ziel:** Supabase Storage-Buckets anlegen (private) + Edge Function für signierte URLs.

**Inputs:**
- Storage-Anforderungen aus Abschnitt 6 (Downloads/Previews via signed URLs)
- Office-Preview-Anforderungen aus Abschnitt 8

**ToDo:**
1. Migration: `002_storage_buckets.sql`
2. Buckets erstellen:
   - `documents` (private)
   - `previews` (private)
3. RLS-Policies für `storage.objects`:
   - Uploads: nur wenn `owner_id = auth.uid()` (via Metadaten)
   - Downloads: via signierte URLs (kein direkter Bucket-Zugriff)
4. Edge Function: `supabase/functions/generate-signed-url/index.ts`
   - Input: `file_id` (UUID)
   - Auth-Check: `auth.uid()` ist Owner der Datei
   - Output: signierte URL mit Ablaufzeit (z.B. 5 Min)
5. `supabase/config.toml`: Function registrieren

**Output/Artefakt:**
- `002_storage_buckets.sql`
- Edge Function `generate-signed-url`
- `supabase/config.toml` mit Function-Config

**Akzeptanztests:**
- Bucket `documents` ist private (direkter Zugriff scheitert)
- Signierte URL läuft nach Ablaufzeit ab
- Nur Owner erhält signierte URL
- Cross-Tenant-Zugriff schlägt fehl

**Risiken/Guardrails:**
- **Keine** öffentlichen Buckets
- Signierte URLs nicht in Client-Logs speichern
- RLS-Check in Edge Function kritisch

**Weiter mit → #4**

---

### Task #4: Auth & Profil-Management

**Ziel:** Supabase Auth aktivieren, Profil-Tabelle befüllen, UI für Login/Logout.

**Inputs:**
- Auth-Anforderungen aus Abschnitt 6
- UI/UX-Spezifikation aus Abschnitt 10 (Profil-Menü oben rechts)

**ToDo:**
1. Supabase Auth aktivieren (Email/Password)
2. Migration: `003_profiles_trigger.sql`
   - Trigger: Bei `auth.users` INSERT → `profiles` INSERT mit `plan_tier = 'free'`, `locale = 'de'`, `theme = 'light'`
3. UI-Components:
   - `src/components/auth/LoginForm.tsx` (Email/Password)
   - `src/components/auth/SignupForm.tsx`
   - `src/components/layout/ProfileMenu.tsx` (oben rechts, seitenkonsistent)
4. Context: `src/contexts/AuthContext.tsx` (Supabase Auth + Profile-Daten)
5. Pages: `src/pages/Login.tsx`, `src/pages/Signup.tsx`
6. Protected Routes via `src/components/ProtectedRoute.tsx`

**Output/Artefakt:**
- `003_profiles_trigger.sql`
- Auth-Components
- `AuthContext.tsx`
- Login/Signup-Pages

**Akzeptanztests:**
- Signup erzeugt `profiles`-Eintrag mit `plan_tier = 'free'`
- Login setzt Auth-Token
- Protected Routes blocken unauthed Users
- Logout löscht Token

**Risiken/Guardrails:**
- Trigger muss `security definer` sein
- Keine Passwörter im Client-Log
- Rate-Limiting für Login/Signup (Supabase-seitig)

**Weiter mit → #5**

---

### Task #5: Ordner-Management (CRUD + Hierarchie)

**Ziel:** Ordner erstellen, umbenennen, verschieben, löschen; UI mit Sidebar-Tree.

**Inputs:**
- Ordner-Funktionsumfang aus Abschnitt 1
- UI/UX-Spezifikation aus Abschnitt 10 (Sidebar + Badges)

**ToDo:**
1. Hooks:
   - `src/hooks/useFolders.ts` (Tanstack Query: fetch, create, update, delete)
2. Components:
   - `src/components/folders/FolderTree.tsx` (Sidebar, max Tiefe 3)
   - `src/components/folders/FolderContextMenu.tsx` (Umbenennen, Verschieben, Löschen)
   - `src/components/folders/CreateFolderDialog.tsx`
3. Validierung:
   - Max. Hierarchie-Tiefe: 3
   - `depth`-Berechnung bei `parent_id`-Änderung
4. Badge-System vorbereiten (Zähler für "neue Dateien" pro Ordner)

**Output/Artefakt:**
- `useFolders.ts`
- Folder-Components
- Badge-Zähler-Logic (DB-Trigger oder Client-berechnet)

**Akzeptanztests:**
- User kann Ordner erstellen/umbenennen/löschen
- Hierarchie-Tiefe > 3 wird blockiert
- Ordner-Löschung kaskadiert (ON DELETE CASCADE)
- Sidebar zeigt Ordnerbaum

**Risiken/Guardrails:**
- `parent_id` zirkuläre Referenzen verhindern (DB-Check)
- RLS prüft Owner bei allen Operationen

**Weiter mit → #6**

---

### Task #6: Datei-Upload (Manuell + Drag&Drop)

**Ziel:** Datei-Upload (Einzel & Massenupload) ohne Smart Upload; Duplikat-Erkennung via SHA-256.

**Inputs:**
- Upload-Anforderungen aus Abschnitt 1
- Duplikat-Erkennung aus Abschnitt 1

**ToDo:**
1. Components:
   - `src/components/upload/FileUploader.tsx` (Drag&Drop, Progress)
   - `src/components/upload/FileList.tsx` (Preview hochgeladener Dateien)
2. Hooks:
   - `src/hooks/useFileUpload.ts` (SHA-256 Hash clientseitig via Web Crypto API)
3. Logic:
   - Vor Upload: SHA-256 berechnen → DB-Check (existiert Hash?)
   - Wenn Duplikat: Zeige Dialog "Datei existiert, Verknüpfung erstellen?" → kein zweiter Upload, nur DB-Eintrag mit gleicher `storage_path`
   - Wenn neu: Upload zu `documents`-Bucket → DB-Eintrag mit `hash_sha256`, `storage_path`, `owner_id`
4. Plan-Check (clientseitig):
   - Free: max 25 MB, Basic: 250 MB, Plus: 1 GB, Max: 2 GB
   - Bei Überschreitung: Upgrade-Prompt

**Output/Artefakt:**
- `FileUploader.tsx`
- `useFileUpload.ts`
- SHA-256-Hash-Logic
- Duplikat-Dialog

**Akzeptanztests:**
- Duplikat-Upload erzeugt keinen zweiten Storage-Eintrag
- Dateigrößen-Limit wird geprüft
- Progress-Bar funktioniert
- Fehler-Handling (Netzwerk, Quota)

**Risiken/Guardrails:**
- Hash-Berechnung kann bei großen Dateien lange dauern (Loading-Indikator)
- Storage-Quota (Supabase) beachten

**Weiter mit → #7**

---

### Task #7: Datei-Management (Umbenennen, Verschieben, Löschen, Download)

**Ziel:** CRUD-Operationen für Dateien; Kontextmenü; Download via signed URLs.

**Inputs:**
- Datei-Funktionsumfang aus Abschnitt 1
- Signed-URL-Logic aus Task #3

**ToDo:**
1. Hooks:
   - `src/hooks/useFiles.ts` (fetch, update, delete, move)
2. Components:
   - `src/components/documents/FileCard.tsx` (Datei-Kachel mit Metadaten)
   - `src/components/documents/FileContextMenu.tsx` (Umbenennen, Verschieben, Löschen, Download, Vorschau)
   - `src/components/documents/RenameFileDialog.tsx`
   - `src/components/documents/MoveFileDialog.tsx` (Ordner-Auswahl)
3. Download-Logic:
   - Rufe `generate-signed-url` Edge Function → öffne URL
4. Ansichten:
   - `src/components/documents/FileListView.tsx` (detailliert)
   - `src/components/documents/FileGridView.tsx` (kompakt)
   - `src/components/documents/FileGalleryView.tsx` (Bilder, nur Basic+)

**Output/Artefakt:**
- `useFiles.ts`
- File-Components
- Ansichten-Switcher

**Akzeptanztests:**
- Umbenennen ändert `title` in DB
- Verschieben ändert `folder_id`
- Löschen entfernt DB-Eintrag + Storage-Datei (falls kein Duplikat)
- Download liefert signierte URL

**Risiken/Guardrails:**
- Verschieben darf nur zu eigenen Ordnern
- Galerie-Ansicht nur für Basic+ (Feature-Gating)

**Weiter mit → #8**

---

### Task #8: Metadaten-Management (Manuell)

**Ziel:** Metadaten (Titel, Doc-Typ, Datum, Party, Amount, Tags) manuell bearbeiten.

**Inputs:**
- Metadaten-Schema aus Abschnitt 1 (Metadaten)
- Ordner-Metadaten-Vererbung aus Abschnitt 1

**ToDo:**
1. Components:
   - `src/components/documents/MetadataPanel.tsx` (rechte Sidebar, Metadaten-Formular)
   - `src/components/documents/TagInput.tsx` (Tag-Chips, Autocomplete)
2. Metadaten-Felder:
   - `title`, `doc_type` (Dropdown), `date` (Datepicker), `party` (Text), `amount` (Number, optional)
   - `tags` (Array)
3. Ordner-Metadaten:
   - Freitext-Metadaten (jsonb) am Ordner
   - Vererbung: Child-Ordner erben `inherited_meta` vom Parent (mit Override möglich)

**Output/Artefakt:**
- `MetadataPanel.tsx`
- `TagInput.tsx`
- Metadaten-Update-Logic

**Akzeptanztests:**
- Metadaten speichern/laden funktioniert
- Tags sind durchsuchbar (GIN-Index)
- Ordner-Metadaten vererben sich

**Risiken/Guardrails:**
- Validierung: `doc_type` aus Enum, `date` im validen Format
- Tags: keine XSS-Injection

**Weiter mit → #9**

---

### Task #9: Feature-Gating & Pläne (Client + Server)

**Ziel:** Plan-Tiers (Free, Basic, Plus, Max) mit Feature-Gating clientseitig + serverseitig.

**Inputs:**
- Pläne & Limits aus Abschnitt 2
- Feature-Gating aus Abschnitt 11

**ToDo:**
1. Constants:
   - `src/lib/plans.ts` (Plan-Config: Preise, Smart-Uploads, Speicher, max. Dateigröße, Features)
2. Context:
   - `src/contexts/PlanContext.tsx` (aktueller Plan, Feature-Checks)
3. Components:
   - `src/components/plans/FeatureGate.tsx` (Conditional Rendering basierend auf Plan)
   - `src/components/plans/UpgradePrompt.tsx` (Modal bei Feature-Block)
   - `src/components/plans/PlanBadge.tsx` (zeigt aktuellen Plan)
4. Server-Side-Check:
   - Edge Functions prüfen `plan_tier` in `profiles` → 403 bei Limit-Verstoß
5. Usage-Tracking:
   - `src/hooks/useUsageTracking.ts` (zählt Smart-Uploads/Monat)

**Output/Artefakt:**
- `plans.ts`
- `PlanContext.tsx`
- Feature-Gate-Components
- Server-Side-Authorization-Logic

**Akzeptanztests:**
- Free-User sieht Galerie-Ansicht nicht (Feature-Gating)
- Smart-Upload nach 30/Monat → Upgrade-Prompt
- Server blockt Feature-Zugriff mit 403
- Usage-Zähler inkrementiert korrekt

**Risiken/Guardrails:**
- Clientseitige Checks sind nur UX → Server MUSS prüfen
- `usage_tracking` muss Owner-isoliert sein (RLS)

**Weiter mit → #10**

---

### Task #10: Stripe-Integration (Checkout, Portal, Webhooks)

**Ziel:** Stripe-Integration für Plan-Upgrades, Customer Portal, Webhook-Handling.

**Inputs:**
- Pläne & Preise aus Abschnitt 2
- Stripe-Anforderungen aus Abschnitt 3.1

**ToDo:**
1. Stripe aktivieren (Tool verwenden) → Secret Key eingeben
2. Stripe-Produkte anlegen (via Stripe Dashboard oder API):
   - Basic (3,99 €/Mon), Plus (7,99 €/Mon), Max (12,99 €/Mon)
   - Zusatz-Smart-Uploads (100er-Block: 0,99 €)
   - Zusatz-Speicher (pro GB/Mon: 0,03-0,05 €)
3. Edge Functions:
   - `supabase/functions/create-checkout-session/index.ts` (Stripe Checkout)
   - `supabase/functions/create-customer-portal/index.ts` (Stripe Portal)
   - `supabase/functions/stripe-webhook/index.ts` (Webhook-Handler: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)
4. UI:
   - `src/pages/Plans.tsx` (Preistabelle, Upgrade-Buttons)
   - `src/components/plans/StripeCheckoutButton.tsx`
5. Webhook-Logic:
   - Bei erfolgreicher Zahlung: `profiles.plan_tier` updaten
   - Bei Kündigung: `plan_tier = 'free'` setzen

**Output/Artefakt:**
- Stripe-Produkte
- Edge Functions (Checkout, Portal, Webhook)
- `Plans.tsx`

**Akzeptanztests:**
- Upgrade auf Basic funktioniert (Checkout → Webhook → `plan_tier` aktualisiert)
- Customer Portal öffnet (Rechnungen, Kündigung)
- Webhook-Signatur validiert (HMAC)

**Risiken/Guardrails:**
- Webhook-Secret MUSS in Supabase Secrets
- Idempotenz: Webhook-Events dürfen nicht doppelt verarbeitet werden (via `event.id` tracken)

**Weiter mit → #11**

---

### Task #11: Smart Upload (OCR + OpenAI + Schema-Mapping)

**Ziel:** Smart-Upload-Feature: OCR Seite 1 → OpenAI Metadaten/Titel → Schema-Mapping → Pfadvorschlag.

**Inputs:**
- Smart-Upload-Ablauf aus Abschnitt 7
- Kostenbremse aus Abschnitt 7
- Schema-Mapping aus Abschnitt 4

**ToDo:**
1. Edge Function: `supabase/functions/smart-upload-classify/index.ts`
   - Input: Datei (Base64 oder Storage-URL)
   - Auth + Plan-Check (Smart-Uploads/Monat)
   - OCR Seite 1 (Tesseract.js in Deno)
   - OpenAI Prompt (kompakt, DE/EN):
     ```
     Extrahiere: Titel, doc_type, date, party, amount (optional).
     Kontext: Dateiname, EXIF, Erstelldatum.
     Output: JSON { title, doc_type, date, party, amount, confidence }
     ```
   - Schema-Mapping: Lade `schema_config` des Users → generiere Pfadvorschlag (z.B. `/Finanzen/Rechnung/2025/01`)
   - Markiere neue Ordner (die noch nicht existieren)
   - SHA-256-Check (Duplikat?)
   - Output: `{ metadata, suggestedPath, newFolders: [], isDuplicate }`
2. Usage-Tracking: `usage_tracking.smart_upload` inkrementieren
3. UI:
   - `src/components/upload/SmartUploadButton.tsx` (Upload + "Smart Upload"-Toggle)
   - `src/components/upload/PathPreview.tsx` (Pfadvorschau mit "neu"-Badges)
   - `src/components/upload/MetadataConfirmDialog.tsx` (Bestätigung vor Ablage)

**Output/Artefakt:**
- Edge Function `smart-upload-classify`
- `SmartUploadButton.tsx`
- `PathPreview.tsx`
- OpenAI-Prompt (optimiert, DE/EN)

**Akzeptanztests:**
- Beispielrechnung → richtige Metadaten (doc_type: "Rechnung", date, party, amount)
- Pfadvorschlag: `/Finanzen/Rechnung/2025/01` (neue Ordner markiert)
- Nach 30 Smart-Uploads (Free) → Upgrade-Prompt
- Duplikat → Verknüpfung statt Upload

**Risiken/Guardrails:**
- OCR nur Seite 1 (Kostenbremse)
- OpenAI-Prompts kurz halten (<200 Tokens)
- Caching für wiederkehrende Layouts (z.B. gleicher Absender)
- Rate-Limiting (5 Sec Cooldown zwischen Smart-Uploads)

**Weiter mit → #12**

---

### Task #12: Ablage-Bestätigung & Ordner-Erstellung

**Ziel:** Nach Smart-Upload: Pfadvorschau → Nutzer bestätigt → Ordner anlegen → Datei ablegen.

**Inputs:**
- Ablage-Bestätigung aus Abschnitt 7
- Pfadvorschau mit Markierung aus Abschnitt 1

**ToDo:**
1. Edge Function: `supabase/functions/apply-placement/index.ts`
   - Input: `file_id`, `metadata`, `path`, `createFolders: boolean`
   - Transaktion:
     - Falls `createFolders = true`: Ordner rekursiv anlegen (mit `owner_id`)
     - Datei-Eintrag updaten: `folder_id`, `meta`, `title`, `auto_sorted = true`
     - Preview-Generierung anstoßen (siehe Task #13)
     - Badges aktualisieren (Zähler für "neue Dateien" im Ordner)
   - Usage-Tracking: `usage_tracking.smart_upload` inkrementieren
2. UI:
   - `src/components/upload/MetadataConfirmDialog.tsx` (Breadcrumb-Pfad, "neu"-Badges, Bestätigung)

**Output/Artefakt:**
- Edge Function `apply-placement`
- Bestätigungs-Dialog mit Pfad-Preview

**Akzeptanztests:**
- Bestätigung erzeugt fehlende Ordner
- Datei wird in korrekten Ordner verschoben
- Badges erscheinen im Ordner
- Transaktion rollt bei Fehler zurück

**Risiken/Guardrails:**
- Ordner-Erstellung atomisch (BEGIN/COMMIT)
- `owner_id` muss bei allen Ordnern gesetzt sein

**Weiter mit → #13**

---

### Task #13: Office-Preview (Server-Konvertierung ohne Drittanbieter)

**Ziel:** Office-Dateien (DOCX/XLSX/PPTX) server-seitig zu PDF/PNG konvertieren; Viewer.

**Inputs:**
- Office-Preview-Anforderungen aus Abschnitt 8
- Kein Drittanbieter aus Leitplanken

**ToDo:**
1. Edge Function: `supabase/functions/generate-preview/index.ts`
   - Input: `file_id`
   - Auth + Owner-Check
   - Download Datei von `documents`-Bucket
   - Falls DOCX/XLSX/PPTX:
     - Konvertierung via LibreOffice Headless (im Container) oder Pandoc → PDF
     - PDF → PNG-Raster (erste Seite) via ImageMagick/pdf.js
   - Falls PDF: direkt PNG-Raster
   - Falls Bild (JPG/PNG/HEIC): Thumbnail generieren
   - Upload zu `previews`-Bucket
   - DB: `files.preview_state = 'ready'`, `preview_path`
2. UI:
   - `src/components/documents/FilePreview.tsx` (Viewer für Bilder/PDFs)
   - `src/components/documents/OfficeViewer.tsx` (zeigt PNG-Raster)
3. Status-Tracking:
   - `preview_state`: `queued`, `processing`, `ready`, `failed`
4. Background-Processing:
   - Preview-Generierung im Hintergrund (EdgeRuntime.waitUntil)

**Output/Artefakt:**
- Edge Function `generate-preview`
- Viewer-Components
- LibreOffice/Pandoc in Edge Function Container (Deno Deploy: schwierig → ggf. externe Service oder Lambda)

**Akzeptanztests:**
- DOCX wird zu PNG konvertiert
- Preview erscheint im Viewer
- Fehlerhafte Dateien: `preview_state = 'failed'`
- Signierte URLs für Previews

**Risiken/Guardrails:**
- LibreOffice in Edge Function: schwierig (Deno Deploy hat keine Headless-Browser) → ggf. separater Service (AWS Lambda, Cloudflare Workers mit Puppeteer)
- Fallback: Placeholder-Icon bei Preview-Fehler

**Weiter mit → #14**

---

### Task #14: Konfigurierbares Ablageschema (No-Code-Editor)

**Ziel:** Nutzer kann Ablageschema anpassen (z.B. `/{bereich}/{doc_type}/{year}/{month}`); prospektiv wirksam.

**Inputs:**
- Ablageschema-Anforderungen aus Abschnitt 4
- Schema-Config-Tabelle aus Abschnitt 5

**ToDo:**
1. UI:
   - `src/pages/Settings/SchemaEditor.tsx` (No-Code-Builder)
   - Drag&Drop-Interface für Pfad-Segmente: `{bereich}`, `{doc_type}`, `{year}`, `{month}`, `{party}`
   - Live-Vorschau: Beispiel-Pfad anhand aktueller Config
2. Hooks:
   - `src/hooks/useSchemaConfig.ts` (fetch, update)
3. DB-Logic:
   - Bei Save: neuer `schema_config`-Eintrag mit `version++`, `active = true`
   - Alte Config: `active = false`
4. Mapping:
   - `rules` (jsonb): `{ "Rechnung": "Finanzen", "Vertrag": "Verträge", ... }`
   - Fallbacks: z.B. `{doc_type}` → `/Sonstiges` wenn nicht gemappt
5. Reorganisations-Job (optional, später):
   - "Dry-Run"-Modus: Zeige, welche Dateien verschoben würden
   - Bestätigung → Massenverschiebung

**Output/Artefakt:**
- `SchemaEditor.tsx`
- `useSchemaConfig.ts`
- Schema-Mapping-Logic in `smart-upload-classify`

**Akzeptanztests:**
- Schema-Änderung wirkt prospektiv (nur neue Uploads)
- Live-Vorschau zeigt korrekten Pfad
- Alte Dateien bleiben unberührt (außer Reorganisations-Job)

**Risiken/Guardrails:**
- Schema-Validierung: keine Zyklen, keine invaliden Platzhalter
- Reorganisations-Job MUSS atomisch sein (Transaktion)

**Weiter mit → #15**

---

### Task #15: Suche & Filter (ohne KI)

**Ziel:** Suche nach Titel, Tags, Doc-Typ, Datum, Größe, MIME; Filter-UI.

**Inputs:**
- Such-Anforderungen aus Abschnitt 9
- GIN-Index auf Tags aus Task #2

**ToDo:**
1. Hooks:
   - `src/hooks/useFileSearch.ts` (Supabase Query mit Filtern)
2. UI:
   - `src/components/documents/SearchBar.tsx` (Suchfeld)
   - `src/components/documents/FilterPanel.tsx` (Sidebar mit Checkboxes/Datepicker)
3. Filter:
   - Titel (ILIKE)
   - Tags (GIN-Index, ANY-Operator)
   - Doc-Typ (ENUM)
   - Datum-Bereich (BETWEEN)
   - Größe-Bereich
   - MIME-Typ
4. Performance:
   - Debounce für Suchfeld (300ms)
   - Index auf `title` (optional, GIN für Full-Text)

**Output/Artefakt:**
- `useFileSearch.ts`
- `SearchBar.tsx`
- `FilterPanel.tsx`

**Akzeptanztests:**
- Suche nach Titel liefert Ergebnisse
- Tag-Filter funktioniert (GIN-Index)
- Datum-Bereich-Filter filtert korrekt
- Suche ist performant (<500 ms)

**Risiken/Guardrails:**
- RLS muss bei Suche greifen (nur eigene Dateien)
- Keine SQL-Injection (Supabase Client schützt)

**Weiter mit → #16**

---

### Task #16: Badges & "Neue Dateien"-Indikator

**Ziel:** Pro Ordner: Badge mit Anzahl neuer Dateien; verschwindet nach erstem Öffnen.

**Inputs:**
- Badges-Anforderungen aus Abschnitt 1
- UI/UX-Spezifikation aus Abschnitt 10

**ToDo:**
1. DB-Erweiterung:
   - Neue Tabelle: `folder_views(id uuid pk, user_id uuid fk, folder_id uuid fk, last_viewed_at timestamp)`
   - Unique-Constraint: (user_id, folder_id)
2. Logic:
   - Bei Ordner-Öffnung: `folder_views.last_viewed_at` updaten
   - Badge-Zähler: Anzahl Dateien im Ordner mit `created_at > folder_views.last_viewed_at`
3. UI:
   - `src/components/folders/FolderBadge.tsx` (Badge mit Zahl)
   - Badge in `FolderTree.tsx` anzeigen

**Output/Artefakt:**
- `004_folder_views.sql` (Migration)
- `FolderBadge.tsx`
- Badge-Zähler-Logic

**Akzeptanztests:**
- Badge erscheint bei neuen Dateien
- Badge verschwindet nach Öffnen des Ordners
- Badge ist pro Nutzer (RLS)

**Risiken/Guardrails:**
- RLS auf `folder_views` (nur eigene Views)
- Performance: Badge-Zähler via DB-Function (nicht Client-berechnet)

**Weiter mit → #17**

---

### Task #17: Themes (Light/Dark/Colorful) & Profil-Menü

**Ziel:** Theme-Switcher (Light/Dark/Colorful); Profil-Menü oben rechts mit Plan, Sprache, Theme.

**Inputs:**
- Theme-Anforderungen aus Abschnitt 1 (Profil & UI)
- UI/UX-Spezifikation aus Abschnitt 10

**ToDo:**
1. Context:
   - `src/contexts/ThemeContext.tsx` (Theme-State, Persistenz in `profiles.theme`)
2. Themes:
   - `index.css`: HSL-Variablen für Light/Dark/Colorful (kontrastreich, zugänglich)
   - Colorful: bewusst bunt, aber mit ausreichendem Kontrast (WCAG AA)
3. UI:
   - `src/components/layout/ProfileMenu.tsx` (Dropdown oben rechts)
   - `src/components/layout/ThemeSwitcher.tsx` (Radio-Buttons: Light/Dark/Colorful)
   - `src/components/layout/LanguageSwitcher.tsx` (DE/EN)
4. Profil-Menü:
   - Konto-Einstellungen
   - Plan/Upgrade
   - Sprache (DE/EN)
   - Theme (Light/Dark/Colorful)
   - Logout

**Output/Artefakt:**
- `ThemeContext.tsx`
- `ProfileMenu.tsx`
- `ThemeSwitcher.tsx`
- Theme-HSL-Variablen in `index.css`

**Akzeptanztests:**
- Theme wechselt sofort (ohne Reload)
- Theme persistiert (in `profiles.theme`)
- Colorful-Theme hat ausreichenden Kontrast
- Sprache wechselt (i18n)

**Risiken/Guardrails:**
- Colorful-Theme MUSS WCAG AA erfüllen
- System-Preference Detection (prefers-color-scheme)

**Weiter mit → #18**

---

### Task #18: Animations & User-Feedback (Framer Motion)

**Ziel:** Sanfte Animationen (Framer Motion sparsam); klare Hover/Active/Loading-Zustände.

**Inputs:**
- UI/UX-Spezifikation aus Abschnitt 10
- User-Feedback-Anforderungen aus Abschnitt 1

**ToDo:**
1. Dependencies:
   - `framer-motion` (bereits installiert?)
2. Animationen:
   - Fade-In für Datei-Karten
   - Slide-In für Sidebar
   - Loading-Spinner (shadcn)
   - Progress-Bar für Upload
3. Hover/Active-Zustände:
   - Buttons: Hover (scale, brightness)
   - Datei-Karten: Hover (shadow, border)
   - Context-Menü: Hover (background)
4. Beispiel:
   ```tsx
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.3 }}
   >
     <FileCard />
   </motion.div>
   ```

**Output/Artefakt:**
- Animationen in Key-Components (FileCard, FolderTree, Dialogs)
- Loading-Zustände (Spinner, Skeleton)

**Akzeptanztests:**
- Animationen sind smooth (60fps)
- Loading-Zustände erscheinen bei Async-Operationen
- Hover/Active-Zustände sind erkennbar

**Risiken/Guardrails:**
- Framer Motion **sparsam** einsetzen (Performance)
- Reduced-Motion-Preference beachten (CSS: prefers-reduced-motion)

**Weiter mit → #19**

---

### Task #19: Observability & Monitoring

**Ziel:** Logging, Error-Tracking, Performance-Monitoring (APM, Edge, DB).

**Inputs:**
- Observability-Anforderungen aus Abschnitt 3.1
- Non-Functional Requirements aus Abschnitt 13

**ToDo:**
1. Logging:
   - Edge Functions: `console.log`, `console.error` (strukturiert)
   - Client: Error-Boundaries mit Fallback-UI
2. Monitoring:
   - Supabase Dashboard: DB-Queries, Edge Function Latency
   - Optional: Sentry (Client + Server)
3. Metriken:
   - LCP < 2 s (Core Web Vitals)
   - KI-Pipeline < 5-8 s (Smart Upload)
   - DB-Queries < 500 ms
4. Alerts:
   - Edge Function Error Rate > 5%
   - DB Slow Queries > 1 s
   - Storage-Quota > 90%

**Output/Artefakt:**
- Logging-Standards (strukturierte Logs)
- Error-Boundaries
- Monitoring-Dashboards (Supabase + optional Sentry)

**Akzeptanztests:**
- Errors werden geloggt
- Slow Queries erscheinen in Dashboard
- Error-Boundary fängt Crashes

**Risiken/Guardrails:**
- Keine PII in Logs
- Log-Level: DEBUG nur in Dev, INFO/WARN/ERROR in Prod

**Weiter mit → #20**

---

### Task #20: Backups & PITR (Point-in-Time Recovery)

**Ziel:** Tägliche Backups; PITR aktivieren; Rollback-Prozess dokumentieren.

**Inputs:**
- Betrieb-Anforderungen aus Abschnitt 13
- Deployment-Anforderungen aus Abschnitt 14

**ToDo:**
1. Supabase Backups:
   - Aktiviere tägliche Backups (Supabase Dashboard)
   - PITR aktivieren (Point-in-Time Recovery, 7 Tage)
2. Storage-Backups:
   - Supabase Storage hat eigene Redundanz (keine Action nötig)
3. Rollback-Prozess:
   - Dokumentation: `docs/ROLLBACK.md`
   - Schritte: Backup-Restore via Supabase Dashboard
4. Disaster Recovery:
   - RTO (Recovery Time Objective): < 4 h
   - RPO (Recovery Point Objective): < 24 h

**Output/Artefakt:**
- Aktivierte Backups (Screenshot aus Dashboard)
- `docs/ROLLBACK.md`

**Akzeptanztests:**
- Backup existiert (tägliches Schedule)
- PITR funktioniert (Test-Restore)
- Rollback-Prozess dokumentiert

**Risiken/Guardrails:**
- Backups MÜSSEN vor Prod-Deployment aktiv sein
- Test-Restores regelmäßig durchführen

**Weiter mit → #21**

---

### Task #21: Kosten-Kontrolle & Usage-Dashboards

**Ziel:** Dashboards für Smart-Uploads, Speicher, KI-Tokens; Alarme bei Anomalien.

**Inputs:**
- Kosten-Kontrolle aus Abschnitt 14
- Usage-Tracking aus Task #9

**ToDo:**
1. Analytics-Dashboard:
   - `src/pages/Admin/UsageDashboard.tsx` (nur für Admins)
   - Metriken:
     - Smart-Uploads/Monat (gesamt + pro Plan)
     - Speicher-Nutzung (gesamt + pro User)
     - OpenAI-Token-Verbrauch (geschätzt)
     - Stripe-Revenue
2. Queries:
   - `usage_tracking` aggregieren (GROUP BY feature, date)
   - Storage-Usage via Supabase API
3. Alarme:
   - Email-Alert bei KI-Kosten > 50 €/Tag
   - Email-Alert bei Storage > 90% Quota

**Output/Artefakt:**
- `UsageDashboard.tsx`
- Alarm-Logic (Edge Function oder Cron)

**Akzeptanztests:**
- Dashboard zeigt korrekte Metriken
- Alarme triggern bei Schwellwerten

**Risiken/Guardrails:**
- Dashboard nur für Admins (RLS oder Hardcoded User-IDs)
- KI-Kosten-Schätzung basierend auf Token-Zählung

**Weiter mit → #22**

---

### Task #22: Akzeptanztests & End-to-End-Tests

**Ziel:** Automatisierte Tests für kritische User-Flows; manuelle Akzeptanztests.

**Inputs:**
- Akzeptanzkriterien aus Abschnitt 15
- Alle vorherigen Tasks

**ToDo:**
1. E2E-Tests (Playwright):
   - Signup → Login → Upload → Smart Upload → Download → Logout
   - Owner-Isolation: User A kann keine Dateien von User B sehen
   - Feature-Gating: Free-User sieht kein Galerie-View
2. Unit-Tests:
   - Metadaten-Extraktion (Mocking OpenAI)
   - SHA-256-Hash-Berechnung
   - Schema-Mapping
3. Manuelle Tests:
   - Office-Preview (verschiedene Formate)
   - Responsive Design (Mobile)
   - Dark/Colorful-Themes

**Output/Artefakt:**
- `tests/e2e/` (Playwright-Tests)
- `tests/unit/` (Vitest-Tests)
- Test-Report

**Akzeptanztests:**
- Alle kritischen Flows funktionieren
- Owner-Isolation verifiziert
- Feature-Gating verifiziert

**Risiken/Guardrails:**
- Tests MÜSSEN vor Prod-Deployment grün sein
- Keine Hardcoded-Credentials in Tests

**Weiter mit → #23**

---

### Task #23: Deployment & CI/CD

**Ziel:** CI/CD-Pipeline für Dev/Staging/Prod; automatische Migrations & Edge-Deploy.

**Inputs:**
- Deployment-Anforderungen aus Abschnitt 14
- Environments aus Abschnitt 14

**ToDo:**
1. Environments:
   - Dev (lokale Supabase)
   - Staging (Supabase Cloud)
   - Prod (Supabase Cloud, EU-Region)
2. CI/CD (GitHub Actions):
   - Pipeline: Lint → Test → Build → Deploy
   - Migrations: automatisch bei Merge (via Supabase CLI)
   - Edge Functions: automatisch deployen
3. Rollback:
   - Canary-Releases für Edge Functions (10% Traffic → 100%)
   - DB-Migrations versioniert (mit Rollback-Skripten)

**Output/Artefakt:**
- `.github/workflows/deploy.yml`
- Supabase CLI in Pipeline
- Deployment-Dokumentation

**Akzeptanztests:**
- Pipeline läuft durch (grün)
- Migrations werden angewendet
- Edge Functions deployen automatisch

**Risiken/Guardrails:**
- Migrations MÜSSEN rückwärtskompatibel sein
- Rollback-Skripte für jede Migration

**Weiter mit → #24**

---

### Task #24: Dokumentation & Handoff

**Ziel:** Vollständige Dokumentation für Dev, Ops, Support; Handoff an Team.

**Inputs:**
- Alle vorherigen Tasks
- Softwaredokumentation (MVP)

**ToDo:**
1. Dokumentation:
   - `README.md` (Setup, Development, Deployment)
   - `docs/ARCHITECTURE.md` (Architekturübersicht)
   - `docs/API.md` (Edge Functions, Endpoints)
   - `docs/ROLLBACK.md` (bereits in Task #20)
   - `docs/TROUBLESHOOTING.md` (Häufige Probleme)
2. Code-Kommentare:
   - Kritische Funktionen kommentieren (v.a. RLS, Edge Functions)
3. Handoff:
   - Knowledge-Transfer-Session (Walkthrough)
   - Q&A-Session

**Output/Artefakt:**
- Vollständige Dokumentation in `docs/`
- Kommentierter Code

**Akzeptanztests:**
- Dokumentation ist vollständig
- Neues Team-Mitglied kann Setup ohne Hilfe durchführen

**Risiken/Guardrails:**
- Dokumentation MUSS vor Prod-Release fertig sein

**Weiter mit → FERTIG**

---

## 📝 Abschluss-Checkliste

- [ ] **Task #1-24:** Alle Tasks abgeschlossen
- [ ] **RLS:** Owner-Isolation verifiziert (Security-Scan)
- [ ] **Feature-Gating:** Server-seitige Checks aktiv
- [ ] **Smart Upload:** Funktioniert mit realen Dokumenten
- [ ] **Stripe:** Zahlungen & Webhooks funktionieren
- [ ] **Backups:** Tägliche Backups aktiv
- [ ] **Monitoring:** Dashboards & Alarme konfiguriert
- [ ] **Tests:** E2E-Tests grün
- [ ] **Deployment:** CI/CD-Pipeline funktioniert
- [ ] **Dokumentation:** Vollständig

---

## 🚀 Nächste Schritte (MVP+1)

Nach MVP:
- **Sharing:** Read-Only-Links (Passwort, Ablaufdatum)
- **Massentagging:** Tags für mehrere Dateien gleichzeitig
- **Volltext-OCR-Suche:** Suche im Datei-Inhalt (nicht nur Metadaten)
- **Reorganisations-Assistent:** Bestandsdateien nach neuem Schema verschieben
- **Regel-Editor:** IF-THIS-THEN-PLACE (z.B. "Wenn Absender = X → Ordner Y")
- **Mobile-App:** React Native oder PWA

---

**Ende BUILD_PROMPTS.md**
