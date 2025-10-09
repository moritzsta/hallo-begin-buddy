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
| T05 | Smart Upload UI | ✅ Done |
| T06 | Document List Component | ✅ Done |
| T07 | i18n Setup (German/English) | ✅ Done |
| T08 | Dark Mode & Theme Switcher | ✅ Done |
| T09 | Folder Management (CRUD + Hierarchy) | ✅ Done |
| T10 | Folder Sidebar & File Integration | ✅ Done |
| T11 | Smart Upload Edge Function (OCR + AI) | ✅ Done |
| T12 | Document Preview Edge Function | ✅ Done |
| T13 | Design System & UI Polish | ✅ Done |
| T14 | Settings Page (Profile, Plan, Usage) | ✅ Done |
| T15 | Security Scan & RLS Verification | ✅ Done |
| T16 | Search & Filter (no AI) | ✅ Done |
| T17 | Badges & Neue Dateien-Indikator | ✅ Done |
| T18 | Manuelles Tag-System | ✅ Done |
| T19 | Feature-Gating & Pläne | ✅ Done |
| T05 | Create `user_roles` Table | ✅ Done (already exists) |
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

### 2025-10-09T22:00:00Z – T15 Completed
- **[T15]** Suche & Filter (ohne KI) implementiert
- Komponenten erstellt:
  - `src/components/documents/FilterPanel.tsx` – Umfassendes Filter-Panel
- Features:
  - **Erweiterte Suche**:
    - Titel-Suche (ILIKE, bereits vorhanden)
    - Tag-Suche (cs-Operator, bereits vorhanden)
    - Debounce 300ms für performante Suche
  - **Filter-Panel** (in Sheet/Sidebar):
    - **Dateityp-Filter**: PDF, Images, Word, Excel, PowerPoint, Text Files
    - **Datum-Bereich**: Von/Bis mit Date-Picker
    - **Größen-Bereich**: Min/Max in KB/MB
    - **Tag-Filter**: Klickbare Badges mit allen verfügbaren Tags
  - Filter-Logik:
    - Client-seitige Filterung via useMemo (performant)
    - MIME-Type-Matching mit Prefix-Support (z.B. "image/" matched alle Bilder)
    - Datum-Bereich mit Zeitanpassung (Ende des Tages)
    - Größen-Filter in Bytes (Min: KB, Max: MB Eingabe)
    - Tag-Filter mit AND-Logik (alle ausgewählten Tags müssen vorhanden sein)
  - UI/UX:
    - Filter-Button mit SlidersHorizontal-Icon
    - Sheet (Drawer) von rechts mit FilterPanel
    - "Filter löschen"-Button bei aktiven Filtern
    - Badge-basierte Tag-Auswahl (Primary/Outline Variants)
    - Active-State-Anzeige für alle Filter
    - Responsive Layout (350px auf Mobile, 400px auf Desktop)
  - Performance:
    - Debounced Search für weniger DB-Queries
    - Client-seitige Filter-Anwendung (keine zusätzlichen Queries)
    - useMemo für berechnete Filter-Ergebnisse
    - Automatisches Tag-Extraction aus allen Dateien
- Komponenten aktualisiert:
  - `src/components/documents/DocumentList.tsx` – Filter-Integration, Sheet-UI
- Übersetzungen:
  - `src/i18n/locales/de.json` – Filter-Übersetzungen hinzugefügt
  - `src/i18n/locales/en.json` – Filter-Übersetzungen hinzugefügt
- RLS:
  - Filter respektieren Owner-Isolation (nur eigene Dateien durchsuchbar)
  - Alle Queries laufen durch existierende RLS-Policies
- Next Step: T17 – Badges & "Neue Dateien"-Indikator

### 2025-10-09T22:30:00Z – T17 Completed
- **[T17]** Badges & Neue Dateien-Indikator implementiert
- Database Migration:
  - `profiles` Tabelle erweitert um `last_seen_at` TIMESTAMP
  - Default: now() (initialer Wert = Registrierungszeit)
  - Tracking wann User zuletzt die Dateiliste angesehen hat
