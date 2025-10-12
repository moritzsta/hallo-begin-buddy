# Advanced Sharing Pattern – Private & Public Sharing

## Übersicht

Dieses Pattern beschreibt ein umfassendes Sharing-System mit zwei verschiedenen Ansätzen:
1. **Private Sharing** – Direktes Teilen mit registrierten Nutzern (mit Berechtigungen)
2. **Public Link Sharing** – Anonymes Teilen via Token-basierte Links (ohne E-Mail-Exposure)

### Wann verwenden?
- Kollaborative Projekte mit Team-Mitgliedern (Private Sharing)
- Öffentliches Teilen von Dokumenten/Dateien ohne Registrierung (Public Link)
- Zeitlich begrenzte Zugriffe auf Ressourcen
- Kontrollierte Berechtigungsverwaltung (Viewer/Editor)

---

## 1. Private Sharing (User-basiert)

### Use Cases
- Team-Kollaboration mit definierten Rollen
- Interne Dokumentenverwaltung
- Granulare Berechtigungskontrolle
- Nachverfolgbare Zugriffe

### Datenbankschema

```sql
-- Shared Items Tabellen
CREATE TABLE public.shared_prompts (
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (prompt_id, user_id)
);

CREATE TABLE public.shared_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (folder_id, user_id)
);

-- Indizes für Performance
CREATE INDEX idx_shared_prompts_user ON public.shared_prompts(user_id);
CREATE INDEX idx_shared_prompts_prompt ON public.shared_prompts(prompt_id);
CREATE INDEX idx_shared_folders_user ON public.shared_folders(user_id);
CREATE INDEX idx_shared_folders_folder ON public.shared_folders(folder_id);
```

### RLS Policies

```sql
-- Shared Prompts Policies
ALTER TABLE public.shared_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared prompts"
  ON public.shared_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can share their prompts"
  ON public.shared_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE id = prompt_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can revoke sharing"
  ON public.shared_prompts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE id = prompt_id AND owner_id = auth.uid()
    )
  );

-- Shared Folders Policies
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared folders"
  ON public.shared_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can share their folders"
  ON public.shared_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE id = folder_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can revoke folder sharing"
  ON public.shared_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE id = folder_id AND owner_id = auth.uid()
    )
  );
```

### Database Functions

```sql
-- Funktion: Benutzer per E-Mail finden
CREATE OR REPLACE FUNCTION public.find_user_by_email(search_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    p.full_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.email = search_email
  AND au.id != auth.uid(); -- Nicht sich selbst
END;
$$;

-- Funktion: Ordner mit allen Inhalten teilen (rekursiv)
CREATE OR REPLACE FUNCTION public.share_folder_recursive(
  p_folder_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ordner selbst teilen
  INSERT INTO public.shared_folders (folder_id, user_id, role)
  VALUES (p_folder_id, p_user_id, p_role)
  ON CONFLICT (folder_id, user_id) DO UPDATE
  SET role = EXCLUDED.role;
  
  -- Alle direkten Dokumente im Ordner teilen
  INSERT INTO public.shared_prompts (prompt_id, user_id, role)
  SELECT id, p_user_id, p_role
  FROM public.prompts
  WHERE folder_id = p_folder_id
  ON CONFLICT (prompt_id, user_id) DO UPDATE
  SET role = EXCLUDED.role;
  
  -- Rekursiv für Unterordner
  PERFORM share_folder_recursive(id, p_user_id, p_role)
  FROM public.folders
  WHERE parent_id = p_folder_id;
END;
$$;
```

### Frontend Integration

