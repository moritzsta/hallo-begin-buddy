# Software-Dokumentation: PromptManager – Stand: 16.01.2025

**Version:** 2.0.0  
**Datum:** 16.01.2025  
**Projekt:** PromptManager - KI-Prompt-Verwaltungssystem

---

## Änderungsverlauf

**Stand: 16.01.2025 - Version 2.0.0**

### Neue Features und Funktionalitäten
- **[16.01.2025]** **Smart Improve System** - Vollständig neue intelligente KI-basierte Prompt-Verbesserung mit kontextualisierten Rückfragen
- **[16.01.2025]** **Erweiterte Feature-Gating-Architektur** - Granulares Subscription-System mit vier Plänen (Free, Starter, Professional, Team)
- **[16.01.2025]** **Theme Management System** - Vollständige Light/Dark Mode Unterstützung mit persistenter Speicherung
- **[16.01.2025]** **Usage Tracking & Analytics** - Detaillierte Verfolgung der Feature-Nutzung pro Benutzer und Plan
- **[16.01.2025]** **Rating/Feedback Modal System** - Erweiterte Anzeige von KI-Bewertungen mit detaillierter Begründung
- **[16.01.2025]** **Subscription Management Page** - Vollständige Subscription-Verwaltung mit Stripe-Integration

### Backend & Edge Functions
- **[16.01.2025]** **Neue Edge Functions** - `smart-improve-questions` und `smart-improve-generate` für intelligente Prompt-Verbesserung
- **[16.01.2025]** **Erweiterte API-Sicherheit** - Server-seitige Feature-Authorization mit HTTP 403 für gesperrte Features
- **[16.01.2025]** **Rate Limiting & Cooldowns** - Implementierung von Nutzungslimits und Wartezeiten zwischen Anfragen
- **[16.01.2025]** **Enhanced Error Handling** - Strukturierte Fehlerbehandlung mit benutzerfreundlichen Meldungen

### UI/UX Verbesserungen
- **[16.01.2025]** **Design System Überarbeitung** - Vollständige HSL-basierte Farbpalette mit semantischen Tokens
- **[16.01.2025]** **Neue UI-Komponenten** - FeatureGate, PlanBadge, UpgradePrompt, UsageIndicator
- **[16.01.2025]** **Responsive Design Optimierung** - Verbesserte mobile Unterstützung und Barrierefreiheit
- **[16.01.2025]** **Enhanced User Feedback** - Cooldown-Timer, Progress-Indicators und Status-Anzeigen

### Datenbank & Architektur
- **[16.01.2025]** **Neue Tabelle `usage_tracking`** - Verfolgung der Feature-Nutzung mit Datums- und Feature-Gruppierung
- **[16.01.2025]** **Erweiterte RLS-Policies** - Verbesserte Sicherheitsrichtlinien für neue Features
- **[16.01.2025]** **Context Architecture Enhancement** - Neue Provider für Theme und erweiterte Subscription-Features

### Subscription & Business Logic
- **[16.01.2025]** **Vier-Tier Subscription Model** - Free (0€), Starter (2€), Professional (5€), Team (10€)
- **[16.01.2025]** **Granulare Feature-Kontrolle** - Spezifische Features pro Subscription-Tier
- **[16.01.2025]** **Token-basierte Limits** - Flexible Nutzungsbegrenzungen pro Plan
- **[16.01.2025]** **Stripe Integration Enhancement** - Vollständige Subscription-Lifecycle-Verwaltung

---

## 1. Einleitung & Überblick

### 1.1 Zweck & Zielgruppe

**Dokumentationszweck:** Diese Dokumentation beschreibt die vollständige Architektur, Implementierung und Funktionalität des PromptManager-Systems in der Version 2.0. Sie dient als zentrale Referenz für alle technischen und geschäftlichen Aspekte der Anwendung nach den umfangreichen Erweiterungen vom Januar 2025.

**Zielgruppe:**
- **Entwickler und technische Teams:** Vollständige technische Referenz für Wartung und Weiterentwicklung
- **Projektmanager und Stakeholder:** Überblick über erweiterte Funktionalitäten und neue Geschäftsprozesse
- **QA/Testing Teams:** Testspezifikationen für neue Features und Subscription-System
- **DevOps und Infrastruktur-Teams:** Deployment- und Infrastruktur-Konfigurationen für erweiterte Services
- **Business Development:** Verständnis der neuen Subscription-Modelle und Feature-Gating
- **Customer Success Teams:** Funktionsübersicht für Kundenbetreuung

### 1.2 Projektzusammenfassung

**Projektbeschreibung:** PromptManager ist eine webbasierte SaaS-Anwendung zur Verwaltung, Organisation und intelligenten Optimierung von KI-Prompts. Das System ermöglicht es Benutzern, ihre Prompts zu strukturieren, zu teilen, zu bewerten und durch KI-unterstützte Funktionen zu verbessern. Mit der Version 2.0 wurde ein umfassendes Subscription-System und intelligente Verbesserungsfeatures eingeführt.

**Hauptziele:**
- Zentrale Verwaltung und Organisation von KI-Prompts mit erweiterten Kategorisierungsoptionen
- Intelligente KI-basierte Prompt-Verbesserung durch kontextuelle Rückfragen
- Kollaborative Bearbeitung und Sharing-Funktionalitäten mit Berechtigungsmanagement
- Qualitätsbewertung und detailliertes Feedback-System für Prompts
- Ordnerbasierte Strukturierung mit flexibler Hierarchie und Sharing-Vererbung
- Subscription-basiertes Geschäftsmodell mit granularem Feature-Gating
- Umfassende Analytics und Usage-Tracking für Business Intelligence

**Scope (erweitert):** 
- Vollständige CRUD-Operationen für Prompts und Ordner mit Versionskontrolle
- Benutzerauthentifizierung und -verwaltung mit erweiterten Profildaten
- Mehrstufiges Sharing- und Kollaborationssystem mit Rollenmanagement
- Intelligente KI-Integration für Prompt-Analyse, -Verbesserung und -Generierung
- Vollständiges Subscription-Management mit Stripe-Integration und Customer Portal
- Responsive Web-Interface für Desktop und Mobile mit Dark/Light Mode
- Real-time Updates und Synchronisation zwischen Benutzern
- Umfassende Analytics und Reporting-Funktionen

**Zielgruppen der Software:**
- **Individual Content Creators:** Einzelpersonen, die KI-Prompts für persönliche Projekte entwickeln
- **Professionelle Teams:** Unternehmen und Agenturen mit kollaborativen Prompt-Entwicklung
- **KI-Experten und Prompt Engineers:** Spezialisierte Fachkräfte für Prompt-Optimierung
- **Bildungseinrichtungen:** Schulen und Universitäten für KI-Lehrprogramme
- **Enterprise Kunden:** Große Unternehmen mit strukturierter KI-Prompt-Verwaltung

### 1.3 Dokumentenstruktur

Diese Dokumentation folgt einem erweiterten modularen Aufbau:
- **Kapitel 1-3:** Grundlegende Architektur, neue Features und erweiterte Datenmodelle
- **Kapitel 4-6:** Technische Implementierungsdetails und API-Erweiterungen  
- **Kapitel 7-8:** Erweiterte UI/UX-Konzepte und Subscription-Management
- **Kapitel 9-11:** Anforderungen, Deployment und Business Logic
- **Kapitel 12:** Glossar und erweiterte Referenzen

**Navigationshilfen:**
- Frontend-Entwickler sollten Kapitel 2, 5, 7 und 8 priorisieren
- Backend-Entwickler konzentrieren sich auf Kapitel 2, 4, 6 und 9
- Business-Stakeholder finden relevante Informationen in Kapitel 1, 8, 9 und 11
- DevOps-Teams konzentrieren sich auf Kapitel 2, 6, 10 und 11

---

## 2. Systemarchitektur (Erweitert)

### 2.1 Architekturdiagramm (Version 2.0)

**High-Level Übersichtsdiagramm:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │  Supabase Edge  │    │   OpenAI API    │    │   Stripe API    │
│   Frontend      │◄──►│   Functions     │◄──►│   Integration   │    │   Integration   │
│   (Enhanced)    │    │   (Extended)    │    │   (GPT-4o-mini) │    │   (Complete)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │                       │
          │                       │                       │                       │
          ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │  PostgreSQL     │    │  Usage Tracking │    │  Real-time      │
│   Auth & DB     │    │   Database      │    │   Analytics     │    │  Subscriptions  │
│   (RLS Enhanced)│    │   (Extended)    │    │   Dashboard     │    │   Webhooks      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Erweiterte Komponentendiagramm:**
- **Frontend:** React 18, TypeScript, Tailwind CSS (HSL-Design-System), Tanstack Query, Theme Provider
- **Backend:** Supabase (PostgreSQL, Authentication, Edge Functions mit erweiterten Features)
- **Storage:** Supabase Storage für Datei-Uploads mit CDN-Optimierung
- **AI Services:** OpenAI GPT-4o-mini für intelligente Prompt-Verbesserung und Analyse
- **Payment:** Stripe Integration mit Customer Portal und Webhook-Handling
- **Analytics:** Usage-Tracking mit Real-time Dashboard und Business Intelligence

### 2.2 Komponentenbeschreibung (Erweitert)

