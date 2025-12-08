# Feature Library – Schnellreferenz für Lovable KI

**Zweck:** Wiederverwendbare, battle-tested Pattern aus 3 Produktionsprojekten (Dokumentenablage, PromptManager, Handwerker-Marketplace)

**Verwendung:** Beim Aufsetzen neuer Lovable-Projekte → relevante Pattern referenzieren → Code-Beispiele adaptieren

---

## 📚 Verfügbare Pattern-Dokumente

### [01-Auth-Profile-Pattern.md](./01-Auth-Profile-Pattern.md)
**Was:** Supabase Auth + erweiterte Profile  
**Wann:** Login/Signup, User-Profile, Gastbenutzer  
**Enthält:**
- Email/Password Auth mit Supabase
- `profiles` Tabelle + Auto-Trigger
- RLS: Owner-only Policies
- React Context (`AuthProvider`, `useAuth`)
- `ProtectedRoute` Component
- **Varianten:** Gastbenutzer-Flow, Multi-Role-System

---

### [02-Subscription-Feature-Gating-Pattern.md](./02-Subscription-Feature-Gating-Pattern.md)
**Was:** Multi-Tier Pläne + Feature-Limits  
**Wann:** Freemium/Premium-Modelle, Usage-Limits  
**Enthält:**
- Plan-Strukturen (Free/Basic/Plus/Max)
- `usage_tracking` Tabelle + RLS
- Server-Side Limit-Checks (Edge Functions)
- `FeatureGate` + `UpgradePrompt` Components
- Stripe Integration (Checkout, Webhooks)
- **Limits:** Smart-Uploads, Speicher, Dateigröße, Features

---

### [03-Security-Pattern.md](./03-Security-Pattern.md)
**Was:** RLS Policies + Owner-Isolation  
**Wann:** Jeden Tabelle mit User-Daten  
**Enthält:**
- **Owner-Isolation:** `user_id = auth.uid()`
- **Public Read, Private Write**
- **Shared Access:** `shared_prompts` + Rollen
- `SECURITY DEFINER` Functions für Admin-Roles
- **Audit Logging:** Trigger für Change-Tracking
- **Signed URLs:** Sichere Storage-Access (Edge Function)

---

### [04-KI-Integration-Pattern.md](./04-KI-Integration-Pattern.md)
**Was:** OpenAI/Lovable AI Integration  
**Wann:** Smart Upload, OCR, Prompt-Verbesserung  
**Enthält:**
- **Smart Upload:** OCR (Tesseract) + Metadaten-Extraktion
- **Smart Improve:** Kontextuelle Prompt-Optimierung (2-Phasen)
- **Cost-Optimization:** Token-Limits, Caching, Rate-Limiting
- Edge Functions: `smart-upload.ts`, `smart-improve-*.ts`
- **Models:** GPT-4o-mini, Gemini-Flash

---

### [05-Datenstruktur-Pattern.md](./05-Datenstruktur-Pattern.md)
**Was:** Hierarchien, Sharing, Metadaten  
**Wann:** Ordner-Strukturen, Tags, Sharing-Links  
**Enthält:**
- **Hierarchien:** `folders` mit `parent_id` (Self-Join)
- **Sharing:** `shared_links` mit UUID-Token + Expiry
- **Metadaten:** JSONB-Felder + GIN-Index
- **Versionierung:** `file_versions` + Rollback
- **Deduplikation:** SHA256-Hash auf Uploads

---

### [06-UI-UX-Pattern.md](./06-UI-UX-Pattern.md)
**Was:** Design System + Theme Management  
**Wann:** Konsistentes UI über gesamte App  
**Enthält:**
- **Theme:** Light/Dark/Custom mit `next-themes`
- **Design System:** HSL-Tokens in `index.css` + `tailwind.config.ts`
- **shadcn/ui:** Button-Varianten, Component-Customization
- **Responsive:** Mobile-First, Breakpoints
- **i18n:** `react-i18next` (DE/EN)
- **UX:** Loading States, Toast Notifications

---

### [07-Communication-Realtime-Pattern.md](./07-Communication-Realtime-Pattern.md)
**Was:** Messaging + Realtime Updates  
**Wann:** Chat, Notifications, Live-Updates  
**Enthält:**
- **Messaging:** `messages` + `conversations` (1:1, Gruppen)
- **Realtime:** Supabase Realtime (Postgres Changes)
- **Presence:** Typing-Indicator, Online-Status
- **Notifications:** `notifications` Tabelle + Badge-Counts
- React Hooks: `useMessages`, `usePresence`

---