```tsx
// hooks/usePrivateSharing.ts
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShareConfig {
  resourceId: string;
  resourceType: 'prompt' | 'folder';
  userEmail: string;
  role: 'viewer' | 'editor';
}

export const usePrivateSharing = () => {
  const queryClient = useQueryClient();

  // E-Mail-Suche für User Lookup
  const findUserByEmail = async (email: string) => {
    const { data, error } = await supabase.rpc('find_user_by_email', {
      search_email: email
    });
    if (error) throw error;
    return data?.[0] || null;
  };

  // Share Resource
  const shareResource = useMutation({
    mutationFn: async ({ resourceId, resourceType, userEmail, role }: ShareConfig) => {
      // 1. User finden
      const user = await findUserByEmail(userEmail);
      if (!user) throw new Error('User not found');

      // 2. Share erstellen
      const table = resourceType === 'prompt' ? 'shared_prompts' : 'shared_folders';
      const idColumn = resourceType === 'prompt' ? 'prompt_id' : 'folder_id';
      
      const { data, error } = await supabase
        .from(table)
        .insert({
          [idColumn]: resourceId,
          user_id: user.id,
          role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-resources'] });
    }
  });

  // Revoke Sharing
  const revokeSharing = useMutation({
    mutationFn: async ({ resourceId, resourceType, userId }: {
      resourceId: string;
      resourceType: 'prompt' | 'folder';
      userId: string;
    }) => {
      const table = resourceType === 'prompt' ? 'shared_prompts' : 'shared_folders';
      const idColumn = resourceType === 'prompt' ? 'prompt_id' : 'folder_id';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, resourceId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-resources'] });
    }
  });

  // Get Shared Users
  const useSharedUsers = (resourceId: string, resourceType: 'prompt' | 'folder') => {
    return useQuery({
      queryKey: ['shared-users', resourceId, resourceType],
      queryFn: async () => {
        const table = resourceType === 'prompt' ? 'shared_prompts' : 'shared_folders';
        const idColumn = resourceType === 'prompt' ? 'prompt_id' : 'folder_id';
        
        const { data, error } = await supabase
          .from(table)
          .select(`
            user_id,
            role,
            created_at,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq(idColumn, resourceId);

        if (error) throw error;
        return data;
      }
    });
  };

  return {
    shareResource,
    revokeSharing,
    useSharedUsers,
    findUserByEmail
  };
};
```

### UI Component

```tsx
// components/sharing/PrivateShareDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrivateSharing } from '@/hooks/usePrivateSharing';
import { toast } from 'sonner';

interface PrivateShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceType: 'prompt' | 'folder';
  resourceName: string;
}