**Frontend-Layer (Enhanced):**
- **Technologie-Stack:** React 18, TypeScript, Vite, Tailwind CSS mit HSL-Design-System
- **Verantwortlichkeiten:** User Interface, Advanced State Management, Client-side Validierung, Real-time Updates
- **Routing:** React Router DOM für SPA-Navigation mit geschützten Routen
- **State Management:** Tanstack Query für Server State, React Context für komplexes lokales State Management
- **Theme System:** Persistente Light/Dark Mode Unterstützung mit System-Preference Detection

**Backend-Layer (Enhanced):**
- **Server-Architektur:** Supabase Edge Functions (Deno Runtime) mit erweiterten Features
- **Services:** Authentication, Database Operations, AI Integration, Payment Processing, Usage Analytics
- **Security:** Erweiterte Row Level Security (RLS), JWT-basierte Authentifizierung, Feature-basierte Authorization
- **API Management:** Rate Limiting, Cooldown-Management, Fehlerbehandlung mit strukturiertem Logging

**Datenbank-Layer (Extended):**
- **Datenbanktyp:** PostgreSQL via Supabase mit erweiterten Features
- **Struktur:** Relationale Datenbank mit comprehensive RLS-Policies und Custom Functions
- **New Features:** Usage Tracking, Enhanced Versioning, Subscription Management
- **Performance:** Optimierte Indizierung, Query-Optimierung für komplexe Abfragen

**Integration-Layer (Enhanced):**
- **Externe Services:** OpenAI API (GPT-4o-mini), Stripe API (Complete Integration), Analytics APIs
- **Kommunikation:** REST APIs, Webhooks, Real-time Subscriptions
- **Sicherheit:** Erweiterte API-Key Management, Rate Limiting, Input Validation

**Analytics & Business Intelligence:**
- **Usage Tracking:** Detaillierte Verfolgung aller Feature-Interaktionen
- **Business Metrics:** Subscription Analytics, Feature Adoption, User Behavior
- **Real-time Reporting:** Live Dashboards für Business Intelligence

### 2.3 Neue Architektonische Entscheidungen (Version 2.0)

**Erweiterte Technologie-Choices:**
- **HSL-basiertes Design-System:** Konsistente Farbpalette mit semantischen Tokens
- **Subscription Architecture:** Modulares Feature-Gating mit granularer Kontrolle  
- **Smart AI Integration:** Kontextuelle KI-Verbesserungen mit Rückfragen-System
- **Enhanced Security:** Multi-Layer-Sicherheit mit Feature-basierter Authorization

**Neue Design Patterns:**
- **Feature Gate Pattern:** Conditional Rendering basierend auf Subscription-Level
- **Usage Tracking Pattern:** Systematische Erfassung aller Feature-Interaktionen
- **Smart Improvement Pattern:** KI-basierte Verbesserungen mit Benutzer-Feedback-Loop
- **Theme Provider Pattern:** Centralized Theme Management mit System Integration

**Erweiterte Skalierbarkeitsüberlegungen:**
- **Subscription Scaling:** Flexible Feature-Kontrolle für verschiedene Benutzergruppen
- **AI Request Management:** Effiziente Verwaltung von KI-API-Anfragen mit Caching
- **Real-time Performance:** Optimierte WebSocket-Verbindungen für Live-Updates
- **Analytics Scaling:** Effiziente Datensammlung und -verarbeitung

**Performance-Considerations (Enhanced):**
- **Intelligent Caching:** Mehrstufiges Caching für KI-Anfragen und Subscription-Daten
- **Optimistic Updates:** Erweiterte optimistische Updates für bessere UX
- **Code Splitting:** Subscription-basiertes Code Splitting für Performance
- **AI Response Optimization:** Caching und Batch-Processing für KI-Anfragen

**Erweiterte Sicherheitsarchitektur:**
- **Feature-based RLS:** Granulare Row Level Security basierend auf Subscription-Level
- **API Rate Limiting:** Intelligente Rate Limits basierend auf Benutzer-Tier
- **Enhanced Input Validation:** Multi-Layer Input Validation für KI-Integrationen
- **Audit Logging:** Umfassende Protokollierung aller sicherheitsrelevanten Aktionen

---

## 3. Daten- & Datenmodell-Design (Erweitert)

### 3.1 Erweiterte Datenbankstruktur

**Entity-Relationship-Diagramm (Version 2.0):**
```
Users (1) ─────── (n) Folders (1) ─────── (n) Prompts (1) ─────── (n) Prompt_Versions
  │                    │                       │                       │
  │                    │                       │                       │
  │              (n) Shared_Folders       (n) Shared_Prompts          │
  │                    │                       │                       │
  └────────────────────┴───────────────────────┴───────────────────────┘
  │
  │
  └─────── (1) Profiles (1) ─────── (n) Usage_Tracking
```

**Erweiterte Tabellenschemas:**

**profiles (Enhanced)**
- `id` (UUID, PK): Eindeutige Benutzer-ID (Referenz zu auth.users)
- `username` (TEXT, NULLABLE): Benutzerdefinierter Benutzername
- `full_name` (TEXT, NULLABLE): Vollständiger Name des Benutzers
- `plan_tier` (TEXT, DEFAULT 'free'): Aktueller Subscription-Plan
- `avatar_url` (TEXT, NULLABLE): URL zum Benutzer-Avatar
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt
- `updated_at` (TIMESTAMP, DEFAULT now()): Aktualisierungszeitpunkt

**folders (Enhanced)**
- `id` (UUID, PK): Eindeutige Ordner-ID
- `name` (TEXT, NOT NULL): Ordnername
- `owner_id` (UUID, NOT NULL): Besitzer-ID (Referenz zu auth.users)
- `parent_id` (UUID, NULLABLE): Übergeordneter Ordner
- `is_system` (BOOLEAN, DEFAULT false): System-Ordner Flag
- `sort_order` (INTEGER, DEFAULT 0): Sortierreihenfolge
- `depth` (INTEGER, DEFAULT 1): Hierarchie-Tiefe (Max. 3)
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt

**prompts (Enhanced)**
- `id` (UUID, PK): Eindeutige Prompt-ID
- `title` (TEXT, NOT NULL): Prompt-Titel
- `description` (TEXT, NULLABLE): Prompt-Beschreibung
- `content` (TEXT, NOT NULL): Prompt-Inhalt
- `owner_id` (UUID, NOT NULL): Besitzer-ID
- `folder_id` (UUID, NULLABLE): Zugehöriger Ordner
- `category_key` (ENUM, DEFAULT 'default'): Prompt-Kategorie
- `tags` (TEXT[], DEFAULT '{}'): Tag-Array
- `quality_score` (INTEGER, NULLABLE): KI-Qualitätsbewertung (1-100)
- `feedback` (TEXT, NULLABLE): KI-Feedback-Text
- `attached_file_url` (TEXT, NULLABLE): Dateianhang-URL
- `inherited_from_folder` (BOOLEAN, DEFAULT false): Ordner-basiertes Sharing
- `shared_with` (JSONB, DEFAULT '[]'): Legacy Sharing-Daten
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt
- `updated_at` (TIMESTAMP, DEFAULT now()): Aktualisierungszeitpunkt

**usage_tracking (Neu)**
- `id` (UUID, PK): Eindeutige Tracking-ID
- `user_id` (UUID, NOT NULL): Benutzer-Referenz
- `feature` (TEXT, NOT NULL): Feature-Name (z.B. 'improve_prompt', 'smart_improve')
- `date` (DATE, NOT NULL): Nutzungsdatum
- `count` (INTEGER, DEFAULT 1): Anzahl der Nutzungen an diesem Tag
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt
- `updated_at` (TIMESTAMP, DEFAULT now()): Aktualisierungszeitpunkt

**prompt_versions (Enhanced)**
- `id` (UUID, PK): Eindeutige Versions-ID
- `prompt_id` (UUID, NOT NULL): Prompt-Referenz
- `title` (TEXT, NOT NULL): Versions-Titel
- `description` (TEXT, NULLABLE): Versions-Beschreibung
- `content` (TEXT, NOT NULL): Versions-Inhalt
- `change_type` (TEXT, DEFAULT 'edit'): Änderungstyp ('edit', 'improve', 'create')
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt

**shared_prompts (Bestehend)**
- `prompt_id` (UUID, NOT NULL): Prompt-Referenz
- `user_id` (UUID, NOT NULL): Benutzer-Referenz  
- `role` (TEXT, DEFAULT 'editor'): Berechtigungsrolle
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt
- Primary Key: (prompt_id, user_id)

**shared_folders (Bestehend)**
- `id` (UUID, PK): Eindeutige Share-ID
- `folder_id` (UUID, NOT NULL): Ordner-Referenz
- `user_id` (UUID, NOT NULL): Benutzer-Referenz
- `role` (TEXT, DEFAULT 'editor'): Berechtigungsrolle
- `created_at` (TIMESTAMP, DEFAULT now()): Erstellungszeitpunkt

**Erweiterte Indizierungsstrategien:**
- Composite Index auf (user_id, date, feature) für Usage-Tracking-Queries
- GIN Index auf tags-Array für Tag-basierte Suchen mit erweiterten Operatoren
- Index auf (plan_tier, created_at) für Subscription Analytics
- Partial Index auf quality_score für Performance bei Bewertungsabfragen
- Index auf category_key für Kategorie-basierte Filterung

