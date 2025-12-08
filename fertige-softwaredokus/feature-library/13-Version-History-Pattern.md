# 13-Version-History-Pattern

## Überblick

**Was:** Automatische Versionierung von Content-Änderungen mit Rollback-Funktion und Change-Type-Tracking.

**Wann verwenden:**
- Wenn Nutzer Änderungen rückgängig machen können sollen
- Für Audit-Trail und Nachvollziehbarkeit
- Bei AI-generierten Änderungen (Original vs. verbessert)

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                   Version History System                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │           prompt_versions Table          │               │
│  │  - prompt_id (FK)                        │               │
│  │  - title, description, content           │               │
│  │  - change_type (enum)                    │               │
│  │  - version_name (optional)               │               │
│  │  - created_at                            │               │
│  └─────────────────────────────────────────┘               │
│           ▲                                                 │
│           │                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │         promptVersions.ts Utils          │               │
│  │  - savePromptVersion()                   │               │
│  │  - updatePromptWithVersioning()          │               │
│  │  - determineChangeType()                 │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │      PromptVersionHistory.tsx            │               │
│  │  - Timeline View                         │               │
│  │  - Rollback Function                     │               │
│  │  - Version Comparison                    │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Datenbank-Schema

```sql
-- prompt_versions Tabelle
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  
  -- Change Type Tracking
  change_type TEXT NOT NULL DEFAULT 'manual_edit' 
    CHECK (change_type IN ('manual_edit', 'ai_improvement', 'description_change', 'tag_change')),
  
  -- Optional: Benutzerdefinierter Versionsname
  version_name TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Nutzer können Versionen ihrer eigenen Prompts sehen
CREATE POLICY "Users can view own prompt versions"
  ON public.prompt_versions FOR SELECT
  USING (
    prompt_id IN (
      SELECT id FROM public.prompts WHERE owner_id = auth.uid()
    )
  );

-- Versionen können nur eingefügt werden (nicht bearbeitet)
CREATE POLICY "Users can insert versions for own prompts"
  ON public.prompt_versions FOR INSERT
  WITH CHECK (
    prompt_id IN (
      SELECT id FROM public.prompts WHERE owner_id = auth.uid()
    )
  );

-- Shared Users können auch Versionen sehen
CREATE POLICY "Shared users can view prompt versions"
  ON public.prompt_versions FOR SELECT
  USING (
    prompt_id IN (
      SELECT prompt_id FROM public.shared_prompts WHERE user_id = auth.uid()
    )
  );

-- Index für schnelle Abfragen
CREATE INDEX idx_prompt_versions_prompt_id 
  ON public.prompt_versions(prompt_id, created_at DESC);
```

---

## Implementierung

### Schritt 1: Version Utilities

```typescript
// src/utils/promptVersions.ts
import { supabase } from '@/integrations/supabase/client';
import { Prompt } from '@/components/PromptManager';

export const savePromptVersion = async (
  promptId: string,
  currentTitle: string,
  currentDescription: string | null,
  currentContent: string,
  changeType: 'manual_edit' | 'ai_improvement' | 'description_change' | 'tag_change',
  versionName?: string
) => {
  const { error } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      title: currentTitle,
      description: currentDescription,
      content: currentContent,
      change_type: changeType,
      version_name: versionName || null,
    });

  if (error) {
    console.error('Error saving prompt version:', error);
    throw error;
  }
};

// Automatische Change-Type-Erkennung
const determineChangeType = (
  originalPrompt: Prompt,
  updates: Partial<Prompt>,
  explicitChangeType?: 'edit' | 'improve'
): 'manual_edit' | 'ai_improvement' | 'description_change' | 'tag_change' => {
  // Bei explizitem AI-Improvement
  if (explicitChangeType === 'improve') {
    return 'ai_improvement';
  }

  const contentChanged = updates.content !== undefined && updates.content !== originalPrompt.content;
  const titleChanged = updates.title !== undefined && updates.title !== originalPrompt.title;
  const descriptionChanged = updates.description !== originalPrompt.description;
  const tagsChanged = JSON.stringify(updates.tags || []) !== JSON.stringify(originalPrompt.tags || []);

  // Priorität: Content/Title > Description > Tags
  if (contentChanged || titleChanged) {
    return 'manual_edit';
  }
  
  if (descriptionChanged && !tagsChanged) {
    return 'description_change';
  }
  
  if (tagsChanged) {
    return 'tag_change';
  }
  
  return 'manual_edit';
};

export const updatePromptWithVersioning = async (
  promptId: string,
  currentPrompt: Prompt,
  updates: Partial<Prompt>,
  changeType?: 'edit' | 'improve',
  versionName?: string
) => {
  try {
    if (changeType === 'improve') {
      // Bei AI-Verbesserung: Original als manual_edit speichern
      await savePromptVersion(
        promptId,
        currentPrompt.title,
        currentPrompt.description,
        currentPrompt.content,
        'manual_edit',
        versionName
      );

      // Prompt aktualisieren
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);

      if (updateError) throw updateError;

      // Verbesserte Version als ai_improvement speichern
      await savePromptVersion(
        promptId,
        updates.title || currentPrompt.title,
        updates.description !== undefined ? updates.description : currentPrompt.description,
        updates.content || currentPrompt.content,
        'ai_improvement',
        versionName
      );

    } else {
      // Normale Bearbeitung
      const actualChangeType = determineChangeType(currentPrompt, updates, changeType);
      
      // Aktuelle Version speichern
      await savePromptVersion(
        promptId,
        currentPrompt.title,
        currentPrompt.description,
        currentPrompt.content,
        actualChangeType,
        versionName
      );

      // Prompt aktualisieren
      const { error } = await supabase
        .from('prompts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating prompt with versioning:', error);
    throw error;
  }
};
```

