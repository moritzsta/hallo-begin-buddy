# Security Pattern
**Kategorie:** Sicherheit & Datensch utz  
**Verwendung in:** Alle Projekte (Dokumentenablage, PromptManager, Marketplace)  
**Komplexität:** Mittel-Hoch  
**Dependencies:** Supabase RLS, PostgreSQL

---

## Überblick

Dieses Pattern beschreibt Best Practices für Sicherheit in Supabase-basierten Anwendungen:
- Row Level Security (RLS) Policies
- Owner-Isolation (Multi-Tenancy)
- JWT-basierte Authentifizierung
- Secure Functions (SECURITY DEFINER)
- Audit Logging
- API Security

---

## Kernprinzipien

### 1. Owner-Isolation by Default
**Regel:** Jeder Benutzer sieht nur seine eigenen Daten.

**Standard RLS Pattern:**
```sql
-- IMMER für private Tabellen
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT: Nur eigene Daten
CREATE POLICY "Users can view own records"
  ON table_name FOR SELECT
  USING (auth.uid() = owner_id);

-- INSERT: Nur eigene owner_id
CREATE POLICY "Users can insert own records"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Nur eigene Daten
CREATE POLICY "Users can update own records"
  ON table_name FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Nur eigene Daten
CREATE POLICY "Users can delete own records"
  ON table_name FOR DELETE
  USING (auth.uid() = owner_id);
```

### 2. Public Read, Private Write
**Regel:** Öffentliche Daten lesbar, aber nur Owner kann ändern.

**Anwendungsfall:** Profile, Projekte, Bewertungen

```sql
-- Public Read
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (true);

-- Owner Write
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Shared Access mit Rollen
**Regel:** Granulare Berechtigungen für geteilte Ressourcen.

**Anwendungsfall:** Shared Prompts, Shared Folders

```sql
-- Owner Access
CREATE POLICY "Owners can access shared prompts"
  ON prompts FOR SELECT
  USING (owner_id = auth.uid());

-- Shared Access
CREATE POLICY "Shared users can access prompts"
  ON prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_prompts
      WHERE prompt_id = prompts.id
        AND user_id = auth.uid()
    )
  );

-- Role-based Write
CREATE POLICY "Editors can update shared prompts"
  ON prompts FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_prompts
      WHERE prompt_id = prompts.id
        AND user_id = auth.uid()
        AND role = 'editor'
    )
  );
```

---

## Implementierung

### 1. Standard-RLS für Basis-Tabellen

**profiles:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public profiles (optional)
CREATE POLICY "Public profiles viewable"
  ON profiles FOR SELECT
  USING (true);
```

**folders:**
```sql
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = owner_id);
```

**files/documents:**
```sql
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    folder_id IN (
      SELECT id FROM folders WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (auth.uid() = owner_id);
```

### 2. Shared Resource Patterns

**shared_prompts (Many-to-Many):**
```sql
CREATE TABLE shared_prompts (
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer', -- 'viewer' | 'editor'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (prompt_id, user_id)
);

ALTER TABLE shared_prompts ENABLE ROW LEVEL SECURITY;

-- View shares where user is recipient
CREATE POLICY "Users can view shares to them"
  ON shared_prompts FOR SELECT
  USING (user_id = auth.uid());

-- Prompt owners can manage shares
CREATE POLICY "Owners can manage prompt shares"
  ON shared_prompts FOR ALL
  USING (
    prompt_id IN (
      SELECT id FROM prompts WHERE owner_id = auth.uid()
    )
  );
```

**Folder Inheritance (Shared Folders → Prompts):**
```sql
-- Prompts inherit folder sharing
CREATE POLICY "Users can view folder-shared prompts"
  ON prompts FOR SELECT
  USING (
    owner_id = auth.uid() OR
    -- Direct share
    EXISTS (
      SELECT 1 FROM shared_prompts
      WHERE prompt_id = prompts.id AND user_id = auth.uid()
    ) OR
    -- Folder share
    EXISTS (
      SELECT 1 FROM shared_folders sf
      WHERE sf.folder_id = prompts.folder_id
        AND sf.user_id = auth.uid()
    )
  );
```

### 3. Admin-Rollen mit Security Definer

**Problem:** RLS kann zu Rekursion führen bei Selbst-Referenzen.

**Lösung:** Security Definer Functions für Rollen-Checks.

```sql
-- Enum für Rollen
CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- Rollen-Tabelle
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security Definer Function (umgeht RLS!)
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Policies mit Function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

### 4. Audit Logging

```sql
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  entity text NOT NULL, -- 'prompt', 'folder', 'file', etc.
  entity_id uuid,
  action text NOT NULL, -- 'create', 'update', 'delete', 'share'
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all audit logs"
  ON audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System only can insert (via trigger/function)
CREATE POLICY "System only can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (false);

-- Prevent deletion
CREATE POLICY "Prevent audit log deletion"
  ON audit_log FOR DELETE
  USING (false);