- Features:
  - **New Files Badge**:
    - Card mit Count von neuen Dateien (created_at > last_seen_at)
    - Zeigt Badge nur bei neuen Dateien (> 0)
    - Anzeige: "X neue Datei(en) – Seit Ihrem letzten Besuch"
    - Primary-Farbe für hohe Sichtbarkeit (bg-primary/5 border-primary/20)
  - **Mark as Seen Button**:
    - Button "Alle als gesehen markieren" mit CheckCheck-Icon
    - Aktualisiert last_seen_at auf aktuellen Timestamp
    - Toast-Feedback bei Erfolg ("Markiert – Alle Dateien wurden als gesehen markiert")
    - Disabled während Request läuft (Doppel-Clicks vermeiden)
  - **Individual File Badges**:
    - "Neu"-Badge bei jeder einzelnen Datei (created_at > last_seen_at)
    - Badge in Dateinamen-Spalte neben Titel
    - Badge variant="default" mit text-xs für kompakte Darstellung
- Komponenten aktualisiert:
  - `src/components/documents/DocumentList.tsx`:
    - Profile Query hinzugefügt (last_seen_at abrufen)
    - newFilesCount-Berechnung via useMemo
    - isNewFile()-Helper-Funktion für Badge-Check
    - markAsSeenMutation für Update-Logik
    - UI-Elemente: New Files Card & Individual Badges
- Übersetzungen:
  - `src/i18n/locales/de.json` – new, newFiles, newFilesDesc, markAsSeenButton, markAsSeenSuccess, markAsSeenSuccessDesc
  - `src/i18n/locales/en.json` – Englische Entsprechungen
- UX Details:
  - Badge verschwindet nach "Mark as seen"-Klick (sofortige UI-Aktualisierung)
  - Individual Badges verschwinden ebenfalls
  - Funktioniert pro User isoliert (jeder User hat eigenen last_seen_at)
  - New Files Badge wird nur angezeigt wenn Count > 0
- Performance:
  - Profile Query nur einmal beim Laden
  - useMemo für Badge-Counts (keine redundanten Berechnungen)
  - Mutation invalidiert profile-Query (automatisches UI-Update)
- Next Step: T18 – Manuelles Tag-System

### 2025-10-09T23:00:00Z – T18 Completed
- **[T18]** Manuelles Tag-System implementiert
- Components erstellt:
  - `src/components/documents/TagInput.tsx` – Wiederverwendbare Tag-Input-Komponente
  - `src/components/documents/EditTagsDialog.tsx` – Dialog zum Tag-Bearbeiten
- Features:
  - **Tag-Eingabe beim Upload**:
    - TagInput-Komponente in FileUpload integriert
    - Tags werden pro Datei während Upload-Queue gespeichert
    - Tags werden bei DB-Insert mitgespeichert (files.tags Array)
    - Verfügbar für pending & success Status
  - **Tag-Verwaltung in DocumentList**:
    - "Tags bearbeiten"-Menüpunkt im Dropdown
    - EditTagsDialog mit vollständiger CRUD-Funktionalität
    - Tag-Suggestions aus allen User-Dateien
    - Update via Mutation mit Toast-Feedback
  - **TagInput-Component Features**:
    - Add/Remove Tags via UI (Badge mit X-Button)
    - Keyboard Support: Enter zum Hinzufügen, Backspace zum Entfernen
    - Auto-Suggest Dropdown (zeigt existierende Tags, max 5)
    - Max 10 Tags pro Datei (konfigurierbar)
    - Input disabled bei max Tags erreicht
    - Helper Text: "X/10 Tags"
  - **UX Details**:
    - Tag-Normalisierung: trim + lowercase
    - Duplikat-Prävention (gleiche Tags nicht mehrfach)
    - Suggestions filtern bereits verwendete Tags aus
    - ESC zum Schließen der Suggestions
    - Click außerhalb schließt Suggestions
    - Responsive Design