### [08-Advanced-Sharing-Pattern.md](./08-Advanced-Sharing-Pattern.md)
**Was:** Private & Public Sharing ohne E-Mail-Exposure  
**Wann:** Team-Kollaboration + Öffentliche Links  
**Enthält:**
- **Private Sharing:** `shared_prompts/folders` mit Rollen (Viewer/Editor)
- **Public Link Sharing:** `shared_links` mit UUID-Token + Expiry
- **E-Mail-Lookup:** `find_user_by_email()` für User-Sharing
- **Edge Functions:** `create-share-link`, `get-shared-file`
- **Security:** Kryptographisch sichere Tokens, Signierte URLs
- **UI:** Share-Dialoge für beide Methoden

---

### [09-PWA-Integration-Pattern.md](./09-PWA-Integration-Pattern.md) ⭐ NEU
**Was:** Progressive Web App mit Install-Prompts  
**Wann:** Native-ähnliche App-Experience, Offline-Support  
**Enthält:**
- **Vite PWA Plugin:** Manifest, Service Worker, Workbox
- **PWAContext:** `beforeinstallprompt` Event-Handling
- **Install Detection:** `display-mode: standalone`, iOS Safari
- **InstallInstructionsDialog:** Plattformspezifische Anleitungen
- **Conditional UI:** Footer nur im Browser, nicht in PWA

---

### [10-Guided-Tour-Pattern.md](./10-Guided-Tour-Pattern.md) ⭐ NEU
**Was:** Interaktives Onboarding mit Step-by-Step-Führung  
**Wann:** Neue Nutzer einführen, Features erklären  
**Enthält:**
- **TourSteps Config:** `data-tour` Attribute Mapping
- **GuidedTourContext:** State-Persistenz in localStorage
- **TourTooltip:** Dynamische Positionierung (auto/top/bottom/left/right)
- **TourBackdrop:** Spotlight-Effekt mit SVG-Mask
- **Keyboard-Navigation:** Enter, Escape, Pfeiltasten

---

### [11-Cookie-Consent-Pattern.md](./11-Cookie-Consent-Pattern.md) ⭐ NEU
**Was:** DSGVO-konforme Cookie-Verwaltung  
**Wann:** Für EU-Compliance, Analytics, Marketing  
**Enthält:**
- **CookieConsentContext:** Preference-Management
- **Cookie-Kategorien:** Necessary, Functional, Analytics, Marketing
- **Consent-Banner:** 3 Optionen (Alle, Notwendig, Einstellungen)
- **CookieSettings Dialog:** Detaillierte Kategorie-Auswahl
- **Versionierung:** Bei Policy-Änderung erneut fragen

---

### [12-Account-Deletion-Pattern.md](./12-Account-Deletion-Pattern.md) ⭐ NEU
**Was:** Sicherer Account-Löschungs-Workflow  
**Wann:** DSGVO-Recht auf Löschung  
**Enthält:**
- **Zwei Modi:** Immediate (24h) + Scheduled (30 Tage)
- **Sicherheit:** Passwort-Verifikation + Bestätigungstext
- **Token-Stornierung:** Ohne Login per E-Mail-Link
- **Subscription Block:** Aktive Abos müssen zuerst gekündigt werden
- **Content Duplication:** Geteilte Inhalte vor Löschung duplizieren

---

### [13-Version-History-Pattern.md](./13-Version-History-Pattern.md) ⭐ NEU
**Was:** Automatische Versionierung mit Rollback  
**Wann:** Undo-Funktion, AI-Änderungen nachvollziehen  
**Enthält:**
- **prompt_versions Tabelle:** Change-Type-Tracking
- **Change Types:** manual_edit, ai_improvement, description_change, tag_change
- **savePromptVersion():** Utility für automatisches Speichern
- **PromptVersionHistory:** Timeline-View mit Rollback
- **RLS:** Owner + Shared User Access

---

### [14-Transactional-Email-Pattern.md](./14-Transactional-Email-Pattern.md) ⭐ NEU
**Was:** React-basierte E-Mail-Templates mit Resend  
**Wann:** Welcome-Emails, Notifications, Löschbestätigungen  
**Enthält:**
- **@react-email/components:** Moderne E-Mail-Templates
- **Mehrsprachigkeit:** DE/EN Support in Templates
- **Resend Integration:** Edge Function Pattern
- **Template-Typen:** Welcome, Share, Deletion, Changelog
- **Inline Styles:** E-Mail-Client-kompatibel

---

### [15-i18n-Pattern.md](./15-i18n-Pattern.md) ⭐ NEU
**Was:** Lightweight Internationalisierung ohne react-i18next  
**Wann:** Apps mit 2-3 Sprachen, volle Kontrolle  
**Enthält:**
- **LanguageContext:** localStorage-Persistenz
- **TypeScript-Objects:** Typisierte Translations
- **Dynamische Strings:** Funktionen mit Parametern
- **Trennung:** Public vs. Protected Translations
- **Browser-Detection:** Initial-Sprache aus Navigator