### 3.2 Erweiterte Datenmodelle & Entities

**Core Business Entities (Enhanced):**
- **User/Profile:** Erweiterte Benutzerprofile mit Subscription-Management
- **Folder:** Hierarchische Organisationsstruktur mit Sharing-Vererbung
- **Prompt:** Kern-Entity mit erweiterten Metadaten und KI-Integration
- **Share:** Erweiterte Kollaborations-Entity für granulare Berechtigungen
- **Version:** Comprehensive Versionskontrolle mit Änderungstyp-Tracking
- **Usage:** Neue Entity für detailliertes Analytics und Business Intelligence

**Neue Relationship Mappings:**
- User 1:1 Profile (Enhanced Profile Management)
- User 1:n Usage_Tracking (Analytics und Limits)
- Prompt 1:n Versions (Enhanced Versioning)
- Category m:n Prompts (Kategorisierungssystem)

**Erweiterte Enum Definitions:**
- `plan_tier`: ('free', 'starter', 'professional', 'premium')
- `share_role`: ('editor', 'viewer')
- `change_type`: ('edit', 'improve', 'create', 'description_change', 'tag_change')
- `prompt_category`: ('default', 'technik_code', 'recht_compliance', 'schreiben_redaktion', 'marketing_seo', 'daten_recherche_analyse', 'howto_rezepte_prozeduren')

### 3.3 Erweiterte Sicherheits- & Zugriffskonzepte

**Enhanced Row Level Security (RLS) Policies:**

**profiles:**
- `Users can view all profiles`: Öffentliche Profile für Sharing-Features
- `Users can update their own profile`: Selbst-Verwaltung von Profildaten
- `Users can insert their own profile`: Automatische Profilerstellung

**usage_tracking:**
- `Users can view their own usage`: auth.uid() = user_id
- `Users can insert their own usage`: auth.uid() = user_id  
- `Users can update their own usage`: auth.uid() = user_id

**folders (Enhanced):**
- `Users can view their own folders`: owner_id = auth.uid()
- `Users can view shared folders`: is_folder_shared_with_user(id, auth.uid())
- `Users can create their own folders`: owner_id = auth.uid()
- `Users can update their own folders`: owner_id = auth.uid()
- `Users can delete owned or shared folders`: Erweiterte Logik für Berechtigungen

**prompts (Enhanced):**
- `prompts_select_secure`: Zugriff für Owner, geteilte Prompts oder Ordner-basierte Shares
- `prompts_update_secure`: Schreibzugriff für Owner oder Editoren mit Feature-Gating
- `prompts_delete_secure`: Löschzugriff mit erweiterten Berechtigungsprüfungen
- `Users can create their own prompts`: owner_id = auth.uid()

**shared_prompts/shared_folders (Enhanced):**
- Erweiterte Policies mit Feature-basierter Kontrolle
- Automatische Bereinigung bei Subscription-Änderungen
- Vererbung von Folder-Sharing zu Prompt-Sharing

**Erweiterte Datenschutz und Compliance:**
- GDPR-konforme Datenverarbeitung mit Löschungsoptionen
- Audit-Logging für alle sicherheitsrelevanten Aktionen
- Verschlüsselung sensibler Daten in der Datenbank
- Retention Policies für Usage-Tracking-Daten

### 3.4 Erweiterte Datenflüsse & Performance

**Neue Kritische Datenflüsse:**
1. **Smart Improvement:** User → Questions → Answers → AI Processing → Enhanced Prompt
2. **Usage Tracking:** Feature Use → Database Update → Analytics Processing → Limit Checks
3. **Subscription Management:** Plan Change → Feature Update → Access Control Refresh
4. **Real-time Collaboration:** Edit → WebSocket → Real-time Sync → Conflict Resolution

**Erweiterte Performance-Optimierungen:**
- **Intelligent Pagination:** Cursor-basierte Pagination für große Datensätze
- **Smart Caching:** Multi-Level Caching für KI-Responses und User-Daten
- **Batch Processing:** Gruppierte Datenbankoperationen für Analytics
- **Connection Pooling:** Optimierte Datenbankverbindungen für hohe Last

**Neue Caching-Strategien:**
- **AI Response Cache:** Caching häufiger KI-Anfragen für Performance
- **Subscription Cache:** Client-side Caching von Subscription-Status
- **Usage Limit Cache:** Efficient Tracking von Nutzungslimits
- **Theme Preference Cache:** Persistente Theme-Einstellungen

**Erweiterte Backup- und Recovery-Konzepte:**
- **Incremental Backups:** Regelmäßige inkrementelle Backups aller Tabellen
- **Cross-Region Replication:** Geografische Redundanz für Disaster Recovery
- **Version Recovery:** Point-in-Time Recovery für Prompt-Versionen
- **Analytics Data Retention:** Konfigurierbare Retention für Usage-Daten

---

## 4. Schnittstellen (Interface Design) - Erweitert

### 4.1 Erweiterte API-Endpunkte

**Supabase-generierte REST API (Enhanced):**
- `GET /rest/v1/prompts`: Erweiterte Prompt-Abfrage mit Kategorie- und Tag-Filterung
- `POST /rest/v1/prompts`: Prompt-Erstellung mit automatischer Kategorisierung
- `PATCH /rest/v1/prompts?id=eq.{id}`: Prompt-Update mit Versionskontrolle
- `DELETE /rest/v1/prompts?id=eq.{id}`: Prompt-Löschung mit Cleanup
- `GET /rest/v1/usage_tracking`: Usage-Daten für Analytics Dashboard
- `POST /rest/v1/usage_tracking`: Feature-Usage-Tracking
- Ähnliche Endpunkte für profiles, folders mit erweiterten Filtern

**Erweiterte Edge Functions API:**
- `POST /functions/v1/analyze-prompt`: KI-basierte Prompt-Qualitätsanalyse
- `POST /functions/v1/improve-prompt`: Standard KI-Prompt-Verbesserung mit Feature-Gating
- `POST /functions/v1/smart-improve-questions`: Intelligente Rückfragen-Generierung (NEU)
- `POST /functions/v1/smart-improve-generate`: Kontextuelle Prompt-Verbesserung (NEU)
- `POST /functions/v1/generate-description`: Automatische Beschreibungsgenerierung
- `POST /functions/v1/create-checkout`: Stripe Checkout-Session mit Plan-Auswahl
- `POST /functions/v1/check-subscription`: Erweiterte Subscription-Status-Prüfung
- `POST /functions/v1/customer-portal`: Stripe Customer Portal Zugang
- `POST /functions/v1/cancel-subscription`: Subscription-Kündigung (NEU)

**API Versioning Strategy (Enhanced):**
- **Supabase API:** Stabile v1-Version mit erweiterten Parametern
- **Edge Functions:** Feature-basierte Versionierung mit Backward-Compatibility
- **Breaking Changes:** Graceful Migration mit Deprecation Warnings
- **API Documentation:** Automatisch generierte OpenAPI-Spezifikation

### 4.2 Erweiterte Externe Integrationen

**OpenAI API Integration (Enhanced):**
- **Endpunkt:** https://api.openai.com/v1/chat/completions
- **Modell:** gpt-4o-mini für Kosteneffizienz und Performance
- **Verwendung:** 
  - Prompt-Analyse und Bewertung (1-100 Score System)
  - Standard Prompt-Verbesserung mit direktem Feedback
  - Intelligente Rückfragen-Generierung für kontextuelle Verbesserungen
  - Kontextuelle Prompt-Optimierung basierend auf Benutzerantworten
  - Automatische Beschreibungsgenerierung
- **Rate Limiting:** Intelligente Limits basierend auf Subscription-Tier
- **Caching:** Aggressive Caching für wiederholte Anfragen
- **Error Handling:** Comprehensive Fehlerbehandlung mit Fallback-Strategien

**Stripe API Integration (Complete):**
- **Checkout Sessions:** Multi-Plan Subscription-Erstellung
- **Customer Portal:** Vollständige Subscription-Selbstverwaltung
- **Webhooks:** Real-time Payment-Event-Handling (optional)
- **Products/Prices:** Dynamisches Plan-Management
- **Subscription Management:** Upgrade/Downgrade, Pause, Kündigung
- **Invoice Management:** Automatische Rechnungsstellung und -verwaltung
- **Analytics Integration:** Revenue und Subscription-Metriken

**Configuration Management:**
- **Prompt Categories:** Externe JSON-Konfiguration für Flexibilität
- **Feature Flags:** Dynamic Feature Activation basierend auf Konfiguration
- **Plan Configuration:** Flexible Plan-Definition und Feature-Mapping

### 4.3 Erweiterte Sicherheit & Authentifizierung

**Enhanced Authentication Methods:**
- **JWT-basiert:** Supabase Auth mit automatischer Token-Erneuerung
- **Session Management:** Sichere HTTP-Only Cookies mit Extended Sessions
- **Multi-Factor Authentication:** Verfügbar über Supabase Auth (optional)
- **Social Login:** Google, GitHub, etc. über Supabase Provider

**Advanced Authorization Patterns:**
- **Feature-based Access Control:** Granulare Kontrolle basierend auf Subscription
- **Resource-based Permissions:** Owner/Editor/Viewer-Rollen mit Vererbung
- **Usage-based Limits:** Dynamic Limits basierend auf Plan und Usage History
- **Time-based Restrictions:** Cooldown-Management für API-intensive Features

