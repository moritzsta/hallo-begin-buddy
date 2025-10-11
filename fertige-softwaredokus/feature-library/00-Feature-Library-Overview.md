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
- [ ] **05-Datenstruktur:** Hierarchien (falls benötigt)
- [ ] **02-Subscription:** (Optional) Feature-Gating
- [ ] **04-KI-Integration:** (Optional) Smart Features
- [ ] **07-Communication:** (Optional) Realtime/Chat

**Reihenfolge:**
1. Auth + Security (Fundament)
2. UI/UX + Datenstruktur (MVP-Features)
3. Subscription + KI + Communication (Erweitert)

---

## 🔄 Wartung & Updates

**Neue Pattern hinzufügen:**
- Dateiname: `08-Neues-Pattern.md`
- Struktur: Overview → Architecture → Implementation → Best Practices
- Update: Dieses Dokument + `FEATURE_LIBRARY_BUILD_PLAN.md`

**Pattern aktualisieren:**
- Änderungen in Detail-Dokument
- Versionierung im Dokument führen (`## Changelog`)
- Bei Breaking Changes: Migration-Guide hinzufügen

---

**Version:** 1.0  
**Stand:** 2025-10-11  
**Basis:** Dokumentenablage, PromptManager, Handwerker-Marketplace
