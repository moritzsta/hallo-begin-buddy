# 12-Account-Deletion-Pattern

## Überblick

**Was:** Sicherer Account-Löschungs-Workflow mit zwei Modi (sofort/geplant), Passwort-Verifikation und Token-basierter Stornierung.

**Wann verwenden:**
- Für DSGVO-Compliance (Recht auf Löschung)
- Bei SaaS-Produkten mit Benutzerkonten
- Wenn Nutzer ihre Daten vollständig entfernen können müssen

**Komplexität:** Hoch

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                  Account Deletion System                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │         DeleteAccountDialog.tsx          │               │
│  │  - Mode Selection (immediate/scheduled)  │               │
│  │  - Content Overview (Prompts, Folders)   │               │
│  │  - Subscription Check                    │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │       PasswordConfirmDialog.tsx          │               │
│  │  - Password Verification                 │               │
│  │  - Confirmation Text ("DELETE MY...")    │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │      Edge Function: delete-account       │               │
│  │  - Password Check                        │               │
│  │  - Subscription Block                    │               │
│  │  - Token Generation                      │               │
│  │  - Schedule Entry                        │               │
│  │  - Email Notification                    │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├─────────────────────────────────┐               │
│           ▼                                 ▼               │
│  ┌─────────────────┐        ┌─────────────────────────┐    │
│  │ execute-account │        │ cancel-account-deletion │    │
│  │ -deletion (Cron)│        │ (Token-based Cancel)    │    │
│  └─────────────────┘        └─────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Datenbank-Schema

```sql
-- account_deletions Tabelle
CREATE TABLE public.account_deletions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deletion_mode TEXT NOT NULL CHECK (deletion_mode IN ('immediate', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Token für Stornierung ohne Login
  cancellation_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Bei Stornierung
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Bei Ausführung
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit-Metadaten
  metadata JSONB
);

-- RLS aktivieren
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;

-- Nutzer können nur eigene Einträge sehen
CREATE POLICY "Users can view own deletions"
  ON public.account_deletions FOR SELECT
  USING (auth.uid() = user_id);

-- Index für Cron-Job
CREATE INDEX idx_account_deletions_pending 
  ON public.account_deletions(status, scheduled_for) 
  WHERE status = 'pending';
```

---

## Implementierung

### Schritt 1: Delete Account Dialog

```typescript
// src/components/DeleteAccountDialog.tsx
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Clock, Zap, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (mode: 'immediate' | 'scheduled') => void;
}

export const DeleteAccountDialog = ({
  isOpen,
  onClose,
  onContinue,
}: DeleteAccountDialogProps) => {
  const [deletionMode, setDeletionMode] = useState<'immediate' | 'scheduled'>('scheduled');
  const [promptCount, setPromptCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAccountData();
    }
  }, [isOpen]);

  const fetchAccountData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get counts
      const { count: pCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      setPromptCount(pCount || 0);

      // Check subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_plan_tier, plan_tier')
        .eq('id', user.id)
        .single();

      const hasActiveSub = profile && 
        (profile.stripe_plan_tier && profile.stripe_plan_tier !== 'free');

      setHasActiveSubscription(!!hasActiveSub);
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Account löschen
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Achtung!</AlertTitle>
              <AlertDescription>
                Diese Aktion kann nicht vollständig rückgängig gemacht werden.
              </AlertDescription>
            </Alert>

            {/* Mode Selection */}
            <RadioGroup 
              value={deletionMode} 
              onValueChange={(v) => setDeletionMode(v as 'immediate' | 'scheduled')}
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="scheduled" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    30-Tage-Frist (empfohlen)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Du kannst die Löschung innerhalb von 30 Tagen per E-Mail-Link stornieren.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="immediate" id="immediate" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="immediate" className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-destructive" />
                    Sofortige Löschung (24h)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Dein Account wird nach 24 Stunden unwiderruflich gelöscht.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {/* What will be deleted */}
            <div className="space-y-2">
              <p className="font-semibold">Was wird gelöscht:</p>
              <ul className="space-y-1 text-sm">
                <li>✅ {promptCount} Prompts</li>
                <li>✅ {folderCount} Ordner</li>
                <li>✅ Alle Versionen und Tags</li>
                <li>✅ Dein Profil und Einstellungen</li>
              </ul>
            </div>

            {/* Subscription Warning */}
            {hasActiveSubscription && (
              <Alert variant="destructive">
                <CreditCard className="h-4 w-4" />
                <AlertTitle>Aktives Abonnement</AlertTitle>
                <AlertDescription>
                  Bitte kündige zuerst dein Abonnement, bevor du deinen Account löschen kannst.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onContinue(deletionMode)}
            disabled={hasActiveSubscription || isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            Weiter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### Schritt 2: Password Confirmation Dialog

```typescript
// src/components/PasswordConfirmDialog.tsx
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isLoading: boolean;
}