**Enhanced API Security Measures:**
- **Multi-Layer API Key Management:** Sichere Speicherung mit Rotation
- **Advanced Input Validation:** Client- und Server-side mit Schema-Validation
- **SQL Injection Prevention:** Parameterisierte Queries mit zusätzlicher Sanitization
- **XSS Protection:** Content Security Policy und erweiterte Input Sanitization
- **Rate Limiting:** Adaptive Rate Limiting basierend auf Benutzerverhalten
- **Request Signing:** Optional Request Signing für kritische Operationen

### 4.4 Erweiterte Error Handling & Monitoring

**Enhanced Error Code Definitions:**
- **400 Bad Request:** Erweiterte Validierungsfehler mit detaillierter Feldvalidierung
- **401 Unauthorized:** Fehlende oder abgelaufene Authentifizierung
- **403 Forbidden:** Feature-basierte Zugriffsverweigerung mit Upgrade-Hinweisen
- **404 Not Found:** Ressource nicht gefunden oder nicht zugänglich
- **429 Too Many Requests:** Rate Limiting mit Retry-After Headers
- **500 Internal Server Error:** Server-seitige Fehler mit Correlation IDs
- **503 Service Unavailable:** Temporary Service Outages mit Status Updates

**Advanced Logging Standards:**
- **Structured Logging:** JSON-basiertes Logging mit Correlation IDs
- **Edge Functions:** Detailliertes Logging mit Performance Metrics
- **Client-side:** Enhanced Error Boundaries mit User Context
- **Database:** Query Performance Monitoring und Slow Query Detection
- **Security Logging:** Audit Trail für alle sicherheitsrelevanten Aktionen

**Comprehensive Monitoring und Alerting:**
- **Supabase Analytics:** Database Performance, Query Optimization, Connection Monitoring
- **Edge Function Metrics:** Execution Time, Success Rate, Error Rate
- **Business Metrics:** Subscription Conversion, Feature Adoption, User Retention
- **Performance Monitoring:** Core Web Vitals, API Response Times, User Experience Metrics
- **Real-time Alerting:** Slack/Email Integration für kritische System-Events

---

## 5. Komponentendesign (Erweitert)

### 5.1 Frontend-Komponenten (Enhanced)

**Page Components (Extended):**
- **PromptManager:** Haupt-Dashboard mit erweiterten Filter- und Sortierungsoptionen
- **ViewPrompt:** Detailansicht mit KI-Bewertung und Versionskontrolle
- **SmartImprove:** Neue intelligente Verbesserungs-Seite mit Rückfragen-System (NEU)
- **Subscriptions:** Vollständige Subscription-Management-Seite mit Plan-Vergleich (NEU)
- **CheckoutSuccess:** Erfolgsseite nach Subscription-Abschluss (NEU)
- **LoginPage/SignUpPage:** Authentifizierungs-Seiten mit Social Login
- **NotFound:** 404-Fehlerseite mit Navigation

**Enhanced UI Components:**
- **PromptCard:** Erweiterte Prompt-Darstellung mit Quality Score und Feature-Gating
- **FolderTreeNode:** Rekursive Ordner-Hierarchie mit Sharing-Indikatoren
- **TagSelect:** Multi-Select mit erweiterten Tag-Management-Features
- **RichTextEditor:** Rich-Text-Editor für Prompt-Inhalte mit Syntax-Highlighting
- **SearchBar:** Erweiterte Suchfunktionalität mit Kategorie- und Tag-Filtern
- **RatingFeedbackModal:** Detaillierte Anzeige von KI-Bewertungen (NEU)

**New Feature Components:**
- **FeatureGate:** Conditional Rendering basierend auf Subscription-Level (NEU)
- **DisabledFeatureButton:** Button mit Upgrade-Tooltips für gesperrte Features (NEU)
- **PlanBadge:** Anzeige des aktuellen Subscription-Plans (NEU)
- **UpgradePrompt:** Upgrade-Aufforderung für gesperrte Features (NEU)
- **UsageIndicator:** Anzeige von Feature-Nutzung und Limits (NEU)
- **CooldownTimer:** Timer für Feature-Cooldowns (NEU)

**Enhanced Layout Components:**
- **Sidebar:** Navigation mit erweiterten Ordner-Features und Plan-Anzeige
- **Header:** Benutzer-Menü mit Theme-Switcher und Subscription-Status
- **MainContent:** Zentraler Inhaltsbereich mit Responsive Design
- **ProtectedRoute:** Erweiterte Authentifizierungs-Wrapper mit Feature-Checks
- **ProfileMenu:** Erweitertes Benutzermenü mit Subscription-Links (NEU)

**Enhanced Form Components:**
- **CreatePromptDialog:** Modal mit erweiterten Kategorieoptionen
- **EditPromptDialog:** Modal mit Versionskontrolle und KI-Integration
- **SharePromptDialog:** Modal mit granularen Berechtigungsoptionen
- **ShareFolderDialog:** Modal für Ordner-Sharing mit Vererbungslogik
- **FileUploadDialog:** Modal für Datei-Uploads mit Vorschau

### 5.2 Backend-Komponenten (Enhanced)

**Enhanced Edge Functions:**
- **analyze-prompt:** Erweiterte Prompt-Analyse mit detailliertem Feedback
- **improve-prompt:** Standard Verbesserung mit Feature-Gating und Rate Limiting
- **smart-improve-questions:** KI-generierte kontextuelle Rückfragen (NEU)
- **smart-improve-generate:** Intelligente Verbesserung basierend auf Antworten (NEU)
- **generate-description:** Automatische Beschreibungsgenerierung mit Kategorie-Kontext
- **create-checkout:** Multi-Plan Stripe Checkout mit Promo-Code Support
- **check-subscription:** Comprehensive Subscription-Status mit Feature-Mapping
- **cancel-subscription:** Subscription-Kündigung mit Retention-Logic (NEU)
- **customer-portal:** Stripe Customer Portal mit Return-URL Management

**Enhanced Database Functions:**
- **share_prompt:** Erweiterte Prompt-Sharing mit Tag-Management
- **unshare_prompt:** Sharing beenden mit automatischer Kopie-Erstellung
- **duplicate_prompt:** Prompt-Duplikation mit erweiterten Metadaten
- **share_folder:** Ordner-Sharing mit rekursiver Vererbung
- **unshare_folder:** Ordner-Sharing beenden mit Cleanup
- **get_folder_descendants:** Hierarchie-Navigation mit Performance-Optimierung
- **create_default_folders_for_user:** Automatische Standard-Ordner-Erstellung
- **validate_folder_move:** Validierung von Ordner-Verschiebungen

**New Utility Functions:**
- **is_prompt_owner:** Besitzrechte-Prüfung für RLS
- **is_prompt_shared_with_user:** Sharing-Status-Prüfung
- **has_share_edit_permission:** Editor-Berechtigung-Prüfung
- **find_user_by_email:** Benutzer-Suche für Sharing-Features

### 5.3 Enhanced State Management

**Enhanced Client-side State:**
- **Authentication State:** Erweiterte Benutzer-Session mit Subscription-Daten
- **Subscription Context:** Umfassende Subscription-Verwaltung mit Feature-Gating (NEU)
- **Theme Context:** Light/Dark Mode Management mit Persistence (NEU)
- **Prompt State:** Erweiterte Prompt-Daten mit Versioning und Sharing-Info
- **Usage Tracking State:** Real-time Usage-Monitoring für UI-Feedback
- **Error State:** Comprehensive Error Management mit User-friendly Messages

**Enhanced Session Management:**
- **Extended Sessions:** Längere Session-Laufzeit für bessere UX
- **Session Renewal:** Automatische Token-Erneuerung im Hintergrund
- **Cross-tab Sync:** Session-Synchronisation zwischen Browser-Tabs
- **Offline State:** Graceful Degradation bei Verbindungsausfall

**New Custom Hooks:**
- **useSubscription:** Hook für Subscription-Status und Features (NEU)
- **useFeatureAccess:** Hook für Feature-Gating-Logic (NEU)
- **useTheme:** Hook für Theme-Management (NEU)
- **useCategoryConfig:** Hook für Kategorie-Konfiguration (NEU)
- **usePromptVersions:** Hook für Versionskontrolle
- **useRealTimeUpdates:** Hook für WebSocket-basierte Updates

### 5.4 Enhanced Component Architecture Patterns

**Feature-First Architecture:**
- **Feature Modules:** Komponenten gruppiert nach Features statt Typ
- **Feature Boundaries:** Klare Grenzen zwischen Features mit definierten Interfaces
- **Shared Components:** Wiederverwendbare UI-Komponenten in separater Library
- **Feature Flags:** Dynamic Feature Activation über Configuration

**Enhanced Composition Patterns:**
- **Higher-Order Components:** Erweiterte HOCs für Feature-Gating und Analytics
- **Render Props Pattern:** Flexible Komponenten für komplexe UI-Logic
- **Compound Component Pattern:** Zusammengesetzte Komponenten für konsistente UX
- **Provider Pattern:** Hierarchische State-Provider für Feature-Isolation

