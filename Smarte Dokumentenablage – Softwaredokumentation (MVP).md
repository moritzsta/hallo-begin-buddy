# Smarte Dokumentenablage — Software-Dokumentation (MVP)

**Ziel**: Eine B2C‑Web‑App für EU‑Nutzer (DE/EN), die Dokumente und Bilder in der Cloud speichert und dank **„Smart Upload“** automatisch mit Metadaten versieht und in eine passende Ordnerstruktur einsortiert. **Alle Daten sind strikt per Owner‑Isolation geschützt** (RLS). **Kein Drittanbieter** für Office‑Previews (eigene Server‑Konvertierung). **USP**: intelligente Ablage, nicht unendlicher Speicher.

---

## 1) Funktionsumfang (MVP)

- **Ordner & Dateien**
  - Ordner erstellen, umbenennen, verschieben, löschen.
  - Dateien hochladen (Einzel- & Massenupload), umbenennen, verschieben, löschen, herunterladen.
  - Ansichten: **detailliert**, **kompakt**, **Galerie** (für Bilder).
  - **Kontextmenü** je Datei/Ordner: Umbenennen, Verschieben, Löschen, (später: Share‑Link), Vorschau.
  - **Preview**: Bilder (JPG/PNG/HEIC), PDF, Office (DOCX/XLSX/PPTX) via eigener Server‑Konvertierung (ohne Drittanbieter).
  - **„Neue Dateien“-Badges** pro Ordner **und pro Nutzer**; verschwinden nach erstem Öffnen des Ordners.

- **Upload**
  - **Manuell**: Nutzer gibt optional Metadaten ein.
  - **Smart Upload**: OCR nur **Seite 1** → KI erzeugt Titel & Metadaten (DE/EN). Dateiname/EXIF/Erstelldatum werden mit einbezogen.
  - **Ablage-Pfad-Vorschau** mit **farblicher Markierung neuer Ordner**; **Bestätigung erforderlich** bevor neue Ordner angelegt werden.
  - **Duplikate**: Erkennung über **SHA‑256 Inhalts‑Hash**; bei Treffer wird **verknüpft** (kein Kopieren/zweites Speichern).

- **Metadaten**
  - **Dokument**: `title`, `doc_type`, `date`, `party` (Gegenpartei), `amount` (optional), `source.filename`, `source.exif`, `confidence`, `auto_sorted:boolean`.
  - **Ordner**: Freitext-Metadaten; **Vererbung** der Metadaten vom Elternordner (mit Override möglich).
  - **Tags**: nur **manuell**; einfache Tags (Massentagging: später).