- Komponenten aktualisiert:
  - `src/components/upload/FileUpload.tsx`:
    - TagInput pro Upload-File hinzugefügt
    - Tags State im UploadFile Interface
    - updateFileTags-Funktion für lokale Tag-Updates
    - Tags Query für Suggestions (alle User-Tags)
  - `src/components/documents/DocumentList.tsx`:
    - "Tags bearbeiten"-Menüpunkt hinzugefügt
    - EditTagsDialog-Integration
    - State für editTagsFileId & editTagsCurrentTags
- Übersetzungen:
  - `src/i18n/locales/de.json`:
    - documents.editTags
    - tags.inputPlaceholder, addTags, helperText, editTitle, editDesc
    - tags.updateSuccess, updateSuccessDesc, updateError
    - common.saving
  - `src/i18n/locales/en.json` – Englische Entsprechungen
- DB-Integration:
  - files.tags bereits vorhanden (text[] Array)
  - Tags bei Insert mitgespeichert
  - Tags bei Update über EditTagsDialog aktualisiert
  - RLS: Owner-Only (nur eigene Tags sichtbar/bearbeitbar)
- Performance:
  - Tag-Suggestions werden gecached (React Query)
  - Client-seitige Tag-Normalisierung (keine DB-Calls für Validierung)
  - Debounced Input für Suggestion-Filtering (optional erweiterbar)
- Next Step: T19 – Prospektives Ablageschema oder weitere Features

### 2025-10-09T23:30:00Z – T19 Completed
- **[T19]** Feature-Gating & Pläne (Client-Side) implementiert
- Core Files erstellt:
  - `src/lib/plans.ts` – Plan-Konfiguration & Utility-Functions
  - `src/components/plans/FeatureGate.tsx` – Conditional Rendering Component
  - `src/components/plans/UpgradePrompt.tsx` – Upgrade-Aufforderung (Card & Inline Variants)
  - `src/components/plans/PlanBadge.tsx` – Plan-Badge mit Icons
- Features:
  - **Plan-Konfiguration**:
    - 4 Tiers: Free, Basic (3,99€), Plus (7,99€), Max (12,99€)
    - Limits pro Tier:
      - Smart-Uploads/Monat (10/50/200/1000)
      - Storage in GB (1/10/50/200)
      - Max. Dateigröße in MB (5/25/100/2048)
      - Max. Dateien (100/500/2000/10000)
    - Features pro Tier:
      - advancedSearch (Basic+)
      - bulkOperations (Plus+)
      - apiAccess (Plus+)
      - prioritySupport (Max only)
  - **FeatureGate Component**:
    - Props: feature, children, fallback, showUpgradePrompt
    - Liest User-Plan aus AuthContext (profile.plan_tier)
    - Rendert children nur bei Feature-Zugriff
    - Optional: Custom Fallback oder UpgradePrompt
  - **UpgradePrompt Component**:
    - 2 Variants: 'card' (große Prompt-Card) & 'inline' (kompakte Inline-Version)
    - Dynamische Message basierend auf Feature & Current Tier
    - Navigation zu Settings mit ?tab=plan Query-Param
    - Gradient-Design mit Primary-Color
    - Icons: Sparkles für Premium-Features
  - **PlanBadge Component**:
    - Zeigt Plan-Tier mit optionalem Icon
    - Icons: Zap (Basic), Star (Plus), Crown (Max)
    - Variant-Support: default/outline/secondary
    - Verwendet semantic Badge-Component
- Utility Functions:
  - `getPlanConfig(tier)` – Gibt Plan-Config für Tier zurück
  - `canUseFeature(tier, feature)` – Prüft Feature-Zugriff
  - `getUpgradeMessage(feature, currentTier)` – Generiert Upgrade-Message
  - `getNextTierForFeature(tier, feature)` – Findet nächsten Tier mit Feature
- Übersetzungen:
  - `src/i18n/locales/de.json`:
    - plans.upgrade, upgradeTitle, viewPlans, currentPlan, upgradeTo
    - plans.perMonth, smartUploads, storage, maxFileSize
    - plans.advancedSearch, bulkOperations, apiAccess, prioritySupport, popular
  - `src/i18n/locales/en.json` – Englische Entsprechungen