**Performance Optimization Patterns:**
- **React.memo:** Selective Re-rendering für Performance-kritische Komponenten
- **useMemo/useCallback:** Optimierte Hook-Usage für teure Berechnungen
- **Code Splitting:** Feature-basiertes Code Splitting für schnellere Ladezeiten
- **Virtual Scrolling:** Effiziente Darstellung großer Listen

---

## 6. User Interface (UI/UX Design) - Erweitert

### 6.1 Erweiterte Design-System

**Enhanced HSL Color Palette:**
```css
/* Light Mode */
--primary: 222.2 47.4% 11.2%;           /* Deep Blue */
--primary-foreground: 0 0% 100%;        /* White */
--secondary: 210 40% 96.1%;             /* Light Gray */
--secondary-foreground: 222.2 47.4% 11.2%; /* Deep Blue */
--muted: 210 40% 96.1%;                 /* Muted Gray */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted Text */
--accent: 210 40% 96.1%;                /* Accent Gray */
--destructive: 0 84.2% 60.2%;           /* Red */
--border: 214.3 31.8% 91.4%;            /* Border Gray */

/* Dark Mode */
--primary: 210 40% 98%;                 /* Light */
--primary-foreground: 222.2 47.4% 11.2%; /* Dark */
--secondary: 217.2 32.6% 17.5%;         /* Dark Gray */
--muted: 217.2 32.6% 17.5%;             /* Dark Muted */
--destructive: 0 62.8% 30.6%;           /* Dark Red */
```

**Enhanced Typography System:**
- **Font Family:** Inter, system-ui für optimale Lesbarkeit
- **Font Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Font Scales:** Modulare Skala von 0.75rem bis 3rem
- **Line Heights:** Optimierte Line Heights für verschiedene Text-Typen
- **Letter Spacing:** Fein abgestimmte Letter Spacing für bessere Lesbarkeit

**Enhanced Component Library (Shadcn/ui Extended):**
- **Form Components:** Erweiterte Input-, Select- und Textarea-Komponenten
- **Navigation Components:** Advanced Sidebar, Breadcrumbs, Pagination
- **Feedback Components:** Toast, Alert, Modal, Tooltip mit erweiterten Features
- **Data Display:** Table, Card, Badge mit responsiven Layouts
- **Layout Components:** Grid, Flex, Container mit CSS Grid Integration
- **Interactive Components:** Button, Toggle, Switch mit Accessibility Features

### 6.2 Erweiterte User Journeys

**Enhanced Authentication Flow:**
1. **Landing Page → Sign Up/Sign In → Email Verification → Profile Setup → Plan Selection → Onboarding**
2. **Social Login Integration** für schnelleren Zugang
3. **Progressive Profiling** für schrittweise Datensammlung
4. **Guided Onboarding** mit interaktiven Tutorials

**Enhanced Prompt Management Flow:**
1. **Dashboard → Create Prompt → Category Selection → Content Input → AI Analysis → Save/Share**
2. **Smart Improvement Flow:** Prompt Selection → Questions → Answers → AI Processing → Review → Save
3. **Collaboration Flow:** Folder Creation → Sharing Setup → Invitation → Real-time Collaboration
4. **Version Management:** Edit → Versioning → Comparison → Rollback Options

**New Subscription Flow:**
1. **Feature Restriction → Upgrade Prompt → Plan Comparison → Checkout → Payment → Confirmation → Feature Access**
2. **Trial Experience:** Free Trial → Usage Monitoring → Upgrade Notifications → Conversion
3. **Subscription Management:** Portal Access → Plan Changes → Billing History → Cancellation

**Enhanced Error Handling Flow:**
1. **Error Detection → User-friendly Message → Recovery Options → Support Contact**
2. **Progressive Error Recovery** mit mehreren Lösungsansätzen
3. **Error Prevention** durch proaktive Validierung
4. **Graceful Degradation** bei Service-Ausfällen

### 6.3 Enhanced Accessibility Standards (WCAG AAA)

**Enhanced Keyboard Navigation:**
- **Tab Order:** Logische Tab-Reihenfolge durch alle interaktiven Elemente
- **Keyboard Shortcuts:** Tastaturkürzel für häufige Aktionen
- **Focus Management:** Sichtbare Fokus-Indikatoren mit High Contrast
- **Escape Patterns:** Konsistente Escape-Funktionalität für Modals und Menüs

**Enhanced Screen Reader Support:**
- **Semantic HTML:** Korrekte HTML-Semantik für alle Komponenten
- **ARIA Labels:** Umfassende ARIA-Attribute für komplexe Interaktionen
- **Live Regions:** Dynamic Content Updates für Screen Reader
- **Descriptive Text:** Detailed Descriptions für komplexe UI-Elemente

**Enhanced Visual Accessibility:**
- **Color Contrast:** AAA-konforme Farbkontraste (7:1 ratio)
- **Color Independence:** Keine ausschließliche Farbkodierung für Informationen
- **Scalable Text:** Unterstützung für 200% Zoom ohne Funktionsverlust
- **Reduced Motion:** Respektierung der prefers-reduced-motion Einstellung

**Enhanced Internationalization (i18n):**
- **Multi-language Support:** Vorbereitung für mehrsprachige Unterstützung
- **RTL Support:** Right-to-Left Layout-Unterstützung
- **Cultural Adaptation:** Kulturspezifische Anpassungen für verschiedene Märkte
- **Date/Number Formats:** Lokalisierte Datums- und Zahlenformate

### 6.4 Enhanced Performance Optimizations

**Advanced Loading Strategies:**
- **Progressive Loading:** Schrittweises Laden von Inhalten basierend auf Priorität
- **Intelligent Prefetching:** Predictive Loading basierend auf Benutzerverhalten
- **Skeleton Screens:** Detaillierte Loading-Zustände für bessere UX
- **Optimistic Updates:** Sofortige UI-Updates mit Rollback-Fähigkeit

**Enhanced Bundle Optimization:**
- **Feature-based Code Splitting:** Dynamisches Laden von Subscription-Features
- **Route-based Splitting:** Lazy Loading für alle Routen
- **Component-level Splitting:** Granulares Splitting für große Komponenten
- **Tree Shaking:** Aggressive Elimination von ungenutztem Code

**Advanced Performance Monitoring:**
- **Core Web Vitals:** Continuous Monitoring von LCP, FID, CLS
- **User Experience Metrics:** Real User Monitoring (RUM)
- **Performance Budgets:** Automatische Performance-Budget-Überwachung
- **Progressive Enhancement:** Graceful Degradation für langsamere Verbindungen

---

## 7. Subscription & Feature Management (Neu)

### 7.1 Subscription-Modell

**Vier-Tier Subscription-Architektur:**

**Free Plan (0€/Monat):**
- Bis zu 10 Prompts erstellen
- 10x Beschreibung generieren pro Monat
- Grundlegende Prompt-Verwaltung
- Einzelne Prompts teilen
- Community Support

**Starter Plan (2€/Monat):**
- Unbegrenzte Prompts erstellen
- Versionskontrolle für alle Prompts
- Automatische Beschreibungsgenerierung
- Einzelne Prompts teilen
- 1.000 AI-Tokens pro Monat
- Email Support

**Professional Plan (5€/Monat):**
- Alle Starter-Features
- KI-basierte Prompt-Verbesserung
- Prompt-Analyse & Qualitätsbewertung
- Intelligente Verbesserungsvorschläge
- Detailliertes Feedback-System
- 5.000 AI-Tokens pro Monat
- Priority Support

**Team Plan (10€/Monat):**
- Alle Professional-Features
- Intelligente Prompt-Verbesserung mit Rückfragen
- Ordner-Sharing für Teams
- Kollaborative Prompt-Entwicklung
- Erweiterte Benutzerrollen
- Unbegrenzte AI-Tokens
- Dedicated Support

### 7.2 Feature-Gating Architektur

**Feature-Mapping-System:**
```typescript
const PLAN_FEATURES = {
  free: {
    improve_prompt: false,
    smart_improve: false,
    share_folders: false,
    unlimited_prompts: false,
    version_control: false,
    auto_description: { limit: 10 },
    ai_tokens: { limit: 100 }
  },
  starter: {
    improve_prompt: false,
    smart_improve: false, 
    share_folders: false,
    unlimited_prompts: true,
    version_control: true,
    auto_description: { limit: -1 },
    ai_tokens: { limit: 1000 }
  },
  professional: {
    improve_prompt: true,
    smart_improve: false,
    share_folders: false,
    unlimited_prompts: true,
    version_control: true,
    auto_description: { limit: -1 },
    ai_tokens: { limit: 5000 }
  },
  premium: {
    improve_prompt: true,
    smart_improve: true,
    share_folders: true,
    unlimited_prompts: true,
    version_control: true,
    auto_description: { limit: -1 },
    ai_tokens: { limit: -1 }
  }
};
```

**Client-side Feature-Gating:**
- **FeatureGate Component:** Conditional Rendering basierend auf Plan
- **DisabledFeatureButton:** Buttons mit Upgrade-Tooltips
- **PlanBadge:** Sichtbare Plan-Anzeige für User
- **UpgradePrompt:** Contextuelle Upgrade-Aufforderungen