export const PasswordConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: PasswordConfirmDialogProps) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isValid = password.length >= 6 && confirmText === 'DELETE MY ACCOUNT';

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(password);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Letzte Bestätigung
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Passwort bestätigen</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dein aktuelles Passwort"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Tippe <span className="font-mono font-bold">DELETE MY ACCOUNT</span> zur Bestätigung
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Wird verarbeitet...' : 'Account löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### Schritt 3: Edge Function - delete-account

```typescript
// supabase/functions/delete-account/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteAccountRequest {
  password: string;
  confirmText: string;
  deletionMode: 'immediate' | 'scheduled';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      throw new Error('Unauthorized');
    }

    const { password, confirmText, deletionMode }: DeleteAccountRequest = await req.json();

    // 2. Confirm Text Validation
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Bestätigungstext stimmt nicht überein' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Password Verification
    const { error: pwError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (pwError) {
      return new Response(
        JSON.stringify({ error: 'Falsches Passwort' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Subscription Check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_plan_tier')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_plan_tier && profile.stripe_plan_tier !== 'free') {
      return new Response(
        JSON.stringify({ error: 'Bitte kündige zuerst dein Abonnement' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Calculate Deletion Date
    const deletionDate = new Date();
    if (deletionMode === 'immediate') {
      deletionDate.setHours(deletionDate.getHours() + 24);
    } else {
      deletionDate.setDate(deletionDate.getDate() + 30);
    }

    // 6. Generate Cancellation Token (for scheduled mode)
    const cancellationToken = deletionMode === 'scheduled' 
      ? crypto.randomUUID() 
      : null;

    // 7. Create Deletion Entry
    await supabaseAdmin.from('account_deletions').insert({
      user_id: user.id,
      deletion_mode: deletionMode,
      scheduled_for: deletionDate.toISOString(),
      cancellation_token: cancellationToken,
      token_expires_at: deletionDate.toISOString(),
      metadata: {
        ip: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
      },
    });

    // 8. Send Confirmation Email with Cancel Link
    await supabaseAdmin.functions.invoke('send-deletion-confirmation', {
      body: {
        user_id: user.id,
        email: user.email,
        deletion_date: deletionDate.toISOString(),
        deletion_mode: deletionMode,
        cancellation_token: cancellationToken,
      },
    });

    // 9. Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: `account_deletion_requested_${deletionMode}`,
      metadata: { scheduled_for: deletionDate.toISOString() },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletion_date: deletionDate.toISOString(),
        deletion_mode: deletionMode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Schritt 4: Token-basierte Stornierung

```typescript
// supabase/functions/cancel-account-deletion/index.ts
serve(async (req: Request) => {
  // Token aus URL-Parameter
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token fehlt' }), { status: 400 });
  }

  // Finde Deletion-Eintrag mit Token
  const { data: deletion, error } = await supabaseAdmin
    .from('account_deletions')
    .select('*')
    .eq('cancellation_token', token)
    .eq('status', 'pending')
    .single();

  if (error || !deletion) {
    return new Response(JSON.stringify({ error: 'Ungültiger oder abgelaufener Token' }), { status: 404 });
  }

  // Token noch gültig?
  if (new Date(deletion.token_expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'Token abgelaufen' }), { status: 400 });
  }

  // Stornieren
  await supabaseAdmin
    .from('account_deletions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', deletion.id);

  // Bestätigungs-Email
  await supabaseAdmin.functions.invoke('send-deletion-cancelled', {
    body: { user_id: deletion.user_id },
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

---

## Best Practices

1. **Passwort-Verifikation:** Immer Passwort bestätigen lassen
2. **Confirmation Text:** Explizite Bestätigung durch Texteingabe
3. **Subscription Block:** Aktive Abos müssen zuerst gekündigt werden
4. **Grace Period:** Mindestens 24h (DSGVO empfiehlt 30 Tage)
5. **Token-Stornierung:** Ohne Login stornierbar per E-Mail-Link
6. **Audit Logging:** Alle Aktionen protokollieren
7. **Content Duplication:** Geteilte Inhalte vor Löschung duplizieren

---

## Checkliste

- [ ] account_deletions Tabelle erstellt
- [ ] DeleteAccountDialog mit Mode-Auswahl
- [ ] PasswordConfirmDialog mit Text-Bestätigung
- [ ] Edge Function: delete-account
- [ ] Edge Function: cancel-account-deletion
- [ ] Edge Function: execute-account-deletion (Cron)
- [ ] E-Mail-Templates für Bestätigung und Stornierung
- [ ] Subscription-Check vor Löschung
- [ ] Audit Logging implementiert

---

## Querverweise

- **01-Auth-Profile-Pattern:** User-Authentifizierung
- **02-Subscription-Pattern:** Subscription-Check vor Löschung
- **14-Transactional-Email-Pattern:** Löschungs-E-Mails

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