export const PrivateShareDialog = ({
  open,
  onOpenChange,
  resourceId,
  resourceType,
  resourceName
}: PrivateShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const { shareResource, useSharedUsers, revokeSharing } = usePrivateSharing();
  
  const { data: sharedUsers, isLoading } = useSharedUsers(resourceId, resourceType);

  const handleShare = async () => {
    try {
      await shareResource.mutateAsync({
        resourceId,
        resourceType,
        userEmail: email,
        role
      });
      toast.success(`${resourceType === 'folder' ? 'Ordner' : 'Dokument'} erfolgreich geteilt`);
      setEmail('');
    } catch (error) {
      toast.error('Fehler beim Teilen: ' + (error as Error).message);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await revokeSharing.mutateAsync({ resourceId, resourceType, userId });
      toast.success('Zugriff widerrufen');
    } catch (error) {
      toast.error('Fehler beim Widerrufen');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {resourceName} teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Form */}
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail-Adresse eingeben"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Betrachter</SelectItem>
                <SelectItem value="editor">Bearbeiter</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} disabled={!email || shareResource.isPending}>
              Teilen
            </Button>
          </div>

          {/* Shared Users List */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Geteilt mit:</h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Lädt...</p>
            ) : sharedUsers?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch mit niemandem geteilt</p>
            ) : (
              <div className="space-y-2">
                {sharedUsers?.map((share) => (
                  <div key={share.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {share.profiles?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.profiles?.full_name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{share.role}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(share.user_id)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 2. Public Link Sharing (Token-basiert)

### Use Cases
- Öffentliches Teilen ohne Benutzerregistrierung
- Zeitlich begrenzte Zugriffe
- Externe Freigaben ohne E-Mail-Exposure
- Einfache Link-basierte Distribution

### Datenbankschema

```sql
-- Shared Links Tabelle
CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indizes
CREATE INDEX idx_shared_links_token ON public.shared_links(token);
CREATE INDEX idx_shared_links_file ON public.shared_links(file_id);
CREATE INDEX idx_shared_links_owner ON public.shared_links(owner_id);
CREATE INDEX idx_shared_links_expires ON public.shared_links(expires_at) WHERE expires_at IS NOT NULL;
```

### RLS Policies

```sql
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Öffentlicher Lesezugriff für gültige Links
CREATE POLICY "Public can view valid share links"
  ON public.shared_links FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- Nur Owner können Links erstellen
CREATE POLICY "Users can create share links for own files"
  ON public.shared_links FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.files
      WHERE id = file_id AND owner_id = auth.uid()
    )
  );

-- Nur Owner können Links löschen
CREATE POLICY "Users can delete own share links"
  ON public.shared_links FOR DELETE
  USING (auth.uid() = owner_id);

-- Owner können ihre Links sehen
CREATE POLICY "Users can view own share links"
  ON public.shared_links FOR SELECT
  USING (auth.uid() = owner_id);
```

### Edge Function: Create Share Link

```typescript
// supabase/functions/create-share-link/index.ts
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  fileId: string;
  expiresInDays?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Benutzer authentifizieren
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileId, expiresInDays }: RequestBody = await req.json();

    // Datei-Eigentümer prüfen
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, owner_id')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (file.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token generieren (kryptographisch sicher)
    const token = crypto.randomUUID();

    // Ablaufdatum berechnen
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Share Link erstellen
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('shared_links')
      .insert({
        file_id: fileId,
        owner_id: user.id,
        token,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (shareLinkError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Share URL konstruieren
    const shareUrl = `${Deno.env.get('PUBLIC_APP_URL')}/shared/${token}`;

    return new Response(
      JSON.stringify({
        token,
        shareUrl,
        expiresAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-share-link:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Edge Function: Get Shared File

```typescript
// supabase/functions/get-shared-file/index.ts
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: RequestBody = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Role für öffentlichen Zugriff
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Share Link abrufen
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('shared_links')
      .select('*')
      .eq('token', token)
      .single();

    if (shareLinkError || !shareLink) {
      return new Response(
        JSON.stringify({ error: 'Share link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ablauf prüfen
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Share link expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Datei-Details abrufen
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, title, mime, storage_path, size, created_at, preview_state')
      .eq('id', shareLink.file_id)
      .single();

    if (fileError || !file) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signierte URL generieren (5 Minuten)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 300);

    if (signedUrlError || !signedUrlData) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preview URL (wenn verfügbar)
    let previewUrl = null;
    if (file.preview_state === 'completed') {
      const previewPath = `${file.id}/preview.png`;
      const { data: previewData } = await supabase.storage
        .from('previews')
        .createSignedUrl(previewPath, 300);
      
      if (previewData) {
        previewUrl = previewData.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({
        file: {
          id: file.id,
          title: file.title,
          mime: file.mime,
          size: file.size,
          created_at: file.created_at,
        },
        signedUrl: signedUrlData.signedUrl,
        previewUrl,
        expiresAt: shareLink.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shared-file:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Frontend Integration

```tsx
// hooks/usePublicSharing.ts
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateShareLinkParams {
  fileId: string;
  expiresInDays?: number;
}

export const usePublicSharing = () => {
  const queryClient = useQueryClient();

  const createShareLink = useMutation({
    mutationFn: async ({ fileId, expiresInDays = 7 }: CreateShareLinkParams) => {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { fileId, expiresInDays }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] });
    }
  });

  const getSharedFile = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('get-shared-file', {
      body: { token }
    });

    if (error) throw error;
    return data;
  };

  return {
    createShareLink,
    getSharedFile
  };
};
```

### UI Component

```tsx
// components/sharing/PublicShareDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicSharing } from '@/hooks/usePublicSharing';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PublicShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

export const PublicShareDialog = ({
  open,
  onOpenChange,
  fileId,
  fileName
}: PublicShareDialogProps) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [copied, setCopied] = useState(false);
  const { createShareLink } = usePublicSharing();

  const handleGenerateLink = async () => {
    try {
      const data = await createShareLink.mutateAsync({
        fileId,
        expiresInDays: parseInt(expiresInDays)
      });
      setShareUrl(data.shareUrl);
      setExpiresAt(data.expiresAt);
      toast.success('Freigabe-Link erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen des Links');
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link kopiert');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Öffentlichen Link erstellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!shareUrl ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstellen Sie einen öffentlichen Link für <strong>{fileName}</strong>. 
                  Jeder mit diesem Link kann die Datei ansehen.
                </p>
                
                <div className="flex gap-2">
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Tag</SelectItem>
                      <SelectItem value="7">7 Tage</SelectItem>
                      <SelectItem value="30">30 Tage</SelectItem>
                      <SelectItem value="0">Kein Ablauf</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleGenerateLink} 
                    disabled={createShareLink.isPending}
                    className="flex-1"
                  >
                    {createShareLink.isPending ? 'Erstelle...' : 'Link erstellen'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium mb-2">Freigabe-Link:</p>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {expiresAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Läuft ab am: {new Date(expiresAt).toLocaleString('de-DE')}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  ✅ Link wurde erstellt und ist sofort einsatzbereit<br/>
                  📧 Keine E-Mail-Adresse erforderlich<br/>
                  🔒 Zugriff nur mit diesem Link möglich
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### Public Share View Page

```tsx
// pages/SharedDocument.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicSharing } from '@/hooks/usePublicSharing';
import { DocumentViewer } from '@/components/viewer/DocumentViewer';
import { AlertCircle } from 'lucide-react';

interface SharedFileData {
  file: {
    id: string;
    title: string;
    mime: string;
    size: number;
    created_at: string;
  };
  signedUrl: string;
  previewUrl: string | null;
  expiresAt: string | null;
}

export default function SharedDocument() {
  const { token } = useParams<{ token: string }>();
  const [fileData, setFileData] = useState<SharedFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSharedFile } = usePublicSharing();

  useEffect(() => {
    const loadSharedFile = async () => {
      if (!token) {
        setError('Kein Token angegeben');
        setLoading(false);
        return;
      }

      try {
        const data = await getSharedFile(token);
        setFileData(data);
      } catch (err) {
        const errorMessage = (err as Error).message;
        if (errorMessage.includes('expired')) {
          setError('Dieser Freigabe-Link ist abgelaufen');
        } else if (errorMessage.includes('not found')) {
          setError('Freigabe-Link nicht gefunden');
        } else {
          setError('Fehler beim Laden der Datei');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSharedFile();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Lädt geteilte Datei...</p>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-lg font-medium">{error || 'Datei nicht gefunden'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{fileData.file.title}</h1>
          <p className="text-sm text-muted-foreground">
            Geteilt • {new Date(fileData.file.created_at).toLocaleDateString('de-DE')}
            {fileData.expiresAt && ` • Läuft ab: ${new Date(fileData.expiresAt).toLocaleDateString('de-DE')}`}
          </p>
        </div>
      </div>

      <DocumentViewer
        fileUrl={fileData.signedUrl}
        fileName={fileData.file.title}
        mimeType={fileData.file.mime}
      />
    </div>
  );
}
```

---

## Best Practices

### Private Sharing
1. **E-Mail-Validierung:** Immer Benutzer-Existenz prüfen vor dem Teilen
2. **Berechtigungen:** Klare Rollen (Viewer/Editor) mit granularer Kontrolle
3. **Rekursives Sharing:** Bei Ordnern automatisch Inhalte mit-teilen
4. **Revoke-Logik:** Sauberes Entfernen aller Berechtigungen
5. **Notifications:** Benutzer über neue Shares informieren

### Public Link Sharing
1. **Token-Sicherheit:** Kryptographisch sichere Tokens (UUID v4)
2. **Expiration:** Immer Ablaufdaten setzen (Default: 7 Tage)
3. **Signierte URLs:** Nur kurzlebige signierte URLs (5-15 Min)
4. **RLS für Anonyme:** Public Policy nur für gültige Tokens
5. **Rate Limiting:** Link-Generierung limitieren (z.B. 10/Stunde)
6. **Analytics:** Tracking von Zugriff-Statistiken (optional)

### Security Considerations
1. **Owner-Validation:** Immer Eigentümer-Rechte prüfen
2. **Token-Rotation:** Regelmäßige Token-Erneuerung anbieten
3. **Access Logging:** Audit-Trail für alle Sharing-Aktivitäten
4. **CORS Headers:** Korrekte CORS-Konfiguration für Edge Functions
5. **Input Validation:** Validierung aller Eingaben (E-Mail, Token, etc.)

---

## Checkliste

**Private Sharing:**
- [ ] `shared_prompts` und `shared_folders` Tabellen erstellt
- [ ] RLS Policies für Owner und Shared Users
- [ ] `find_user_by_email` Funktion implementiert
- [ ] Rekursive Sharing-Funktion für Ordner
- [ ] Frontend Hook und UI-Komponente
- [ ] Revoke-Logik implementiert
- [ ] Notifications bei neuem Share

**Public Link Sharing:**
- [ ] `shared_links` Tabelle erstellt
- [ ] RLS Policy für öffentlichen Zugriff
- [ ] `create-share-link` Edge Function
- [ ] `get-shared-file` Edge Function mit Token-Validierung
- [ ] Frontend Hook und UI-Komponente
- [ ] Public View Page für Shared Documents
- [ ] Expiration-Handling implementiert
- [ ] Signierte URLs mit kurzer Lebensdauer

**Security:**
- [ ] Kryptographisch sichere Token-Generierung
- [ ] Owner-Validierung in allen Operationen
- [ ] Rate Limiting für Link-Generierung
- [ ] CORS korrekt konfiguriert
- [ ] Input Validation in Edge Functions

---

## Häufige Fehler

### Private Sharing
- **Problem:** Rekursion-Fehler bei verschachtelten Ordnern
  - **Lösung:** Maximum Depth limitieren (z.B. 5 Ebenen)
  
- **Problem:** Benutzer kann sich selbst teilen
  - **Lösung:** `WHERE au.id != auth.uid()` in find_user_by_email

- **Problem:** Sharing-Duplikate erstellen Fehler
  - **Lösung:** `ON CONFLICT DO UPDATE` verwenden

### Public Link Sharing
- **Problem:** Links funktionieren nicht nach Ablauf
  - **Lösung:** `expires_at IS NULL OR expires_at > now()` in Policy

- **Problem:** Service Role Key exposed im Frontend
  - **Lösung:** Nur in Edge Functions verwenden, nie im Frontend

- **Problem:** Signierte URLs ablaufen zu schnell
  - **Lösung:** Refresh-Mechanismus implementieren (Auto-Regenerierung)

---

## Zusammenfassung

Dieses Advanced Sharing Pattern kombiniert das Beste aus beiden Welten:
- **Private Sharing** für kollaborative, team-basierte Arbeit mit granularen Berechtigungen
- **Public Link Sharing** für schnelles, anonymes Teilen ohne Registrierung

Beide Systeme sind vollständig sicher, skalierbar und produktionsreif implementierbar.