### Schritt 2: Version History Component

```typescript
// src/components/PromptVersionHistory.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Wand2, FileText, Tag, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface PromptVersion {
  id: string;
  title: string;
  description: string | null;
  content: string;
  change_type: string;
  version_name: string | null;
  created_at: string;
}

interface PromptVersionHistoryProps {
  promptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollback: (version: PromptVersion) => void;
}

export const PromptVersionHistory = ({
  promptId,
  open,
  onOpenChange,
  onRollback,
}: PromptVersionHistoryProps) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, promptId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'ai_improvement':
        return <Wand2 className="h-4 w-4 text-purple-500" />;
      case 'description_change':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'tag_change':
        return <Tag className="h-4 w-4 text-green-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'ai_improvement':
        return 'KI-Verbesserung';
      case 'description_change':
        return 'Beschreibung geändert';
      case 'tag_change':
        return 'Tags geändert';
      default:
        return 'Manuell bearbeitet';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Versionshistorie
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-8">Laden...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine früheren Versionen vorhanden
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getChangeTypeIcon(version.change_type)}
                      <div>
                        <p className="font-medium">{version.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {getChangeTypeLabel(version.change_type)}
                    </Badge>
                  </div>

                  {selectedVersion?.id === version.id && (
                    <div className="mt-4 space-y-2">
                      <pre className="p-3 bg-muted rounded text-sm overflow-x-auto max-h-40">
                        {version.content.slice(0, 500)}
                        {version.content.length > 500 && '...'}
                      </pre>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRollback(version);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Zu dieser Version zurückkehren
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
```

### Schritt 3: Integration in Edit-Workflow

```typescript
// In EditPromptDialog.tsx oder ähnlich
import { updatePromptWithVersioning } from '@/utils/promptVersions';

const handleSave = async () => {
  try {
    // Mit automatischer Versionierung speichern
    await updatePromptWithVersioning(
      prompt.id,
      prompt,          // Original-Prompt
      {                // Updates
        title: newTitle,
        content: newContent,
        description: newDescription,
      },
      'edit'           // Change Type
    );
    
    toast({ title: 'Gespeichert', description: 'Version wurde gesichert.' });
    onRefresh();
  } catch (error) {
    toast({ title: 'Fehler', variant: 'destructive' });
  }
};
```

---

## Best Practices

1. **Automatische Versionierung:** Bei jeder Änderung automatisch speichern
2. **Change-Type-Tracking:** Unterscheiden zwischen manuell, KI, Tags, Beschreibung
3. **Keine Version-Limits:** Alle Versionen behalten (oder Cleanup-Job für alte)
4. **Read-Only Versionen:** Versionen können nicht bearbeitet werden
5. **Rollback = Neue Version:** Rollback erstellt neue Version mit altem Content
6. **RLS für Shared Access:** Auch geteilte Nutzer können Versionen sehen

---

## Change Types

| Change Type | Beschreibung | Icon |
|-------------|--------------|------|
| `manual_edit` | Manuelle Bearbeitung von Titel/Content | ✏️ |
| `ai_improvement` | KI-generierte Verbesserung | 🪄 |
| `description_change` | Nur Beschreibung geändert | 📄 |
| `tag_change` | Tags hinzugefügt/entfernt | 🏷️ |

---

## Checkliste

- [ ] prompt_versions Tabelle erstellt
- [ ] RLS Policies für Owner und Shared Users
- [ ] savePromptVersion() Utility
- [ ] updatePromptWithVersioning() Utility
- [ ] determineChangeType() Logik
- [ ] PromptVersionHistory Component
- [ ] Timeline-Ansicht mit Icons
- [ ] Rollback-Funktion
- [ ] Integration in Edit-Dialoge

---

## Querverweise

- **05-Datenstruktur-Pattern:** Tabellen-Design
- **03-Security-Pattern:** RLS für Versionen
- **04-KI-Integration-Pattern:** AI-Improvement Change Type

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
