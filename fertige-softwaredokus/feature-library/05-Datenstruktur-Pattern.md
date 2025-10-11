# Datenstruktur Pattern
**Kategorie:** Datenmodellierung & Architektur  
**Verwendung in:** Smarte Dokumentenablage, PromptManager, Handwerker Marketplace  
**Komplexität:** Mittel bis Hoch  
**Dependencies:** PostgreSQL, Supabase

---

## Überblick

Dieses Pattern beschreibt wiederverwendbare Datenstruktur-Muster für:
- Hierarchische Strukturen (Ordner, Kategorien)
- Sharing-Mechanismen (Links, Berechtigungen)
- Metadaten-Systeme (flexibel, erweiterbar)
- Versionierung (Historie, Rollback)
- Deduplikation (Hash-basiert)

---

## Architektur

### Komponenten-Übersicht
```
┌─────────────────────────────────────────────────────────┐
│                  Hierarchische Strukturen                │
│  (Ordner, Kategorien, Tags)                             │
└────────────────────┬────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────┐   ┌──────────┐   ┌──────────────┐
│ Sharing │   │ Metadaten│   │ Versionierung│
└─────────┘   └──────────┘   └──────────────┘
```

---

## 1. Hierarchische Ordnerstrukturen

### Use Case
- Dokumenten-Management (Dokumentenablage)
- Prompt-Organisation (PromptManager)
- Kategoriesysteme (Handwerker Marketplace)

### Datenbank-Schema

**Basis-Version (Self-Referencing):**
```sql
-- Ordner-Tabelle mit Parent-Child Beziehung
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  meta jsonb DEFAULT '{}',
  inherited_meta jsonb DEFAULT '{}', -- von Parent-Ordnern geerbt
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Index für Performance bei hierarchischen Queries
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX idx_folders_owner_id ON public.folders(owner_id);

-- Trigger für inherited_meta Update
CREATE OR REPLACE FUNCTION update_inherited_meta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_meta jsonb;
BEGIN
  -- Bei Parent-Änderung: Meta vom neuen Parent laden
  IF NEW.parent_id IS NOT NULL THEN
    SELECT COALESCE(inherited_meta, '{}'::jsonb) || COALESCE(meta, '{}'::jsonb)
    INTO parent_meta
    FROM public.folders
    WHERE id = NEW.parent_id;
    
    NEW.inherited_meta := parent_meta;
  ELSE
    NEW.inherited_meta := '{}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_folder_parent_change
  BEFORE INSERT OR UPDATE OF parent_id ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION update_inherited_meta();
```

**Erweiterte Version (mit Pfad-Cache):**
```sql
-- Materialized Path für schnellere Abfragen
ALTER TABLE public.folders ADD COLUMN path text[];

-- Funktion zur Pfad-Berechnung
CREATE OR REPLACE FUNCTION compute_folder_path(folder_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result text[];
BEGIN
  WITH RECURSIVE folder_tree AS (
    SELECT id, parent_id, name, ARRAY[name] as path
    FROM public.folders
    WHERE id = folder_id
    
    UNION ALL
    
    SELECT f.id, f.parent_id, f.name, f.name || ft.path
    FROM public.folders f
    INNER JOIN folder_tree ft ON f.id = ft.parent_id
  )
  SELECT path INTO result
  FROM folder_tree
  WHERE parent_id IS NULL;
  
  RETURN result;
END;
$$;

-- Trigger für automatische Pfad-Updates
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.path := compute_folder_path(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_folder_path_update
  BEFORE INSERT OR UPDATE OF parent_id ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_path();
```

### RLS Policies

```sql
-- RLS aktivieren
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Owner-only Zugriff
CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = owner_id);
```

### Frontend-Implementierung

**Custom Hook für Ordner-Hierarchie:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Folder {
  id: string;
  parent_id: string | null;
  name: string;
  meta: Record<string, any>;
  children?: Folder[];
}