- **Profil & UI**
  - **Profilmenü oben rechts (seitenkonsistent)**: Konto, Plan/Upgrade, Sprache (DE/EN), Theme (Light/Dark/**Colorful**).
  - **Themes**: Light, Dark und **Colorful** (bewusst bunt/überladen, aber kontrastreich & zugänglich).
  - **User‑Feedback**: Buttons/Interaktionen mit klaren Hover/Active/Loading‑Zuständen, sanfte Animationen (Framer Motion sparsam).

---

## 2) Pläne, Limits & Preise (ohne Team)

**Kostenfaktoren**: Supabase‑Storage (100 GB inkl., danach ~0,021 $ / GB / Monat) + KI pro „Smart Upload“ (Seite‑1‑OCR lokal, kompakte KI‑Prompts).  
**Gatekeeping**: **Smart‑Uploads/Monat** + **Speicher** + **max. Dateigröße**. Fokus auf die smarte Ablage als Werttreiber.

| Plan | Preis/Mon | Smart‑Uploads/Mon | Speicher | Max. Datei | Wichtige Features |
|---|---:|---:|---:|---:|---|
| **Free** | 0 € | 30 | 5 GB | 25 MB | Previews (Bild/PDF/Office), 2 Ansichten, Badges, manuelle Tags |
| **Basic** | **3,99 €** | 300 | 50 GB | 250 MB | + Galerie‑Ansicht, **freundlicher Massenupload**, Pfad‑Vorschau mit Bestätigung |
| **Plus** | **7,99 €** | 1 500 | 200 GB | 1 GB | + Versionsverlauf 30 Tage, priorisierte Verarbeitung |
| **Max** | **12,99 €** | 5 000 | 1 TB | 2 GB | + Versionsverlauf 180 Tage, Early‑Access Massentagging |

**Überzug/Fair‑Use**  
- Zusatz‑**Smart‑Uploads**: Blöcke zu je 100 für 0,99 €.  
- Zusatz‑**Speicher**: +0,03–0,05 € / GB / Mon (kleiner Aufschlag zur Deckung von Previews & Metadaten).

---

## 3) Architektur

### 3.1 Technologie‑Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion (sparsam), i18n (DE/EN).  
- **Backend**: Supabase (Postgres + **RLS**, Auth, Storage, Edge Functions).  
- **KI**: OCR **lokal** (Tesseract in Edge‑Function‑Container); OpenAI (kompakte Modelle) für Klassifikation, Metadaten & Titelerzeugung (DE/EN), mit Response‑Caching.  
- **Payments**: Stripe (Checkout, Portal, Webhooks, Proration).  
- **Observability/Ops**: Logging, Monitoring (APM/Edge/DB), Backups/PITR.

### 3.2 Edge Functions (Beispiele)
- `smart-upload-classify`  
  Auth‑Check → Plan/Usage‑Check → OCR(Seite 1) → KI‑Extraktion (Metadaten) → Titelvorschlag → **Schema‑Mapping** → Pfadvorschlag + Markierung „neu“ → Antwort; Usage++
- `apply-placement`  
  Transaktion: ggf. neue Ordner erstellen → Datei einlagern → Previews generieren → Badges/„neu“-Zähler aktualisieren.
- `generate-title`  
  Kurzer, gut lesbarer Titel aus Metadaten (freie Formulierung).
- `check-subscription`, `create-checkout`, `customer-portal`  
  Stripe-Lifecycle.

---

## 4) Konfigurierbares Default‑Ablageschema

- **Voreinstellung (pro Nutzer anpassbar):**  
  `/{bereich}/{doc_type}/{year}/{month}`
- **Beispiel‑Bereiche (Startliste):** `Finanzen`, `Verträge`, `Behörden`, `Gesundheit`, `Schule/Uni`, `Arbeit`, `Privat`, `Reisen`, `Fotos`.
- **Konfig‑Tabelle**: `schema_config (id, user_id, version, rules jsonb, active bool)`  
  - `rules` enthält: Mapping `doc_type → bereich`, optionale Teile (z. B. `{party}`), Fallbacks.
- **Schema‑Editor (UI)**: No‑Code‑Builder mit Live‑Vorschau; Prospektiv wirksam. Optionaler **Reorganisieren‑Job** (Dry‑Run) für Bestandsdateien.

---

## 5) Datenmodell (vereinfacht)

### 5.1 Tabellen
- `profiles(id uuid pk, plan_tier text, locale text, theme text, created_at, updated_at)`  
- `folders(id uuid pk, owner_id uuid fk->profiles.id, parent_id uuid null, name text, meta jsonb, inherited_meta jsonb, created_at, updated_at)`  
- `files(id uuid pk, owner_id uuid fk->profiles.id, folder_id uuid fk->folders.id, storage_path text, mime text, size bigint, hash_sha256 text, title text, meta jsonb, tags text[], preview_state text, created_at, updated_at)`  
  - `meta` für: `doc_type`, `date`, `party`, `amount`, `source.filename`, `source.exif`, `confidence`, `auto_sorted`  
- `usage_tracking(id bigserial pk, user_id uuid fk->profiles.id, feature text, date date, count int)`  
- `schema_config(id uuid pk, user_id uuid fk->profiles.id, version int, rules jsonb, active bool)`  
- `audit_log(id bigserial pk, user_id uuid, action text, entity text, entity_id uuid, details jsonb, created_at)`

### 5.2 Indizes
- `files(hash_sha256)`, `files(tags) GIN`, `usage_tracking(user_id, feature, date)`; Foreign‑Keys mit `ON DELETE CASCADE`.

---

## 6) Sicherheit & RLS (Owner‑Only by default)

**Ziel**: Von Anfang an sicher. **Nur der Owner** kann seine Ordner/Dateien sehen & bearbeiten.

- `profiles`  
  - UPDATE/SELECT nur für `auth.uid() = id` (sensibles Profil).  
- `folders`  
  - SELECT/UPDATE/DELETE **nur**, wenn `owner_id = auth.uid()`  
  - INSERT erzwingt `owner_id = auth.uid()`
- `files`  
  - SELECT/UPDATE/DELETE **nur**, wenn `owner_id = auth.uid()`  
  - INSERT erzwingt `owner_id = auth.uid()`; `folder_id` muss zu Ordner des Owners gehören.
- `usage_tracking`  
  - SELECT/INSERT/UPDATE **nur**, wenn `user_id = auth.uid()`
- **Downloads/Previews** ausschließlich via **kurzlebige signierte URLs**, generiert in Edge Functions (Auth + Plan‑Check).  
- **Audit‑Logging**: Upload, Verschieben, Löschen, Link‑Erzeugung.

> **Testkriterien**: Kein Cross‑Tenant‑Listing möglich; direkte ID‑Erraten verhindert; alle Policies greifen in Integration‑Tests.

---

## 7) Smart Upload – Ablauf & Kostenbremse

1. **Client**: Datei → `smart-upload-classify` (mit JWT).  
2. **Server**:  
   - Plan‑ & Rate‑Check (Usage: `smart_upload`), Dateigröße/Typ prüfen.  
   - **OCR Seite‑1** (Tesseract).  
   - **KI‑Extraktion** (kompakte Prompts; DE/EN) + **Titelvorschlag**.  
   - **Schema‑Mapping** → Pfadvorschlag (neue Ordner markiert).  
   - **Dedup (SHA‑256)** → ggf. **Verknüpfung** statt Kopie.  
   - Antwort mit Metadaten + Pfadvorschau.
3. **Client**: UI zeigt Pfadvorschau → **Bestätigung**.  
4. **Server (`apply-placement`)**: Transaktion → Ordner anlegen (falls bestätigt) → Datei ablegen → Previews → Usage++ → Badges aktualisieren.

**Sparsamkeit**: Nur Seite‑1; kurze Prompts; **Caching** wiederkehrender Absender/Layout‑Typen; Backoff bei Fehlern.

---

## 8) Office‑Preview (ohne Drittanbieter)

- **Konvertierung**: Headless LibreOffice/Pandoc im Container → PDF/PNG‑Raster (on‑demand Seiten).  
- **Viewer**: interner PDF/Bild‑Viewer.  
- **Storage**: Previews in separatem Bucket (`previews`), Zugriff via **signed URL**.  
- **Status**: `preview_state = queued | ready | failed`.

---

## 9) Suche (ohne KI‑Suche)

- Suchfelder: Titel, Tags, Ordner‑Metadaten, Doc‑Typ, Datum, Größe, MIME.  
- Später optional: Volltext‑OCR‑Suche (nicht im MVP).

---

## 10) UI/UX‑Spezifikation

- **Header rechts**: Profil‑Menü (Plan/Portal, Sprache, Themes Light/Dark/Colorful).  
- **Seitenlayout**: Linke Sidebar (Ordnerbaum + Badges), Hauptbereich (Liste/Kacheln), rechte Info‑Leiste (Metadaten, Aktivität).  
- **Massenupload UX**: Drag&Drop ganzer Ordner, parallele Uploads, Fortschrittsbalken, Konflikt‑Dialog (Duplikat → Verknüpfung).  
- **Ablage‑Vorschau**: Klarer Pfad‑Breadcrumb; **„neu“** neben Ordnern, die entstehen würden; expliziter Bestätigungs‑Button.  
- **Animationen & Icons**: dezente Transitions (Framer Motion), klare Iconographie (z. B. lucide‑react).  
- **Barrierefreiheit**: ausreichende Kontraste (auch im **Colorful**‑Mode), Tastatur‑Fokus, ARIA‑Labels.

---

## 11) Limits & Feature‑Gating (technisch)

- **Client & Server** prüfen erlaubte Features gegen `plan_tier` + **Usage‑Zähler** (z. B. `smart_upload/month`).  
- Bei Limit‑Verstößen: **Upgrade‑Prompt** (nicht blockierend im UI) + Server‑Antwort `403 feature_forbidden`.

---

## 12) Sharing (MVP+1)

- **Read‑Only‑Link** (optional Passwort & Ablaufdatum).  
- Technisch: signierte, kurzlebige Token‑URLs; **kein** öffentlicher Bucket.

---

## 13) Non‑Functional Requirements

- **Performance**: LCP < 2 s; KI‑Pipeline < 5–8 s; DB‑Queries < 500 ms.  
- **Sicherheit**: RLS strikt, Audit‑Logging, TLS, Secret‑Härtung.  
- **Betrieb**: tägliche Backups, PITR; Monitoring (APM, Edge Function Error Rate/Latency, Storage‑ und KI‑Kosten).

---

## 14) Deployment & Ops

- **Environments**: Dev / Staging / Prod; CI/CD mit Migrations & Edge‑Deploy.  
- **Kosten‑Kontrolle**: Dashboards für Smart‑Uploads, Speicher, KI‑Tokens; Alarme bei Anomalien.  
- **Rollbacks**: DB‑Migrations versioniert; Canary‑Releases für Edge Functions.

---

## 15) Akzeptanzkriterien (Auszug)

- **Owner‑Isolation**: Fremde Ordner/Dateien sind nicht list‑/lesbar; direkte ID‑Zugriffe scheitern an RLS.  
- **Smart Upload**: Beispielrechnung → richtige Metadaten → passender Pfad → neue Ordner markiert → Anlage erst nach Bestätigung.  
- **Badges**: „Neu“‑Indikator verschwindet nach erstem Öffnen (pro Nutzer, pro Ordner).  
- **Limits**: Nach Ausschöpfung der Smart‑Uploads erscheint Upgrade‑Prompt; Server blockt mit 403.

---

## 16) Roadmap

- **MVP**: Alles oben.  
- **MVP+1**: Read‑Only‑Sharing, Massentagging, optional Volltext‑OCR‑Suche.  
- **MVP+2**: Regel‑Editor (IF‑THIS‑THEN‑PLACE), Reorganisations‑Assistent, Mobile‑App.