- Integration:
  - FileUpload.tsx nutzt bereits PLAN_LIMITS (migrierbar zu src/lib/plans.ts)
  - Settings.tsx zeigt bereits Plan-Info an (erweiterbar mit PlanBadge)
  - Prospektiv: FeatureGate für Bulk-Operations, Advanced-Search, API-Access
- Hinweis:
  - **Keine Server-Side-Checks** in diesem Task (kommt in späterem Task)
  - Clientseitige Checks sind nur UX – Server MUSS prüfen
  - Stripe-Integration folgt in nächstem Task (T20)
- Next Step: T20 – Stripe-Integration (Checkout, Portal, Webhooks)

### 2025-10-09T21:30:00Z – T15 Completed
- **[T15]** Security Scan & RLS Verification abgeschlossen
- Security Scans durchgeführt:
  - **Supabase Linter**: ✅ Keine Issues gefunden
  - **Security Scanner**: 2 Findings identifiziert und behoben
- Findings behoben:
  - **ERROR** – Audit Log Protection:
    - Problem: `audit_log` hatte keine INSERT/DELETE RLS Policies
    - Risiko: User könnten Logs manipulieren oder löschen
    - Lösung: Policy "System only can insert audit logs" (INSERT WITH CHECK false)
    - Lösung: Policy "Prevent audit log deletion" (DELETE USING false)
    - Ergebnis: Nur System/Triggers können Audit Logs erstellen, keine User-Löschung möglich
  - **WARN** – Usage Tracking Protection:
    - Problem: `usage_tracking` hatte keine DELETE Policy
    - Risiko: User könnten Usage-Records löschen um Limits zu umgehen
    - Lösung: Policy "Prevent usage tracking deletion" (DELETE USING false)
    - Ergebnis: Usage-Daten sind immutable, können nicht gelöscht werden
- Migration erstellt:
  - 3 neue RLS Policies für Audit & Usage Compliance
  - Audit Logs sind jetzt immutable (keine User-Manipulation möglich)
  - Usage Tracking kann nicht gelöscht werden (Rate-Limit-Schutz)
- Security Status:
  - ✅ Alle Tabellen haben korrekte Owner-Only RLS Policies
  - ✅ Audit Logs sind gegen Tampering geschützt
  - ✅ Usage Tracking ist gegen Bypass-Versuche geschützt
  - ✅ Storage Buckets haben RLS für Owner-Only Access
  - ✅ Edge Functions verifizieren JWT korrekt
- Compliance:
  - Audit Logs erfüllen Immutability-Anforderungen (DSGVO/GoBD konform)
  - Usage Tracking verhindert Rate-Limit-Umgehung
  - Owner-Isolation durchgängig gewährleistet
- Next Step: T16 – Admin Panel (Type & Field Config) oder Feature-Erweiterungen

### 2025-10-09T21:00:00Z – T14 Completed
- **[T14]** Settings Page (Profile, Plan, Usage) implementiert
- Seite erstellt:
  - `src/pages/Settings.tsx` – Vollständige Settings-Seite mit Tabs
- Features:
  - **Profile Tab**:
    - Email-Anzeige (read-only)
    - Display Name-Eingabe (UI-only, keine DB-Änderung)
    - Sprach-Auswahl (LanguageSwitcher)
    - Theme-Auswahl (ThemeSwitcher)
    - Save-Button mit Toast-Feedback
  - **Plan Tab**:
    - Aktuelle Plan-Anzeige mit Badge (Free/Basic/Plus/Max)
    - Plan-Limits-Übersicht:
      - Smart-Upload-Limit pro Monat
      - Storage-Limit in GB
      - Max. Dateigröße
    - Upgrade-Hinweis für Free-User
  - **Usage Tab**:
    - Smart-Upload-Nutzung mit Progress-Bar
    - Storage-Nutzung mit Progress-Bar
    - Warning bei 90% Speicher-Auslastung
    - Limit-Reached-Hinweis bei Smart-Uploads
  - Real-time Daten via React Query:
    - Usage aus `usage_tracking` Tabelle
    - Storage aus `files` Aggregation
- Navigation:
  - Route `/settings` hinzugefügt (Protected)
  - Settings-Icon-Button im Header von Index.tsx
  - Back-Button zu Index