export const useFolders = () => {
  const queryClient = useQueryClient();

  // Alle Ordner laden
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Hierarchie aufbauen
  const buildTree = (items: Folder[], parentId: string | null = null): Folder[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  const tree = buildTree(folders);

  // Ordner erstellen
  const createFolder = useMutation({
    mutationFn: async (data: { name: string; parent_id?: string }) => {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });

  // Ordner verschieben
  const moveFolder = useMutation({
    mutationFn: async ({ id, parent_id }: { id: string; parent_id: string | null }) => {
      const { error } = await supabase
        .from('folders')
        .update({ parent_id })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });

  // Ordner löschen (rekursiv)
  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      // Cascade Delete wird durch DB-Constraint gehandhabt
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });

  return {
    folders,
    tree,
    isLoading,
    createFolder: createFolder.mutate,
    moveFolder: moveFolder.mutate,
    deleteFolder: deleteFolder.mutate
  };
};
```

**Tree-Component:**
```typescript
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderTreeProps {
  folders: Folder[];
  level?: number;
  onSelect?: (folder: Folder) => void;
}

export const FolderTree = ({ folders, level = 0, onSelect }: FolderTreeProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {folders.map(folder => {
        const isExpanded = expanded.has(folder.id);
        const hasChildren = folder.children && folder.children.length > 0;

        return (
          <div key={folder.id}>
            <div
              className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => toggleExpand(folder.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-4" />
              )}
              
              <Folder className="h-4 w-4 text-muted-foreground" />
              
              <span
                className="flex-1 text-sm"
                onClick={() => onSelect?.(folder)}
              >
                {folder.name}
              </span>
            </div>

            {isExpanded && hasChildren && (
              <FolderTree
                folders={folder.children!}
                level={level + 1}
                onSelect={onSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

## 2. Sharing-Mechanismen

### Use Case
- Dokumente teilen (Dokumentenablage)
- Prompts teilen (PromptManager)
- Projekte teilen (Handwerker Marketplace)

### Datenbank-Schema

```sql
-- Basis-Schema für Share-Links
CREATE TABLE public.shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL, -- 'file', 'folder', 'prompt', etc.
  resource_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  access_count integer DEFAULT 0,
  max_access_count integer,
  password_hash text, -- optional
  permissions jsonb DEFAULT '{"read": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX idx_shared_links_token ON public.shared_links(token);
CREATE INDEX idx_shared_links_resource ON public.shared_links(resource_type, resource_id);

-- Funktion zum Token-Generieren
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- RLS Policies
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Owner kann eigene Links verwalten
CREATE POLICY "Users can manage own share links"
  ON public.shared_links
  FOR ALL
  USING (auth.uid() = owner_id);

-- Öffentlich: Nur valide Links abrufen (per Token)
CREATE POLICY "Public can view valid share links"
  ON public.shared_links
  FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > now())
    AND (max_access_count IS NULL OR access_count < max_access_count)
  );
```

### Edge Function: Share-Link erstellen

```typescript
// supabase/functions/create-share-link/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized');

    const { resource_type, resource_id, expires_in_days, max_access_count } = await req.json();

    // Ownership prüfen
    const { data: resource, error: resourceError } = await supabase
      .from(resource_type === 'file' ? 'files' : 'folders')
      .select('owner_id')
      .eq('id', resource_id)
      .single();

    if (resourceError || resource.owner_id !== user.id) {
      throw new Error('Resource not found or unauthorized');
    }

    // Share-Link erstellen
    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: shareLink, error: createError } = await supabase
      .from('shared_links')
      .insert({
        owner_id: user.id,
        resource_type,
        resource_id,
        token: crypto.randomUUID().replace(/-/g, ''),
        expires_at,
        max_access_count
      })
      .select()
      .single();

    if (createError) throw createError;

    const shareUrl = `${req.headers.get('origin')}/shared/${shareLink.token}`;

    return new Response(JSON.stringify({ url: shareUrl, token: shareLink.token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Frontend-Integration

```typescript
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useShareLink = () => {
  const createShareLink = useMutation({
    mutationFn: async ({
      resource_type,
      resource_id,
      expires_in_days
    }: {
      resource_type: string;
      resource_id: string;
      expires_in_days?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { resource_type, resource_id, expires_in_days }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Share-Link erstellt',
        description: 'Link wurde in die Zwischenablage kopiert.'
      });
      navigator.clipboard.writeText(data.url);
    }
  });

  return { createShareLink: createShareLink.mutate };
};
```

---

## 3. Metadaten-Systeme

### Use Case
- Flexible Attribute für Dokumente/Ordner
- Konfigurierbare Eigenschaften
- Schemalose Erweiterungen

### Datenbank-Schema

```sql
-- JSONB-basiertes Meta-System (bereits in folders/files)
-- Zusätzlich: Schema-Definitionen für Validierung

CREATE TABLE public.meta_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  resource_type text NOT NULL, -- 'file', 'folder', etc.
  schema jsonb NOT NULL, -- JSON Schema Definition
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(owner_id, resource_type, name)
);

-- Beispiel Schema:
/*
{
  "type": "object",
  "properties": {
    "document_type": {
      "type": "string",
      "enum": ["invoice", "contract", "report"]
    },
    "year": {
      "type": "integer",
      "minimum": 2000
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["document_type"]
}
*/

-- Validierungs-Funktion (optional)
CREATE OR REPLACE FUNCTION validate_meta_against_schema(
  p_meta jsonb,
  p_schema jsonb
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vereinfachte Validierung (für Production: pg_jsonschema Extension nutzen)
  RETURN true;
END;
$$;
```

### Frontend: Meta-Editor

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface MetaEditorProps {
  meta: Record<string, any>;
  schema?: {
    properties: Record<string, {
      type: string;
      enum?: string[];
      minimum?: number;
    }>;
    required?: string[];
  };
  onChange: (meta: Record<string, any>) => void;
}

export const MetaEditor = ({ meta, schema, onChange }: MetaEditorProps) => {
  const handleChange = (key: string, value: any) => {
    onChange({ ...meta, [key]: value });
  };

  if (!schema?.properties) {
    return (
      <div className="space-y-2">
        <Label>Freie Metadaten (JSON)</Label>
        <textarea
          className="w-full p-2 border rounded"
          value={JSON.stringify(meta, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {}
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key}>
          <Label>
            {key}
            {schema.required?.includes(key) && ' *'}
          </Label>
          
          {prop.enum ? (
            <select
              className="w-full p-2 border rounded"
              value={meta[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="">Auswählen...</option>
              {prop.enum.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          ) : prop.type === 'integer' ? (
            <Input
              type="number"
              value={meta[key] || ''}
              onChange={(e) => handleChange(key, parseInt(e.target.value))}
              min={prop.minimum}
            />
          ) : (
            <Input
              value={meta[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Versionierung

### Use Case
- Prompt-Historie (PromptManager)
- Dokument-Versionen
- Rollback-Funktionalität

### Datenbank-Schema

```sql
-- Versionierungs-Tabelle (generisch)
CREATE TABLE public.versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  version_number integer NOT NULL,
  content jsonb NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  change_summary text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(resource_type, resource_id, version_number)
);

CREATE INDEX idx_versions_resource ON public.versions(resource_type, resource_id);

-- Trigger für automatische Versionierung
CREATE OR REPLACE FUNCTION create_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_version integer;
BEGIN
  -- Letzte Versionsnummer ermitteln
  SELECT COALESCE(MAX(version_number), 0)
  INTO last_version
  FROM public.versions
  WHERE resource_type = TG_TABLE_NAME
    AND resource_id = NEW.id;
  
  -- Neue Version erstellen
  INSERT INTO public.versions (
    resource_type,
    resource_id,
    version_number,
    content,
    author_id
  )
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    last_version + 1,
    to_jsonb(NEW),
    auth.uid()
  );
  
  RETURN NEW;
END;
$$;

-- Beispiel: Versionierung für Prompts aktivieren
CREATE TRIGGER on_prompt_version
  AFTER UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION create_version();
```

### Frontend: Version-History

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export const useVersionHistory = (resourceType: string, resourceId: string) => {
  return useQuery({
    queryKey: ['versions', resourceType, resourceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const VersionHistory = ({ resourceType, resourceId, onRestore }: {
  resourceType: string;
  resourceId: string;
  onRestore: (version: any) => void;
}) => {
  const { data: versions, isLoading } = useVersionHistory(resourceType, resourceId);

  if (isLoading) return <div>Lade Versionen...</div>;

  return (
    <div className="space-y-2">
      {versions?.map(version => (
        <div key={version.id} className="flex items-center justify-between p-3 border rounded">
          <div>
            <div className="font-medium">Version {version.version_number}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(version.created_at), {
                addSuffix: true,
                locale: de
              })}
            </div>
            {version.change_summary && (
              <div className="text-sm">{version.change_summary}</div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore(version.content)}
          >
            Wiederherstellen
          </Button>
        </div>
      ))}
    </div>
  );
};
```

---

## 5. Deduplikation (Hash-basiert)

### Use Case
- Speicherplatz sparen (Dokumentenablage)
- Duplikate erkennen
- Referenzzähler

### Datenbank-Schema

```sql
-- Bereits in files-Tabelle: hash_sha256
-- Zusätzlich: Deduplikations-Tracking

CREATE TABLE public.file_storage (
  hash_sha256 text PRIMARY KEY,
  storage_path text NOT NULL UNIQUE,
  size bigint NOT NULL,
  reference_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Files verweisen auf file_storage
ALTER TABLE public.files ADD COLUMN storage_hash text REFERENCES public.file_storage(hash_sha256);

-- Trigger für Reference Counting
CREATE OR REPLACE FUNCTION update_reference_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.file_storage
    SET reference_count = reference_count + 1
    WHERE hash_sha256 = NEW.storage_hash;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_storage
    SET reference_count = reference_count - 1
    WHERE hash_sha256 = OLD.storage_hash;
    
    -- Auto-Cleanup bei reference_count = 0
    DELETE FROM public.file_storage
    WHERE hash_sha256 = OLD.storage_hash
      AND reference_count = 0;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_file_reference_change
  AFTER INSERT OR DELETE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_count();
```

---

## Best Practices

### Hierarchien
- **Zirkelbezüge vermeiden**: `CHECK (id != parent_id)` Constraint
- **Pfad-Caching**: Materialized Path für Performance
- **Soft-Deletes**: `deleted_at` statt `CASCADE DELETE` bei wichtigen Daten

### Sharing
- **Token-Sicherheit**: Kryptografisch sichere Tokens (32+ Bytes)
- **Expiration**: Immer Ablaufdatum setzen (Default: 7 Tage)
- **Access-Tracking**: `access_count` für Audit & Limits

### Metadaten
- **Schema-Validierung**: JSON Schema nutzen (pg_jsonschema Extension)
- **Indizierung**: GIN-Index auf JSONB für schnelle Queries
- **Versionierung**: Meta-Änderungen tracken

### Versionierung
- **Speicher-Management**: Alte Versionen nach X Monaten archivieren
- **Diff-Berechnung**: Nur Änderungen speichern (JSON Patch)
- **Permissions**: Nur Autor + Admin können Versionen löschen

---

## Checkliste für Implementierung

- [ ] Hierarchie-Schema erstellt (mit Constraints)
- [ ] RLS Policies für Owner-Isolation
- [ ] Share-Link Mechanismus implementiert
- [ ] Meta-Schema definiert (optional)
- [ ] Versionierungs-Trigger aktiviert (optional)
- [ ] Deduplikations-Logic implementiert (optional)
- [ ] Frontend-Hooks erstellt
- [ ] Tree-Component implementiert
- [ ] Error-Handling für Zirkelbezüge
- [ ] Performance-Tests (große Hierarchien)

---

## Häufige Fehler & Lösungen

**Problem:** Zirkelbezüge in Hierarchie  
**Lösung:** CHECK Constraint + Frontend-Validierung vor Update

**Problem:** Performance bei tiefen Hierarchien  
**Lösung:** Materialized Path oder Closure Table Pattern

**Problem:** Share-Links expiren zu früh  
**Lösung:** `expires_at` auf NULL setzen für permanente Links

**Problem:** JSONB-Queries langsam  
**Lösung:** GIN-Index erstellen: `CREATE INDEX idx_meta ON files USING GIN(meta);`

---

## Querverweise
- → `03-Security-Pattern.md` (RLS für Sharing)
- → `06-File-Management-Pattern.md` (Deduplikation Details)
- → `07-UI-UX-Pattern.md` (Tree Component Styling)
