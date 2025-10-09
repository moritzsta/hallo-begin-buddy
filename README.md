# 📁 Smart Document Storage (MVP)

> Intelligente B2C Cloud-Dokumentenverwaltung mit KI-gestütztem Smart Upload

Ein modernes Cloud-Dokumentenmanagementsystem mit automatischer Metadatenextraktion, intelligenter Ordnerablage und umfassender Sicherheit durch Row Level Security (RLS).

---

## 🎯 Features

### ✨ Core Features
- 🤖 **Smart Upload**: Automatische Metadatenextraktion via OCR + OpenAI
- 📂 **Hierarchische Ordnerstruktur** (max. 3 Ebenen)
- 🔍 **Erweiterte Suche & Filter** (Titel, Tags, Dateityp, Datum, Größe)
- 🏷️ **Manuelles Tag-System** mit Auto-Suggest
- 👁️ **"Neue Dateien"-Badges** mit Last-Seen-Tracking
- 📄 **Office-Preview** (DOCX/XLSX/PPTX → PDF/PNG Konvertierung)
- 🔐 **Owner-Only Isolation** via Supabase RLS
- 💳 **Stripe-Integration** für Subscriptions (Free/Basic/Plus/Max)

### 🎨 UI/UX
- 🌍 **Mehrsprachig** (Deutsch/Englisch)
- 🌓 **3 Themes**: Light / Dark / Colorful (WCAG AA konform)
- 🎭 **Framer Motion Animationen** mit `prefers-reduced-motion` Support
- 📱 **Responsive Design** (Desktop/Tablet/Mobile)
- ♿ **Accessibility-First** (Keyboard Navigation, ARIA Labels)

### 🔒 Security
- 🛡️ **Row Level Security (RLS)** auf allen Tabellen
- 🔑 **Signierte URLs** für Downloads & Previews (5 Min Ablaufzeit)
- 🚫 **Keine öffentlichen Storage-Buckets**
- 🔐 **Server-Side Plan-Gating** in Edge Functions
- 📊 **Audit Logging** für kritische Aktionen

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ oder Bun
- Lovable Cloud Account (oder Supabase Project)
- Stripe Account (für Subscriptions)
- OpenAI API Key (für Smart Upload)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd smart-document-storage

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

Die App läuft auf `http://localhost:8080`

---

## 📋 Project Structure

```
smart-document-storage/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication Components
│   │   ├── documents/      # File Management UI
│   │   ├── folders/        # Folder Tree & CRUD
│   │   ├── plans/          # Feature Gating & Plan UI
│   │   ├── upload/         # Upload & Smart Upload
│   │   └── ui/             # shadcn/ui Components
│   ├── contexts/           # React Contexts (Auth, Theme)
│   ├── hooks/              # Custom React Hooks
│   ├── i18n/               # Translations (DE/EN)
│   ├── lib/                # Utilities & Config
│   ├── pages/              # Route Pages
│   └── integrations/       # Supabase Client
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── smart-upload/   # OCR + OpenAI Pipeline
│   │   ├── generate-preview/ # Office → PDF/PNG
│   │   ├── generate-signed-url/ # Secure Downloads
│   │   └── check-subscription/ # Plan Validation
│   └── migrations/         # Database Migrations
├── tests/
│   ├── e2e/                # Playwright E2E Tests
│   ├── unit/               # Vitest Unit Tests
│   └── fixtures/           # Test Files
├── playwright.config.ts    # Playwright Config
├── vitest.config.ts        # Vitest Config
└── README.md
```

---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
```sql
- id (uuid, pk)
- plan_tier (text) -- 'free' | 'basic' | 'plus' | 'max'
- locale (text) -- 'de' | 'en'
- theme (text) -- 'light' | 'dark' | 'colorful'
- last_seen_at (timestamp) -- For "new files" badges
```

#### `folders`
```sql
- id (uuid, pk)
- owner_id (uuid, fk → auth.users)
- parent_id (uuid, nullable, self-fk)
- name (text)
- meta (jsonb) -- Custom metadata
- inherited_meta (jsonb) -- Inherited from parent
```

#### `files`
```sql
- id (uuid, pk)
- owner_id (uuid, fk → auth.users)
- folder_id (uuid, fk → folders)
- storage_path (text) -- Path in Supabase Storage
- mime (text)
- size (bigint) -- Bytes
- hash_sha256 (text) -- For duplicate detection
- title (text)
- meta (jsonb) -- doc_type, date, party, amount
- tags (text[]) -- Manual tags
- preview_state (text) -- 'queued' | 'processing' | 'ready' | 'failed'
```