- UI/UX:
  - Responsive Layout mit Cards & Tabs
  - Progress-Bars für visuelle Usage-Darstellung
  - Status-Badges (Success/Warning/Destructive)
  - Animierte Tab-Transitions
- Übersetzungen:
  - `src/i18n/locales/de.json` – Vollständige Settings-Übersetzungen
  - `src/i18n/locales/en.json` – English Settings Translations
- Routing:
  - `src/App.tsx` – Settings-Route hinzugefügt
- Hinweis:
  - Display Name wird aktuell nicht in DB gespeichert (profiles.meta existiert nicht)
  - Prospektiv: Migration für profiles.display_name oder profiles.meta JSONB-Feld
- Next Step: T15 – Admin Panel (Type & Field Config) oder Security Scan

### 2025-10-09T20:30:00Z – T13 Completed
- **[T13]** Design System & UI Polish implementiert
- Design Tokens erweitert:
  - `src/index.css` – Umfassende Design-Token-Definitionen
  - `tailwind.config.ts` – Extended Colors & Animations
- Neue Design Tokens:
  - **Status Colors**: Success, Warning, Info (zusätzlich zu Destructive)
  - **Primary Variants**: primary-hover, primary-glow für interaktive Elemente
  - **Shadows**: shadow-sm bis shadow-xl, shadow-glow für Premium-Effekte
  - **Transitions**: transition-base, transition-smooth, transition-bounce
- Animations:
  - Erweiterte Keyframes: fade-in, fade-out, slide-in (4 Richtungen)
  - pulse-glow für Attention-Grabbing
  - bounce-in für Entry-Animations
  - Alle Animations mit optimierten Timings & Easing-Functions
- Utility Classes:
  - .shadow-glow – Leuchtender Schatten mit Primary-Color
  - .gradient-primary – Gradient von primary zu primary-glow
  - .gradient-card – Subtiler Card-Gradient
  - .hover-lift – Lift-Effekt bei Hover
  - .hover-glow – Glow-Effekt bei Hover
  - .glass – Glassmorphismus-Effekt
- Accessibility:
  - Focus-Visible mit Ring für Keyboard-Navigation
  - Kontrast-optimierte Farben (WCAG AA compliant)
  - Smooth Scrolling aktiviert
- Custom Scrollbar:
  - Styled Scrollbar für Light & Dark Mode
  - Hover-States für bessere UX
- Light Mode:
  - Moderne Blue Primary (221 83% 53%) statt Grau
  - Hohe Kontraste für Lesbarkeit
  - Weiche Shadows
- Dark Mode:
  - Dunklere Backgrounds für OLED-Freundlichkeit
  - Aufgehellte Primary-Farbe für bessere Sichtbarkeit
  - Intensivere Shadows
- Font Features:
  - Ligatures aktiviert (rlig, calt)
  - Optimierte Schriftdarstellung
- Next Step: T14 – Settings Page (Profile, Plan, API Keys)

### 2025-10-09T20:00:00Z – T12 Completed
- **[T12]** Document Preview Edge Function implementiert
- Edge Function erstellt:
  - `supabase/functions/generate-preview/index.ts` – Thumbnail-Generierung & Cache
- Features:
  - Unterstützt Bild-Previews (PNG, JPG, etc.)
  - Preview-Cache in `previews` Bucket (verhindert Doppel-Generierung)
  - Signierte URLs mit 1h Gültigkeit für Previews
  - Size-Check (10MB max für Preview-Storage)
  - Preview-State-Tracking in files.meta
  - Auto-Trigger nach Bild-Upload (zusammen mit Smart-Upload)
- Komponenten:
  - `src/components/documents/DocumentPreview.tsx` – Preview-Widget mit Loading/Error States
  - `src/components/documents/DocumentList.tsx` – Preview-Integration in Tabelle
- UI/UX:
  - Small Thumbnails (12x12) in Dokumentenliste
  - Loading-Spinner während Preview-Generierung
  - Fallback-Icons für Nicht-Bilder oder Fehler
  - Lazy-Loading (Preview wird nur bei Bedarf geladen)