-- Trigger für automatisches Logging
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, entity, entity_id, action, details)
    VALUES (auth.uid(), 'prompt', OLD.id, 'delete', 
            jsonb_build_object('title', OLD.title));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, entity, entity_id, action, details)
    VALUES (auth.uid(), 'prompt', NEW.id, 'update',
            jsonb_build_object('old_title', OLD.title, 'new_title', NEW.title));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, entity, entity_id, action, details)
    VALUES (auth.uid(), 'prompt', NEW.id, 'create',
            jsonb_build_object('title', NEW.title));
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER prompt_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION log_prompt_changes();
```

### 5. Signed URLs für Storage

**Problem:** Storage-Dateien sollen nicht öffentlich sein.

**Lösung:** Kurzlebige signierte URLs via Edge Function.

```typescript
// Edge Function: generate-signed-url
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, expiresIn = 3600 } = await req.json();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Verify file ownership
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, owner_id, storage_path')
      .eq('id', fileId)
      .single();

    if (fileError || !file) throw new Error('File not found');
    if (file.owner_id !== user.id) throw new Error('Access denied');

    // Generate signed URL
    const { data: signedData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, expiresIn);

    if (urlError) throw urlError;

    return new Response(
      JSON.stringify({ 
        url: signedData.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## Best Practices

### RLS Design
- **Default Deny:** RLS aktivieren, dann explizit erlauben
- **Owner-First:** Immer `owner_id = auth.uid()` prüfen
- **Vermeidung von Rekursion:** `SECURITY DEFINER` Functions für Rollen
- **Performance:** Indizes auf `owner_id`, `user_id`

### Security Definer Functions
- **IMMER** `SET search_path = public` setzen
- **Minimal Privileges:** Nur nötige Operationen
- **Audit:** Alle SECURITY DEFINER Functions loggen

### Storage Security
- **Private Buckets:** Niemals public für sensible Daten
- **Signed URLs:** Kurzlebig (1h-24h max)
- **Auth-Check:** Immer vor URL-Generierung

### API Security
- **JWT Validation:** In allen Edge Functions
- **Rate Limiting:** Auf Feature-Level
- **Input Validation:** Zod Schemas verwenden

### Audit Logging
- **Automatisch:** Via Triggers für kritische Tabellen
- **Immutable:** Keine Updates/Deletes erlauben
- **Retention:** Alte Logs archivieren

---

## Häufige Fehler & Lösungen

**Problem:** "Infinite recursion detected in policy"  
**Ursache:** RLS Policy referenziert eigene Tabelle  
**Lösung:** `SECURITY DEFINER` Function verwenden

**Problem:** "new row violates row-level security policy"  
**Ursache:** `owner_id` nicht gesetzt oder falsch  
**Lösung:** `WITH CHECK (auth.uid() = owner_id)` in INSERT Policy

**Problem:** Gastbenutzer können nicht zugreifen  
**Ursache:** RLS blockiert anonymous users  
**Lösung:** Separate Policy `FOR ... TO anon USING (...)` oder Custom Token

**Problem:** Admin kann nicht auf alles zugreifen  
**Ursache:** Admin-Check in RLS Policy führt zu Rekursion  
**Lösung:** `has_role()` SECURITY DEFINER Function

---

## Security Checkliste

- [ ] RLS auf allen Tabellen aktiviert
- [ ] Owner-Isolation Policies implementiert
- [ ] Shared-Resource Policies getestet
- [ ] Admin-Rollen via SECURITY DEFINER
- [ ] Audit Logging für kritische Aktionen
- [ ] Storage mit Signed URLs gesichert
- [ ] Edge Functions validieren JWT
- [ ] Input Validation mit Zod
- [ ] Rate Limiting implementiert
- [ ] SECURITY DEFINER Functions haben `SET search_path`
- [ ] Keine sensiblen Daten in Logs
- [ ] Cross-Tenant Tests durchgeführt

---

## Test-Szenarien

### Cross-Tenant Isolation Test
```typescript
// User A erstellt Prompt
const { data: promptA } = await supabaseUserA
  .from('prompts')
  .insert({ title: 'Test', content: 'Secret' })
  .select()
  .single();

// User B versucht zuzugreifen (sollte fehlschlagen)
const { data: promptB, error } = await supabaseUserB
  .from('prompts')
  .select('*')
  .eq('id', promptA.id)
  .single();

expect(error).toBeTruthy(); // Should be blocked by RLS
expect(promptB).toBeNull();
```

### Shared Access Test
```typescript
// Owner shared Prompt mit User B
await supabaseOwner
  .from('shared_prompts')
  .insert({ prompt_id: promptId, user_id: userB.id, role: 'editor' });

// User B kann jetzt zugreifen
const { data, error } = await supabaseUserB
  .from('prompts')
  .select('*')
  .eq('id', promptId)
  .single();

expect(error).toBeNull();
expect(data).toBeTruthy();
```

---

## Querverweise
- → `01-Auth-Profile-Pattern.md` (Profile RLS)
- → `02-Subscription-Feature-Gating-Pattern.md` (Usage Tracking RLS)
- → `05-Datenstruktur-Pattern.md` (Shared Resources)
- → `08-File-Management-Pattern.md` (Storage Security)