#### `usage_tracking`
```sql
- id (bigserial, pk)
- user_id (uuid, fk → auth.users)
- feature (text) -- 'smart_upload'
- date (date)
- count (int)
```

### RLS Policies
Alle Tabellen verwenden **Owner-Only** RLS:
```sql
-- Beispiel für files-Tabelle
CREATE POLICY "Users can only access own files"
  ON files FOR ALL
  USING (auth.uid() = owner_id);
```

---

## 🔧 Configuration

### Environment Variables

Lovable Cloud verwaltet die Umgebungsvariablen automatisch. Bei manueller Konfiguration:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Secrets (Edge Functions)

Secrets werden via Lovable Cloud Secrets Management verwaltet:
- `OPENAI_API_KEY` – Für Smart Upload (Metadatenextraktion)
- `STRIPE_SECRET_KEY` – Für Subscription Management
- `STRIPE_WEBHOOK_SECRET` – Für Webhook Verification

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

**Test Coverage:**
- ✅ Authentication Flow (Signup/Login/Logout)
- ✅ Owner Isolation (RLS Security)
- ✅ File Upload & Duplicate Detection
- ✅ Feature Gating (Plan Limitations)

### Unit Tests (Vitest)

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode
npm run test:unit:watch
```

**Test Coverage:**
- ✅ Plan Configuration & Feature Access
- ✅ Utility Functions
- ✅ Schema Validation

---

## 📦 Deployment

### Lovable Cloud (Automatic)

1. **Deploy via Lovable UI**:
   - Click "Publish" Button
   - Lovable handles Edge Functions + Database Migrations automatisch

2. **Custom Domain**:
   - Gehe zu Project Settings → Domains
   - Füge Custom Domain hinzu (Paid Plan erforderlich)

### Manual Deployment (Supabase + Vercel/Netlify)

#### 1. Database Setup
```bash
# Push migrations to Supabase
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

#### 2. Deploy Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy smart-upload
```

#### 3. Deploy Frontend

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod
```

---

## 🔑 Stripe Setup

### 1. Produkte erstellen

In Stripe Dashboard → Products:
- **Basic**: 3,99 € / Monat
- **Plus**: 7,99 € / Monat
- **Max**: 12,99 € / Monat

### 2. Webhook konfigurieren

1. Erstelle Webhook-Endpoint in Stripe Dashboard
2. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Kopiere Webhook-Secret → Supabase Secrets (`STRIPE_WEBHOOK_SECRET`)

### 3. Price IDs hinzufügen

In `src/lib/plans.ts` aktualisieren:
```typescript
export const PLAN_STRIPE_PRICE_IDS = {
  basic: 'price_xxx',
  plus: 'price_yyy',
  max: 'price_zzz',
};
```

---

## 🎨 Design System

### Themes

Das Projekt verwendet HSL-basierte Design-Tokens in `src/index.css`:

```css
:root {
  --primary: 220 90% 56%;
  --secondary: 280 60% 50%;
  --accent: 340 82% 52%;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
  
  /* Shadows */
  --shadow-elegant: 0 10px 30px -10px hsl(var(--primary) / 0.3);
}
```

### Animations

Animationen via `src/lib/animations.ts`:
```typescript
import { fadeInUp, staggerContainer } from '@/lib/animations';

<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🔐 Security Best Practices

### ✅ Implemented
- ✅ Row Level Security (RLS) auf allen Tabellen
- ✅ Signierte URLs (5 Min TTL) für Downloads/Previews
- ✅ Server-Side Plan-Gating in Edge Functions
- ✅ SHA-256 Hash für Duplikat-Erkennung
- ✅ Input Validation (Zod Schemas)
- ✅ CORS-Configuration in Edge Functions
- ✅ Audit Logging für kritische Aktionen

### 🚨 Important
- Keine direkten Storage-Bucket-Zugriffe im Client
- Alle File-Downloads via `generate-signed-url` Edge Function
- Plan-Limits MÜSSEN server-seitig geprüft werden
- Keine PII in Logs

---

## 📊 Admin Dashboard

Admin-Zugriff via `user_roles` Tabelle:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

Dashboard-Features:
- 📈 Smart Uploads Trend (30 Tage)
- 💾 Storage-Nutzung pro User (Top 10)
- 📊 Plan-Verteilung (Pie Chart)
- ⚠️ Warnungen bei Limits (Storage > 10 GB)

URL: `/admin`

---

## 🐛 Troubleshooting

### Problem: RLS-Fehler beim Upload
**Lösung**: Stelle sicher, dass `owner_id` korrekt gesetzt wird:
```typescript
const { data, error } = await supabase
  .from('files')
  .insert({ ...file, owner_id: user.id });