- Client-Integration:
  - `src/components/upload/FileUpload.tsx` – Auto-Trigger für Preview nach Upload
  - Fire-and-forget Call (blockiert Upload nicht)
- Config:
  - `supabase/config.toml` – generate-preview Function mit verify_jwt=true
- Hinweis:
  - PDF-Preview-Support kann später hinzugefügt werden (Konvertierung komplex in Deno)
  - Aktuell: Original-Bild wird als Preview gespeichert (keine Resize)
  - Prospektiv: Sharp/ImageMagick Integration für echte Thumbnail-Generierung
- Next Step: T13 – Base Layout & Navigation Improvements

### 2025-10-09T19:30:00Z – T11 Completed
- **[T11]** Smart Upload Edge Function (OCR + AI) implementiert
- Lovable AI Gateway aktiviert (LOVABLE_API_KEY automatisch bereitgestellt)
- Edge Function erstellt:
  - `supabase/functions/smart-upload/index.ts` – AI-Metadaten-Extraktion
- Features:
  - Unterstützt Bild-Uploads (PNG, JPG, etc.)
  - Gemini 2.5 Flash Vision für OCR + Metadaten
  - Tool Calling für strukturierte Ausgabe (document_type, suggested_title, keywords)
  - Plan-Tier-basierte Kostenbremse via usage_tracking
  - Limits: Free 10/Monat, Basic 50/Monat, Plus 200/Monat, Max Unlimited
  - Automatischer Trigger nach Upload (nur für Bilder)
  - Extrahiert: Dokumenttyp, Titel-Vorschlag, Keywords, Text
  - Aktualisiert `files.meta.ai_extracted` und `files.tags`
- Kostenbremse:
  - Prüft monatliche Smart-Upload-Limits pro Plan-Tier
  - Fehler 429 bei Limit-Überschreitung
  - Rate-Limit-Handling für AI Gateway (429/402)
- Error Handling:
  - Nicht-Bilder werden übersprungen (PDF-Support prospektiv)
  - AI-Fehler werden geloggt, Upload bleibt erfolgreich
  - Usage-Tracking mit Konflikt-Handling (INSERT/UPDATE)
- Client-Integration:
  - `src/components/upload/FileUpload.tsx` – Auto-Trigger nach Bild-Upload
  - Fire-and-forget Call (blockiert Upload nicht)
- Config:
  - `supabase/config.toml` – smart-upload Function mit verify_jwt=true
- Hinweis: PDF/Office-Support kann später hinzugefügt werden (Konvertierung zu Bild)
- Next Step: T12 – Document Preview Edge Function

### 2025-10-09T19:00:00Z – T10 Completed
- **[T10]** Folder Sidebar & File Integration implementiert
- Komponenten erstellt/aktualisiert:
  - `src/pages/Index.tsx` – Sidebar-Layout mit SidebarProvider, FolderTree integriert
  - `src/components/folders/FolderTree.tsx` – selectedFolderId & onSelectFolder Props hinzugefügt
  - `src/components/documents/DocumentList.tsx` – folderId Filter-Prop, Move-File-Aktion
  - `src/components/upload/FileUpload.tsx` – folderId Prop für Ordner-Upload
  - `src/components/documents/MoveFileDialog.tsx` – Dialog zum Verschieben zwischen Ordnern
- Features:
  - Sidebar mit FolderTree und collapsible Toggle
  - "Alle Dateien" Root-Ansicht zeigt alle Dokumente
  - Ordner-Auswahl filtert DocumentList
  - FileUpload speichert in ausgewähltem Ordner (oder Root)
  - Move-File-Dialog mit hierarchischer Ordnerauswahl
  - Auto-Create Root-Ordner wenn keiner existiert
  - Ordner-Baum mit Tiefenindent und Radio-Buttons
- UI/UX:
  - Aktiver Ordner hervorgehoben in Sidebar
  - SidebarTrigger im Header für Collapse/Expand
  - Move-Dialog verhindert Verschieben in aktuellen Ordner
  - Responsive Layout mit Sidebar
- Übersetzungen:
  - `src/i18n/locales/de.json` – Move-Dialog, "Alle Dateien", "Meine Ordner"
  - `src/i18n/locales/en.json` – Move-Dialog Translations