**Server-side Authorization:**
- **Edge Function Guards:** Feature-Prüfung vor API-Ausführung
- **HTTP 403 Responses:** Strukturierte Fehlermeldungen für gesperrte Features
- **Usage Tracking:** Automatische Verbrauchsmessung
- **Rate Limiting:** Plan-basierte Anfrage-Limits

### 7.3 Usage Tracking & Analytics

**Feature Usage Tracking:**
```sql
-- Beispiel Usage Tracking Eintrag
INSERT INTO usage_tracking (user_id, feature, date, count) 
VALUES ('uuid', 'improve_prompt', '2025-01-16', 1)
ON CONFLICT (user_id, feature, date) 
DO UPDATE SET count = usage_tracking.count + 1;
```

**Analytics Dashboard:**
- **Feature Adoption Rates:** Prozentuale Nutzung von Features pro Plan
- **Usage Trends:** Zeitbasierte Analyse der Feature-Nutzung
- **Conversion Funnels:** Upgrade-Pfade von Free zu bezahlten Plänen
- **Churn Analysis:** Kündigungsraten und Retention-Faktoren

**Business Intelligence:**
- **Revenue per User (RPU):** Durchschnittlicher Umsatz pro Benutzer
- **Customer Lifetime Value (CLV):** Langzeit-Wert-Berechnung
- **Feature ROI:** Return on Investment für entwickelte Features
- **Market Segmentation:** Benutzer-Segmentierung nach Nutzungsverhalten

### 7.4 Subscription Lifecycle Management

**Subscription Events:**
- **Plan Upgrade:** Automatische Feature-Freischaltung
- **Plan Downgrade:** Graceful Feature-Deaktivierung mit Datenbeibehaltung
- **Subscription Cancellation:** Retention-Workflows und Data Export
- **Payment Failures:** Dunning-Management mit mehreren Retry-Versuchen

**Customer Portal Integration:**
- **Stripe Customer Portal:** Vollständige Selbstverwaltung
- **Billing History:** Detaillierte Rechnungsübersicht
- **Plan Comparison:** In-App Plan-Vergleichstabelle
- **Usage Monitoring:** Real-time Verbrauchsanzeige

---

## 8. KI-Integration & Smart Features (Erweitert)

### 8.1 Erweiterte OpenAI Integration

**Multi-Purpose AI Usage:**

**1. Prompt Analysis (analyze-prompt):**
```javascript
// Input: Prompt Text, Title, Description, Category
// Output: Quality Score (1-100), Detailed Feedback, Improvement Suggestions
{
  "prompt": "Erkläre Quantencomputing in einfachen Worten",
  "title": "Quantencomputing Erklärung",
  "category": "schreiben_redaktion"
}
// → Score: 75, Feedback: "Guter Startpunkt, könnte spezifischer sein..."
```

**2. Standard Improvement (improve-prompt):**
```javascript
// Input: Original Prompt + Context
// Output: Improved Prompt with specific enhancements
{
  "original": "Schreibe einen Artikel über KI",
  "improved": "Erstelle einen informativen Artikel über künstliche Intelligenz, der folgende Aspekte abdeckt: [1] Definition und Grundlagen, [2] Aktuelle Anwendungsbereiche, [3] Zukunftsperspektiven. Zielgruppe: Technik-interessierte Laien. Länge: 800-1200 Wörter. Ton: Sachlich aber zugänglich."
}
```

**3. Smart Improvement Questions (smart-improve-questions) - NEU:**
```javascript
// Input: Prompt + Context
// Output: Contextual Questions for Enhancement
{
  "prompt": "Schreibe einen Artikel über KI",
  "questions": [
    {
      "id": "target_audience",
      "question": "Wer ist Ihre Zielgruppe?",
      "placeholder": "z.B. Fachexperten, Laien, Studenten..."
    },
    {
      "id": "article_length",
      "question": "Welche Länge sollte der Artikel haben?",
      "placeholder": "z.B. 500 Wörter, 2-3 Seiten..."
    }
  ]
}
```

**4. Smart Improvement Generation (smart-improve-generate) - NEU:**
```javascript
// Input: Original Prompt + User Answers
// Output: Contextually Enhanced Prompt
{
  "prompt": "Schreibe einen Artikel über KI",
  "answers": {
    "target_audience": "Fachexperten",
    "article_length": "2000 Wörter",
    "focus_areas": "Ethik und Zukunftsaussichten"
  }
}
// → "Verfasse einen wissenschaftlich fundierten Artikel über künstliche Intelligenz für Fachexperten mit Schwerpunkt auf ethische Überlegungen..."
```

### 8.2 Category-Based AI Optimization

**Category-Specific Prompting:**
Jede Prompt-Kategorie erhält spezielle AI-Behandlung:

- **technik_code:** Fokus auf technische Präzision, Code-Qualität, Best Practices
- **recht_compliance:** Emphasis auf Genauigkeit, Quellenangaben, rechtliche Absicherung  
- **schreiben_redaktion:** Optimierung für Stil, Zielgruppe, Struktur
- **marketing_seo:** Keywords, Call-to-Actions, Conversion-Optimierung
- **daten_recherche_analyse:** Methodische Ansätze, Datenquellen, Validierung
- **howto_rezepte_prozeduren:** Schritt-für-Schritt-Klarheit, Vollständigkeit, Praktikabilität

### 8.3 AI Performance & Cost Optimization

**Cost Management:**
- **Model Selection:** GPT-4o-mini für optimale Cost/Performance-Ratio
- **Request Optimization:** Intelligent Prompt Engineering für kürzere Responses
- **Caching Strategy:** Aggressive Caching ähnlicher Anfragen
- **Batch Processing:** Gruppierung von AI-Requests für Effizienz

**Quality Assurance:**
- **Response Validation:** Automatische Qualitätsprüfung der AI-Antworten
- **Fallback Mechanisms:** Backup-Strategien bei AI-Service-Ausfällen
- **Human Review Loop:** Optional Human-in-the-Loop für kritische Prompts
- **Continuous Learning:** Feedback-Integration für AI-Model-Improvement

---

## 9. Requirements (Requirements/SRD) - Erweitert

### 9.1 Erweiterte Funktionale Anforderungen

**User Management (Enhanced):**
- **FR-001:** Benutzerregistrierung mit Email-Verifikation und Social Login
- **FR-002:** Profile-Management mit Avatar, Präferenzen und Subscription-Status
- **FR-003:** Password-Reset und Account-Recovery-Funktionen
- **FR-004:** Multi-Session-Management mit Cross-Device-Synchronisation
- **FR-005:** Account-Deletion mit GDPR-konformer Datenbereinigung

**Subscription Management (Neu):**
- **FR-101:** Vier-Tier Subscription-System (Free, Starter, Professional, Team)
- **FR-102:** Stripe-Integration für Payment Processing und Subscription Management
- **FR-103:** Plan Upgrades/Downgrades mit proratierter Abrechnung
- **FR-104:** Usage Tracking für alle Features mit Real-time Monitoring
- **FR-105:** Customer Portal für Subscription-Selbstverwaltung
- **FR-106:** Automated Billing und Invoice Generation

**Enhanced Prompt Management:**
- **FR-201:** Prompt-Erstellung mit erweiterten Kategorisierungsoptionen
- **FR-202:** Versionskontrolle mit automatischer Versionierung bei Änderungen
- **FR-203:** Tag-System mit Auto-Completion und Tag-Management
- **FR-204:** File-Attachment Support für Prompts mit Cloud Storage
- **FR-205:** Bulk-Operations für Prompt-Management (Export, Import, Delete)

**AI Integration (Enhanced):**
- **FR-301:** KI-basierte Prompt-Analyse mit 1-100 Scoring-System
- **FR-302:** Standard Prompt-Verbesserung mit direktem Feedback
- **FR-303:** Intelligente Prompt-Verbesserung mit kontextuellen Rückfragen (NEU)
- **FR-304:** Automatische Beschreibungsgenerierung für Prompts
- **FR-305:** Category-spezifische AI-Optimierung
- **FR-306:** AI-Response-Caching für Performance-Optimierung

**Enhanced Collaboration:**
- **FR-401:** Einzelne Prompt-Sharing mit granularen Berechtigungen
- **FR-402:** Ordner-Sharing mit rekursiver Berechtigungsvererbung
- **FR-403:** Real-time Collaboration mit Conflict Resolution
- **FR-404:** Sharing-Analytics mit Usage-Tracking
- **FR-405:** Comment-System für kollaborative Feedback (geplant)

**Advanced Analytics:**
- **FR-501:** Usage-Tracking für alle Features und Benutzer-Interaktionen
- **FR-502:** Business Intelligence Dashboard für Admin-Benutzer
- **FR-503:** Export-Funktionen für Analytics-Daten
- **FR-504:** Real-time Subscription und Usage Monitoring
- **FR-505:** Automated Reporting für Business Metrics

### 9.2 Erweiterte Non-Funktionale Anforderungen

**Performance (Enhanced):**
- **NFR-001:** Page Load Time < 2 Sekunden für alle Hauptseiten
- **NFR-002:** AI API Response Time < 5 Sekunden für Standard-Verbesserungen
- **NFR-003:** AI API Response Time < 15 Sekunden für Smart Improvements
- **NFR-004:** Database Query Response Time < 500ms für Standard-Operationen
- **NFR-005:** Real-time Updates Latency < 100ms für Kollaboration
- **NFR-006:** CDN-basierte Asset Delivery für globale Performance