---

### [16-Trial-and-Limits-Pattern.md](./16-Trial-and-Limits-Pattern.md) ⭐ NEU
**Was:** Trial-Countdown, AI-Usage-Limits, Token-Budget UI  
**Wann:** Freemium mit zeitlich begrenzten Trials  
**Enthält:**
- **SubscriptionContext:** Plan-Detection, Limits
- **TrialCountdown:** Compact + Full-Card Varianten
- **PromptLimitWarning:** Max-Prompts-Warnung
- **FeatureGate:** Wrapper für Feature-Gating
- **TokenUsageWidget:** Progress-Bars, Reset-Dates

---

### [17-Drag-And-Drop-Pattern.md](./17-Drag-And-Drop-Pattern.md) ⭐ NEU
**Was:** Native HTML5 Drag & Drop ohne Libraries  
**Wann:** Item-Organisation in Ordnerstrukturen  
**Enthält:**
- **Drag Source:** PromptCard mit JSON-Payload
- **Drop Target:** FolderTreeNode mit Highlight
- **Folder Reordering:** Drop Zones (above/below)
- **Custom Drag Image:** Besseres visuelles Feedback
- **Global State:** Cross-Component Drag Awareness

---

## 🎯 Anwendungshinweise für Lovable KI

### Bei neuem Projekt:
1. **User-Anforderungen analysieren** → Passende Pattern identifizieren
2. **Kombinieren:** z.B. Auth (01) + Feature-Gating (02) + Security (03)
3. **Adaptieren:** Code-Beispiele an Projekt-Kontext anpassen
4. **Erweitern:** Pattern als Basis, projektspezifische Features darauf aufbauen

### Best Practices:
- **Security First:** Immer 03-Security anwenden (RLS!)
- **Cost-Awareness:** Bei KI → 04-KI-Integration Optimierungen nutzen
- **Consistency:** Design System (06) von Anfang an einrichten
- **Scalability:** Hierarchien (05) + Realtime (07) frühzeitig planen

### Querverweis-Struktur:
- Pattern enthalten **Cross-References** zueinander
- Beispiel: `02-Subscription` → verweist auf `01-Auth` (User-ID), `03-Security` (RLS)
- Beim Implementieren: **Abhängigkeiten prüfen**

---

## 📋 Quick-Start Checkliste

**Typisches Lovable-Projekt (MVP):**
- [ ] **01-Auth:** Supabase Auth + Profiles
- [ ] **03-Security:** RLS auf alle User-Tabellen
- [ ] **06-UI-UX:** Design System + Theme
- [ ] **15-i18n:** Mehrsprachigkeit (DE/EN)
- [ ] **11-Cookie-Consent:** DSGVO-Compliance

**Erweiterte Features:**
- [ ] **05-Datenstruktur:** Hierarchien (falls benötigt)
- [ ] **08-Advanced-Sharing:** Private/Public Sharing
- [ ] **02-Subscription:** Feature-Gating
- [ ] **16-Trial-and-Limits:** Trial-UI + Limits
- [ ] **04-KI-Integration:** Smart Features
- [ ] **07-Communication:** Realtime/Chat

**PWA & Onboarding:**
- [ ] **09-PWA-Integration:** Install-Prompts
- [ ] **10-Guided-Tour:** Onboarding-Tour

**Content & Email:**
- [ ] **13-Version-History:** Versionierung
- [ ] **14-Transactional-Email:** E-Mail-Templates
- [ ] **12-Account-Deletion:** DSGVO-Löschung
- [ ] **17-Drag-And-Drop:** Item-Organisation

**Reihenfolge:**
1. Auth + Security (Fundament)
2. UI/UX + i18n + Cookie-Consent (Basis)
3. Datenstruktur + Sharing (MVP-Features)
4. Subscription + Limits + KI + Email (Erweitert)
5. PWA + Tour + DnD (Polish)

---

## 🔄 Wartung & Updates

**Neue Pattern hinzufügen:**
- Dateiname: `18-Neues-Pattern.md`
- Struktur: Overview → Architecture → Implementation → Best Practices
- Update: Dieses Dokument + Nummerierung fortsetzen

**Pattern aktualisieren:**
- Änderungen in Detail-Dokument
- Versionierung im Dokument führen (`## Changelog`)
- Bei Breaking Changes: Migration-Guide hinzufügen

---

**Version:** 2.0  
**Stand:** 2025-01-16  
**Basis:** Dokumentenablage, PromptManager, Handwerker-Marketplace