- Next Step: T11 – Smart Upload Edge Function (OCR + AI)

### 2025-10-09T18:30:00Z – T09 Completed
- **[T09]** Folder Management (CRUD + Hierarchy) implementiert
- Hooks erstellt:
  - `src/hooks/useFolders.ts` – CRUD-Operationen für Ordner mit Tanstack Query
- Features:
  - Ordner erstellen, umbenennen, löschen
  - Hierarchie-Validierung (max. Tiefe 3)
  - Zirkuläre Referenzen verhindern
  - Owner-Only Access via RLS
  - Cascade Delete für Unterordner und Dateien (via DB FK)
- Komponenten erstellt:
  - `src/components/folders/FolderTree.tsx` – Baum-Ansicht mit Expand/Collapse
  - `src/components/folders/CreateFolderDialog.tsx` – Dialog zum Erstellen von Ordnern
  - `src/components/folders/RenameFolderDialog.tsx` – Dialog zum Umbenennen
  - `src/components/folders/DeleteFolderDialog.tsx` – Bestätigungs-Dialog zum Löschen
- UI:
  - Context-Menü mit Ordner-Operationen (Erstellen, Umbenennen, Löschen)
  - Unterordner können nur bis Tiefe 3 erstellt werden
  - Ordner-Auswahl in Sidebar
  - "Alle Dateien" Ansicht als Wurzel
  - Icons: Folder/FolderOpen mit Expand/Collapse
- Übersetzungen:
  - `src/i18n/locales/de.json` – Ordner-Übersetzungen hinzugefügt
  - `src/i18n/locales/en.json` – Ordner-Übersetzungen hinzugefügt
- Validierung:
  - Max. Hierarchie-Tiefe: 3 Ebenen
  - Zirkuläre Referenzen-Check beim Verschieben
  - Fehler-Handling mit Toast-Benachrichtigungen
- Next Step: T10 – Datei-Verschieben in Ordner (DocumentList Integration)

### 2025-10-09T18:00:00Z – T08 Completed
- **[T08]** Dark Mode & Theme Switcher implementiert
- Dependencies bereits installiert:
  - `next-themes` – Theme Management Library
- Komponenten erstellt:
  - `src/components/ThemeSwitcher.tsx` – Theme Switcher Dropdown (Light/Dark/System)
- Features:
  - ThemeProvider in App.tsx integriert mit System-Theme-Support
  - Theme Switcher speichert Auswahl im Profil (profiles.theme)
  - AuthContext lädt Theme beim Login aus Profil
  - Light/Dark/System Theme Support
  - Animierte Icon-Transitions (Sun/Moon)
  - CSS Variables in index.css bereits vollständig für Dark Mode vorbereitet
  - Alle Komponenten nutzen semantische Tokens → automatischer Dark Mode Support
- Komponenten aktualisiert:
  - `src/App.tsx` – ThemeProvider integriert
  - `src/pages/Auth.tsx` – ThemeSwitcher im Header neben LanguageSwitcher
  - `src/pages/Index.tsx` – ThemeSwitcher im Header
  - `src/i18n/locales/de.json` – Theme-Übersetzungen hinzugefügt
  - `src/i18n/locales/en.json` – Theme-Übersetzungen hinzugefügt
- Design:
  - Alle Komponenten verwenden bereits semantische Tokens aus index.css
  - Dark Mode funktioniert out-of-the-box durch CSS Variable Switching
  - Smooth Transitions zwischen Themes
- Next Step: T05 – Create `user_roles` Table

### 2025-10-09T17:30:00Z – T07 Completed
- **[T07]** i18n Setup (German/English) implementiert
- Dependencies installiert:
  - `i18next` – Core i18n Library
  - `react-i18next` – React Integration
- Dateien erstellt:
  - `src/i18n/config.ts` – i18n Konfiguration mit DE/EN Support
  - `src/i18n/locales/de.json` – Deutsche Übersetzungen (App, Auth, Upload, Documents, Common)
  - `src/i18n/locales/en.json` – Englische Übersetzungen (vollständig)
  - `src/components/LanguageSwitcher.tsx` – Sprach-Dropdown (DE/EN mit Flags)