**Skalierbarkeit (Enhanced):**
- **NFR-101:** Support für 10,000+ gleichzeitige Benutzer
- **NFR-102:** Horizontal Skalierung über Supabase-Infrastruktur
- **NFR-103:** AI Request Handling für 1,000+ Requests/Minute
- **NFR-104:** Database Scaling für Millionen von Prompts
- **NFR-105:** Auto-Scaling basierend auf Load Metrics

**Sicherheit (Enhanced):**
- **NFR-201:** SOC 2 Type II Compliance für Enterprise-Kunden
- **NFR-202:** GDPR-konforme Datenverarbeitung und -speicherung
- **NFR-203:** End-to-End Encryption für sensible Daten
- **NFR-204:** Multi-Factor Authentication Support
- **NFR-205:** Regular Security Audits und Penetration Testing
- **NFR-206:** API Rate Limiting mit DDoS-Protection

**Verfügbarkeit (Enhanced):**
- **NFR-301:** 99.9% Uptime SLA für Production Environment
- **NFR-302:** Disaster Recovery mit < 1 Stunde RTO
- **NFR-303:** Automated Backups mit Point-in-Time Recovery
- **NFR-304:** Cross-Region Redundancy für kritische Services
- **NFR-305:** Health Monitoring mit proaktiven Alerts

**Benutzerfreundlichkeit (Enhanced):**
- **NFR-401:** WCAG AAA Accessibility Compliance
- **NFR-402:** Mobile-First Responsive Design
- **NFR-403:** Cross-Browser Compatibility (Chrome, Firefox, Safari, Edge)
- **NFR-404:** Internationalization Support für zukünftige Märkte
- **NFR-405:** Offline Capability für Core Features (geplant)

### 9.3 Erweiterte Technische Constraints

**Technologie-Stack Constraints:**
- **TC-001:** Frontend muss React 18+ verwenden für optimale Performance
- **TC-002:** Backend muss Supabase-basiert bleiben für einheitliche Architektur
- **TC-003:** AI-Integration ausschließlich über OpenAI GPT-4o-mini für Kosteneffizienz
- **TC-004:** Payment Processing ausschließlich über Stripe für PCI Compliance
- **TC-005:** HSL-basierte Design-Tokens für konsistente Theming

**Performance Constraints:**
- **TC-101:** AI API Calls begrenzt auf max. 10 parallele Requests pro Benutzer
- **TC-102:** Database Connection Pooling mit max. 100 Connections
- **TC-103:** File Upload Limit von 10MB pro Attachment
- **TC-104:** Session Timeout nach 24 Stunden Inaktivität
- **TC-105:** Client-side Bundle Size < 2MB gzipped

**Business Constraints:**
- **TC-201:** Free Plan begrenzt auf 10 Prompts für Monetization
- **TC-202:** AI Token Limits pro Plan für Cost Management
- **TC-203:** Feature Rollout nur über Feature Flags für kontrollierte Releases
- **TC-204:** Subscription Changes nur über Stripe Customer Portal
- **TC-205:** Data Retention Policy von 7 Jahren für Compliance

### 9.4 Integration Requirements (Enhanced)

**OpenAI Integration:**
- **IR-001:** GPT-4o-mini API für alle AI-Funktionen
- **IR-002:** Fallback auf GPT-3.5-turbo bei Verfügbarkeitsproblemen
- **IR-003:** API Key Rotation alle 90 Tage
- **IR-004:** Response Caching für 24 Stunden bei identischen Anfragen
- **IR-005:** Error Handling mit graceful Degradation

**Stripe Integration:**
- **IR-101:** Complete Subscription Lifecycle Management
- **IR-102:** Webhook Integration für Real-time Payment Events
- **IR-103:** Customer Portal für Benutzer-Selbstverwaltung
- **IR-104:** Prorated Upgrades/Downgrades
- **IR-105:** Invoice Generation und Automated Billing

**Supabase Integration:**
- **IR-201:** Real-time Database Subscriptions für Live Updates
- **IR-202:** Edge Functions für serverlose Backend-Logik
- **IR-203:** Row Level Security für granulare Datensicherheit
- **IR-204:** Storage Integration für File Attachments
- **IR-205:** Authentication Integration mit Social Providers

---

## 10. Deployment & Operations (Erweitert)

### 10.1 Enhanced Deployment Pipeline

**Multi-Environment Strategy:**
```
Development → Testing → Staging → Production
     ↓           ↓         ↓         ↓
Local Dev → CI/CD → Pre-Prod → Live System
```

**Deployment Environments:**
- **Development:** Lokale Entwicklungsumgebung mit Hot Reload
- **Testing:** Automatische Test-Umgebung für CI/CD
- **Staging:** Produktionsähnliche Umgebung für Final Testing
- **Production:** Live-System mit Full Monitoring

**Enhanced CI/CD Configuration:**
```yaml
# Beispiel GitHub Actions Workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          npm ci
          npm run test:unit
          npm run test:integration
          npm run test:e2e
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Lovable
        run: lovable deploy --env production
      
      - name: Deploy Edge Functions
        run: supabase functions deploy --project-ref $PROJECT_REF
      
      - name: Run Database Migrations
        run: supabase db push --project-ref $PROJECT_REF
```

### 10.2 Infrastructure Management

**Supabase Infrastructure:**
- **Database:** PostgreSQL mit automatischen Backups
- **Authentication:** Managed Auth Service mit Social Providers
- **Storage:** Object Storage mit CDN für globale Delivery
- **Edge Functions:** Serverless Functions für AI Integration
- **Real-time:** WebSocket Subscriptions für Live Updates

**Monitoring & Observability:**
- **Application Performance Monitoring (APM):** Real User Monitoring
- **Database Monitoring:** Query Performance und Connection Metrics
- **Edge Function Monitoring:** Execution Time und Error Rates
- **Business Metrics:** Subscription Conversion und Feature Adoption
- **Security Monitoring:** Threat Detection und Audit Logging

**Backup & Recovery:**
- **Automated Backups:** Täglich um 02:00 UTC mit 30-Tage-Retention
- **Point-in-Time Recovery:** Bis zu 7 Tage zurück
- **Cross-Region Replication:** Für Disaster Recovery
- **Data Export:** Monatliche vollständige Exports für Compliance

### 10.3 Security & Compliance

**Security Measures:**
- **SSL/TLS:** End-to-End Encryption für alle Verbindungen
- **API Security:** Rate Limiting, Input Validation, Output Sanitization
- **Database Security:** Row Level Security, Encrypted at Rest
- **Secret Management:** Encrypted Storage aller API Keys und Secrets

**Compliance Framework:**
- **GDPR:** EU-Datenschutz-Grundverordnung Compliance
- **PCI DSS:** Payment Card Industry Compliance via Stripe
- **SOC 2:** System and Organization Controls (geplant)
- **ISO 27001:** Information Security Management (geplant)

**Audit & Logging:**
- **Access Logs:** Vollständige Protokollierung aller API-Zugriffe
- **Security Events:** Automated Alerting bei verdächtigen Aktivitäten
- **Change Logs:** Audit Trail für alle Systemänderungen
- **Compliance Reports:** Automated Reporting für Compliance-Teams

### 10.4 Performance Monitoring

**Key Performance Indicators (KPIs):**
- **System Performance:**
  - Response Time: P95 < 2 Sekunden
  - Throughput: > 1000 Requests/Sekunde
  - Error Rate: < 0.1%
  - Uptime: 99.9% SLA
  
- **Business Metrics:**
  - User Acquisition: Monthly Active Users (MAU)
  - Subscription Conversion: Free-to-Paid Rate
  - Feature Adoption: Usage Rate neuer Features
  - Customer Satisfaction: NPS Score > 8

**Alerting Strategy:**
- **Critical Alerts:** SMS + Email für System-Down-Situationen
- **Warning Alerts:** Email für Performance-Degradation
- **Info Alerts:** Dashboard-Updates für normale Metrics
- **Business Alerts:** Slack-Notifications für Conversion-Anomalien

---

## 11. Business Logic & Analytics (Neu)

### 11.1 Revenue Model

**Subscription Revenue Streams:**
- **Free Plan:** Lead Generation und Market Penetration
- **Starter Plan (2€/Monat):** Entry-level Revenue mit 30% Gross Margin
- **Professional Plan (5€/Monat):** Primary Revenue Driver mit 60% Gross Margin  
- **Team Plan (10€/Monat):** High-Value Customers mit 70% Gross Margin

**Revenue Optimization Strategies:**
- **Freemium Conversion:** 5% Free-to-Paid Target Conversion Rate
- **Upselling:** Feature-basierte Upgrade-Prompts bei Limit-Erreichen
- **Annual Discounts:** 20% Discount für jährliche Zahlungen
- **Enterprise Sales:** Custom Plans für große Organisationen (geplant)

### 11.2 User Behavior Analytics

**Feature Usage Metrics:**
```sql
-- Beispiel Analytics Queries
SELECT 
  feature,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(count) as avg_daily_usage
FROM usage_tracking 
WHERE date >= NOW() - INTERVAL '30 days'
GROUP BY feature;

-- Conversion Funnel Analysis
SELECT 
  p.plan_tier,
  COUNT(*) as users,
  AVG(ut.count) as avg_feature_usage
FROM profiles p
LEFT JOIN usage_tracking ut ON p.id = ut.user_id
GROUP BY p.plan_tier;
```