```

### Problem: Signierte URLs laufen zu schnell ab
**Lösung**: Erhöhe TTL in `generate-signed-url`:
```typescript
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(path, 300); // 300 Sekunden = 5 Min
```

### Problem: Smart Upload zu langsam
**Optimierungen**:
- OCR nur Seite 1 (bereits implementiert)
- OpenAI-Prompts kompakt halten (<200 Tokens)
- Caching für wiederkehrende Layouts
- Rate-Limiting (5 Sek Cooldown)

### Problem: Theme wechselt nicht
**Lösung**: 
1. Prüfe `profiles.theme` Wert in DB
2. Verifiziere `ThemeContext` Integration
3. Checke CSS HSL-Variablen in `index.css`

---

## 🤝 Contributing

### Development Workflow

1. **Feature Branch erstellen**:
   ```bash
   git checkout -b feature/neue-funktion
   ```

2. **Lokale Tests durchführen**:
   ```bash
   npm run test:unit
   npm run test:e2e
   ```

3. **Commit mit Conventional Commits**:
   ```bash
   git commit -m "feat: neue Funktion hinzugefügt"
   ```

4. **Pull Request erstellen** mit:
   - Beschreibung der Änderungen
   - Screenshots (bei UI-Änderungen)
   - Test-Coverage
   - Breaking Changes (falls vorhanden)

### Code Style
- **TypeScript**: Strict Mode aktiviert
- **ESLint**: `npm run lint`
- **Prettier**: Auto-Format on Save
- **Commits**: Conventional Commits (feat/fix/docs/test)

---

## 📚 Documentation

### Weitere Dokumente
- [`BUILD_PROMPTS.md`](./BUILD_PROMPTS.md) – Sequenzielle Build-Tasks
- [`PROGRESS_LOG.md`](./PROGRESS_LOG.md) – Entwicklungsfortschritt
- [`Smarte Dokumentenablage – Softwaredokumentation (MVP).md`](./Smarte%20Dokumentenablage%20–%20Softwaredokumentation%20(MVP).md) – Vollständige Spezifikation

### API-Dokumentation

#### Edge Functions

**`smart-upload`**
```typescript
POST /functions/v1/smart-upload
Body: { fileId: string }
Returns: { metadata, suggestedPath, newFolders, isDuplicate }
```

**`generate-signed-url`**
```typescript
POST /functions/v1/generate-signed-url
Body: { fileId: string, bucket: 'documents' | 'previews' }
Returns: { url: string, expiresAt: number }
```

**`generate-preview`**
```typescript
POST /functions/v1/generate-preview
Body: { fileId: string }
Returns: { state: 'ready' | 'failed', previewPath?: string }
```

---

## 📈 Roadmap (MVP+1)

### Geplante Features
- 🔗 **Sharing**: Read-Only-Links (Passwort, Ablaufdatum)
- 🏷️ **Massentagging**: Tags für mehrere Dateien gleichzeitig
- 🔍 **Volltext-OCR-Suche**: Suche im Datei-Inhalt (nicht nur Metadaten)
- 🔄 **Reorganisations-Assistent**: Bestandsdateien nach neuem Schema verschieben
- ⚙️ **Regel-Editor**: IF-THIS-THEN-PLACE (z.B. "Wenn Absender = X → Ordner Y")
- 📱 **Mobile-App**: React Native oder PWA

---

## 📄 License

MIT License – siehe [LICENSE](./LICENSE)

---

## 🙏 Credits

### Technologies
- ⚛️ **React 18** + TypeScript
- 🎨 **Tailwind CSS** + **shadcn/ui**
- 🗄️ **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
- 🎭 **Framer Motion** für Animationen
- 💳 **Stripe** für Subscriptions
- 🤖 **OpenAI** für Metadatenextraktion
- 🧪 **Playwright** + **Vitest** für Testing

### Entwickelt mit
- 💜 **Lovable AI** – AI-powered Development Platform
- 🚀 **Vite** – Lightning-fast Build Tool

---

## 📞 Support

- 📧 Email: support@your-domain.com
- 💬 Discord: [Community-Link]
- 📚 Docs: [docs.your-domain.com]

---

**Made with 💙 by the Smart Document Storage Team**