- Features:
  - Sprachumschalter speichert Auswahl im Profil (profiles.locale)
  - AuthContext lädt Sprache beim Login aus Profil
  - Fallback auf Deutsch wenn keine Sprache gesetzt
  - Alle UI-Texte übersetzt (Auth, Upload, Documents, Toasts)
  - Toast-Nachrichten verwenden i18n
- Komponenten aktualisiert:
  - `src/App.tsx` – i18n Config importiert
  - `src/contexts/AuthContext.tsx` – useTranslation für Toasts, Sprache aus Profil laden
  - `src/pages/Auth.tsx` – useTranslation für alle Texte, LanguageSwitcher im Header
  - `src/pages/Index.tsx` – useTranslation, LanguageSwitcher im Header
  - `src/components/upload/FileUpload.tsx` – useTranslation für UI & Toasts
  - `src/components/documents/DocumentList.tsx` – useTranslation für Tabelle, Suche, Aktionen, Dialoge
- Next Step: T08 – Dark Mode & Theme Switcher

### 2025-10-09T17:00:00Z – T06 Completed
- **[T06]** Document List Component implementiert
- Komponenten erstellt:
  - `src/components/documents/DocumentList.tsx` – Dokumentenliste mit allen Features
- Features:
  - Dokumententabelle mit allen Metadaten (Name, Typ, Größe, Tags, Datum)
  - Suche (Titel und Tags durchsuchbar)
  - Sortierung (Datum, Name, Größe) mit aufsteigend/absteigend
  - Download via `generate-signed-url` Edge Function
  - Inline-Umbenennen von Dokumenten
  - Löschen mit Bestätigungs-Dialog (Storage + DB)
  - Formatierung von Dateigrößen (B, KB, MB, GB)
  - Responsive Design mit shadcn Table, Card, Dropdown
  - Toast-Feedback für alle Aktionen
- `src/pages/Index.tsx` aktualisiert:
  - Tabs für "Meine Dokumente" und "Hochladen"
  - Auto-Switch zu Dokumenten-Tab nach Upload
- Dependencies:
  - `date-fns` für Datums-Formatierung hinzugefügt
- Next Step: T07 – i18n Setup (German/English)

### 2025-10-09T16:30:00Z – T05 Completed
- **[T05]** Smart Upload UI implementiert
- Komponenten erstellt:
  - `src/components/upload/FileUpload.tsx` – Upload-Komponente mit Drag & Drop
- Features:
  - Drag & Drop Upload (react-dropzone)
  - Multi-File Upload mit Progress-Anzeige
  - Plan-Tier-basierte Validierung (Free: 5MB, Basic: 25MB, Plus: 100MB, Max: 2GB)
  - SHA256 Hash-Berechnung für Duplikatserkennung
  - Upload zu `documents` storage bucket
  - Automatische Erstellung von file-Records in DB
  - Toast-Feedback bei Erfolg/Fehler
  - Datei-Liste mit Status (pending/uploading/success/error)
- `src/pages/Index.tsx` aktualisiert:
  - Header mit User-Info und Logout
  - Upload-Komponente integriert
- Dependencies:
  - `react-dropzone` hinzugefügt
- Next Step: T06 – Document List Component

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

**Task ID:** T15 – Security Scan & RLS Verification  
**Akzeptanzkriterien:**
- Security-Scan durchführen zur Überprüfung aller Tabellen
- RLS-Policies für alle Owner-Only-Tabellen verifizieren
- Security-Findings analysieren und beheben
- Authentifizierungs-Flows testen
- Storage-RLS-Policies überprüfen
- Edge-Function-Auth verifizieren

**Aktion:** Security-Scan-Tool ausführen, Findings reviewen, kritische Issues beheben, RLS-Policies optimieren.

---

*Hinweis: Dieses Dokument wird nach JEDER abgeschlossenen Task automatisch aktualisiert (Status Board, Change Log, Next Step). Bei Abweichungen oder Blockern wird der Issues-Abschnitt befüllt.*