**Cohort Analysis:**
- **Registration Cohorts:** Benutzer-Retention nach Registrierungsmonat
- **Feature Adoption Cohorts:** Adoption-Rate neuer Features über Zeit
- **Subscription Cohorts:** Churn-Rate nach Subscription-Start
- **Value Realization Cohorts:** Time-to-Value für verschiedene User-Segmente

### 11.3 A/B Testing Framework

**Testing Infrastructure:**
- **Feature Flags:** Gradual Feature Rollouts mit Percentage-based Distribution
- **User Segmentation:** Testing basierend auf Plan, Usage, Demographics
- **Statistical Significance:** Automated Testing mit Bayesian Analysis
- **Performance Impact:** Monitoring von Performance-Impact bei Tests

**Current A/B Tests (Beispiele):**
- **Onboarding Flow:** Verschiedene Onboarding-Sequenzen für Conversion-Optimierung
- **Pricing Display:** A/B Test verschiedener Pricing-Presentations
- **Feature Prompts:** Testing verschiedener Upgrade-Prompt-Strategien
- **UI Components:** Testing verschiedener Button-Designs und Call-to-Actions

### 11.4 Customer Success Metrics

**Health Score Calculation:**
```javascript
// Customer Health Score Algorithm
const calculateHealthScore = (user) => {
  const factors = {
    loginFrequency: user.lastLogin < 7 ? 25 : 0,
    featureUsage: Math.min(user.monthlyFeatureUsage / 10, 25),
    subscriptionTier: user.planTier === 'premium' ? 25 : user.planTier === 'professional' ? 20 : 15,
    collaborationActivity: user.sharingActivity > 0 ? 25 : 0
  };
  
  return Object.values(factors).reduce((sum, score) => sum + score, 0);
};
```

**Retention Strategies:**
- **Engagement Campaigns:** Email-Sequences für inaktive Benutzer
- **Feature Education:** In-App Tutorials für underutilized Features
- **Success Coaching:** Persönliche Betreuung für High-Value Customers
- **Community Building:** User Forums und Success Stories (geplant)

---

## 12. Glossary & Extended References

### 12.1 Business Terms

**Subscription Management:**
- **MRR (Monthly Recurring Revenue):** Monatlich wiederkehrende Umsätze
- **ARR (Annual Recurring Revenue):** Jährlich wiederkehrende Umsätze  
- **ARPU (Average Revenue Per User):** Durchschnittlicher Umsatz pro Benutzer
- **LTV (Customer Lifetime Value):** Gesamtwert eines Kunden über dessen Lebenszyklus
- **CAC (Customer Acquisition Cost):** Kosten zur Kundengewinnung
- **Churn Rate:** Prozentsatz der Kunden, die den Service verlassen

**AI & Prompt Engineering:**
- **Prompt Engineering:** Kunst der optimalen Formulierung von AI-Prompts
- **Token:** Grundeinheit für AI-API-Abrechnung (etwa 0.75 Wörter)
- **Temperature:** Parameter für AI-Kreativität (0.0 = deterministisch, 1.0 = kreativ)
- **Context Window:** Maximale Anzahl von Tokens, die AI gleichzeitig verarbeiten kann
- **Fine-tuning:** Anpassung von AI-Modellen an spezifische Anwendungsfälle

### 12.2 Technical Terms

**Architecture Patterns:**
- **SaaS (Software as a Service):** Cloud-basierte Software-Bereitstellung
- **Multi-tenancy:** Einzelne Anwendungsinstanz für mehrere Kunden
- **Microservices:** Architektur mit kleinen, unabhängigen Services
- **Serverless:** Ausführung von Code ohne Server-Management
- **Edge Computing:** Datenverarbeitung nahe am Benutzer

**Development Practices:**
- **CI/CD:** Continuous Integration/Continuous Deployment
- **Infrastructure as Code (IaC):** Infrastruktur-Definition durch Code
- **GitOps:** Deployment-Automation über Git-Workflows
- **Feature Flags:** Runtime-Kontrolle über Feature-Verfügbarkeit
- **Blue-Green Deployment:** Zero-Downtime Deployment-Strategie

### 12.3 Compliance & Security

**Data Protection:**
- **GDPR:** General Data Protection Regulation (EU-Datenschutz-Grundverordnung)
- **PII (Personally Identifiable Information):** Personenbezogene Daten
- **Data Residency:** Geografische Speicherung von Daten
- **Right to be Forgotten:** Recht auf Löschung personenbezogener Daten
- **Data Portability:** Recht auf Datenübertragbarkeit

**Security Standards:**
- **SOC 2:** Service Organization Control 2 Compliance Framework
- **ISO 27001:** International Security Management Standard
- **PCI DSS:** Payment Card Industry Data Security Standard
- **OWASP:** Open Web Application Security Project Guidelines
- **Zero Trust:** Security-Modell ohne implizites Vertrauen

### 12.4 Performance & Analytics

**Web Performance:**
- **Core Web Vitals:** Google's User Experience Metrics (LCP, FID, CLS)
- **Time to Interactive (TTI):** Zeit bis zur vollständigen Interaktivität
- **First Contentful Paint (FCP):** Zeit bis zum ersten sichtbaren Content
- **Cumulative Layout Shift (CLS):** Maß für visuelle Stabilität
- **Largest Contentful Paint (LCP):** Zeit bis zum größten sichtbaren Element

**Business Intelligence:**
- **KPI (Key Performance Indicator):** Schlüsselleistungsindikator
- **Cohort Analysis:** Analyse von Benutzergruppen über Zeit
- **Funnel Analysis:** Analyse von Conversion-Schritten
- **Retention Rate:** Prozentsatz der zurückkehrenden Benutzer
- **DAU/MAU:** Daily/Monthly Active Users

---

## 13. Appendices & Configuration Examples

### 13.1 Supabase Configuration

**Database Schema (SQL Example):**
```sql
-- Enhanced profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'professional', 'premium')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    date DATE NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature, date)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
```

### 13.2 Edge Function Template

**Smart Improve Questions Function:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      throw new Error('Nicht authentifiziert')
    }

    // Check subscription and feature access
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (!hasFeature(profile?.plan_tier || 'free', 'smart_improve')) {
      return new Response(
        JSON.stringify({ 
          error: 'feature_forbidden', 
          feature: 'smart_improve', 
          required_plan: getRequiredPlan('smart_improve') 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process AI request
    const { prompt, title, description, category_key } = await req.json()
    
    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate 3-5 contextual questions to improve this prompt...'
          },
          {
            role: 'user',
            content: `Prompt: ${prompt}\nTitle: ${title}\nCategory: ${category_key}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const aiResult = await openaiResponse.json()
    const questions = JSON.parse(aiResult.choices[0].message.content)

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 13.3 Environment Configuration

**Production Environment Variables:**
```bash
# Supabase
SUPABASE_URL=https://kvxfvacuiwgbbwuzvnnf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Application
NODE_ENV=production
REACT_APP_VERSION=2.0.0
```

### 13.4 Monitoring Dashboard Configuration

**Supabase Analytics Queries:**
```sql
-- Daily Active Users
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM usage_tracking 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Feature Adoption by Plan
SELECT 
  p.plan_tier,
  ut.feature,
  COUNT(DISTINCT ut.user_id) as unique_users,
  SUM(ut.count) as total_usage
FROM profiles p
JOIN usage_tracking ut ON p.id = ut.user_id
WHERE ut.date >= NOW() - INTERVAL '7 days'
GROUP BY p.plan_tier, ut.feature;

-- Subscription Conversion Funnel
SELECT 
  plan_tier,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles
GROUP BY plan_tier
ORDER BY 
  CASE plan_tier 
    WHEN 'free' THEN 1 
    WHEN 'starter' THEN 2 
    WHEN 'professional' THEN 3 
    WHEN 'premium' THEN 4 
  END;
```

---

## Änderungsprotokoll (Change Log)

**Version 2.0.0 (16.01.2025):**
- Vollständige Neuarchitektur des Subscription-Systems
- Implementation des Smart Improvement Features
- Erweiterte KI-Integration mit OpenAI GPT-4o-mini
- Theme-Management-System mit Light/Dark Mode
- Usage-Tracking und Analytics-Framework
- Enhanced Security mit Feature-based Authorization
- Comprehensive UI/UX Overhaul mit HSL-Design-System
- Erweiterte Database-Schema mit neuen Tabellen
- Performance-Optimierungen und Caching-Strategien
- Vollständige API-Dokumentation und Testing-Framework

**Previous Version 1.0.0 (18.09.2025):**
- Initial Release mit Grundfunktionalitäten
- Basic Prompt Management und Sharing
- Simple Supabase Integration
- Standard UI-Komponenten

---

**Dokumentationsmetadata:**
- **Erstellt:** 16.01.2025
- **Letztes Update:** 16.01.2025  
- **Version:** 2.0.0
- **Reviewers:** Development Team, Product Management
- **Nächste Review:** 16.04.2025
- **Status:** Final für Version 2.0.0

---

*Ende der Software-Dokumentation: PromptManager – Version 2.0.0*