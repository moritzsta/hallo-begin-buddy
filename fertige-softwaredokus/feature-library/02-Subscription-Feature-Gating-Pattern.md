# Subscription & Feature-Gating Pattern
**Kategorie:** Business Logic & Monetarisierung  
**Verwendung in:** Smarte Dokumentenablage, PromptManager, Handwerker Marketplace  
**Komplexität:** Hoch  
**Dependencies:** Stripe, Supabase, AuthContext

---

## Überblick

Dieses Pattern beschreibt die Implementierung eines mehrstufigen Subscription-Systems mit:
- Multi-Tier Plan-Struktur (Free, Basic/Starter, Plus/Professional, Max/Premium)
- Client- und Server-seitiges Feature-Gating
- Usage Tracking für limitierte Features
- Stripe Integration für Subscriptions
- Upgrade/Downgrade Flows

---

## Architektur

### System-Übersicht
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Feature Gate   │────▶│  Server Check   │
│  (React)        │     │  Component      │     │  (Edge Func)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Stripe Portal  │     │  Usage Tracking │     │  RLS Policies   │
│  (Manage Sub)   │     │  (Limits)       │     │  (Access)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Plan-Strukturen

### Dokumentenablage (Storage-fokussiert)
```typescript
const PLAN_LIMITS = {
  free: {
    smart_uploads_per_month: 30,
    storage_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
    max_file_size_bytes: 25 * 1024 * 1024, // 25 MB
    max_files: 1000,
    features: {
      preview_images: true,
      preview_pdf: true,
      preview_office: true,
      basic_views: true,
      badges: true,
      manual_tags: true,
      gallery_view: false,
      mass_upload_friendly: false,
      version_history: false,
      priority_processing: false
    }
  },
  basic: {
    smart_uploads_per_month: 300,
    storage_bytes: 50 * 1024 * 1024 * 1024, // 50 GB
    max_file_size_bytes: 250 * 1024 * 1024, // 250 MB
    max_files: 10000,
    price_eur: 3.99,
    features: {
      preview_images: true,
      preview_pdf: true,
      preview_office: true,
      basic_views: true,
      badges: true,
      manual_tags: true,
      gallery_view: true,
      mass_upload_friendly: true,
      version_history: false,
      priority_processing: false
    }
  },
  plus: {
    smart_uploads_per_month: 1500,
    storage_bytes: 200 * 1024 * 1024 * 1024, // 200 GB
    max_file_size_bytes: 1 * 1024 * 1024 * 1024, // 1 GB
    max_files: 50000,
    price_eur: 7.99,
    features: {
      preview_images: true,
      preview_pdf: true,
      preview_office: true,
      basic_views: true,
      badges: true,
      manual_tags: true,
      gallery_view: true,
      mass_upload_friendly: true,
      version_history: true,
      version_history_days: 30,
      priority_processing: true
    }
  },
  max: {
    smart_uploads_per_month: 5000,
    storage_bytes: 1 * 1024 * 1024 * 1024 * 1024, // 1 TB
    max_file_size_bytes: 2 * 1024 * 1024 * 1024, // 2 GB
    max_files: -1, // unlimited
    price_eur: 12.99,
    features: {
      preview_images: true,
      preview_pdf: true,
      preview_office: true,
      basic_views: true,
      badges: true,
      manual_tags: true,
      gallery_view: true,
      mass_upload_friendly: true,
      version_history: true,
      version_history_days: 180,
      priority_processing: true,
      early_access_features: true
    }
  }
};
```

### PromptManager (Feature-fokussiert)
```typescript
const PLAN_LIMITS = {
  free: {
    price_eur: 0,
    features: {
      max_prompts: 10,
      max_folders: 3,
      max_folder_depth: 2,
      basic_rating: true,
      prompt_sharing: false,
      smart_improve: false,
      advanced_analytics: false,
      api_access: false,
      priority_support: false
    }
  },
  starter: {
    price_eur: 2.00,
    features: {
      max_prompts: 100,
      max_folders: 20,
      max_folder_depth: 3,
      basic_rating: true,
      prompt_sharing: true,
      smart_improve: true,
      smart_improve_per_month: 50,
      advanced_analytics: false,
      api_access: false,
      priority_support: false
    }
  },
  professional: {
    price_eur: 5.00,
    features: {
      max_prompts: 1000,
      max_folders: 100,
      max_folder_depth: 5,
      basic_rating: true,
      prompt_sharing: true,
      smart_improve: true,
      smart_improve_per_month: 300,
      advanced_analytics: true,
      api_access: true,
      priority_support: false
    }
  },
  premium: {
    price_eur: 10.00,
    features: {
      max_prompts: -1, // unlimited
      max_folders: -1, // unlimited
      max_folder_depth: 10,
      basic_rating: true,
      prompt_sharing: true,
      smart_improve: true,
      smart_improve_per_month: -1, // unlimited
      advanced_analytics: true,
      api_access: true,
      priority_support: true,
      white_label: true
    }
  }
};
```

### Handwerker Marketplace (Role-basiert)
```typescript
const SUBSCRIPTION_PLANS = {
  customer: {
    free: true, // Kunden zahlen nie
    features: {
      create_projects: true,
      receive_bids: true,
      messaging: true,
      ratings: true
    }
  },
  craftsman: {
    basic: {
      price_eur: 9.99,
      features: {
        view_projects: true,
        submit_bids: 10, // pro Monat
        messaging: true,
        basic_profile: true,
        invoice_generation: true // kostenlos via Stripe
      }
    },
    professional: {
      price_eur: 29.99,
      features: {
        view_projects: true,
        submit_bids: 50,
        messaging: true,
        enhanced_profile: true,
        invoice_generation: true,
        priority_listing: true,
        analytics: true
      }
    },
    enterprise: {
      price_eur: 99.99,
      features: {
        view_projects: true,
        submit_bids: -1, // unlimited
        messaging: true,
        premium_profile: true,
        invoice_generation: true,
        priority_listing: true,
        analytics: true,
        api_access: true,
        dedicated_support: true
      }
    }
  }
};
```

---

## Implementierung

### 1. Datenbank-Schema

```sql
-- Usage Tracking
CREATE TABLE public.usage_tracking (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature, date)
);

-- Index für Performance
CREATE INDEX idx_usage_tracking_user_feature_date 
  ON usage_tracking(user_id, feature, date);

-- RLS Policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Prevent deletion
CREATE POLICY "Prevent usage tracking deletion"
  ON usage_tracking FOR DELETE
  USING (false);
```

### 2. Server-seitige Limit-Checks (Edge Function Utils)

**plan-utils.ts:**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface PlanLimits {
  smart_uploads_per_month?: number;
  storage_bytes?: number;
  max_file_size_bytes?: number;
  max_files?: number;
  features: Record<string, any>;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    smart_uploads_per_month: 30,
    storage_bytes: 5 * 1024 * 1024 * 1024,
    max_file_size_bytes: 25 * 1024 * 1024,
    max_files: 1000,
    features: {
      preview_images: true,
      preview_pdf: true,
      manual_tags: true,
      gallery_view: false
    }
  },
  // ... weitere Pläne
};

export interface PlanCheckResult {
  allowed: boolean;
  current?: number;
  limit?: number;
  message?: string;
}

// Smart Upload Limit Check
export async function checkSmartUploadLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: string = 'free'
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planTier];
  if (!limits) {
    return { allowed: false, message: 'Invalid plan tier' };
  }

  const limit = limits.smart_uploads_per_month;
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Aktuelle Nutzung abrufen
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', 'smart_upload')
    .gte('date', startOfMonth.toISOString().split('T')[0])
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking usage:', error);
    return { allowed: false, message: 'Error checking usage' };
  }

  const currentUsage = data?.count || 0;
  const allowed = currentUsage < limit;

  return {
    allowed,
    current: currentUsage,
    limit,
    message: allowed 
      ? undefined 
      : `Monthly limit of ${limit} smart uploads reached. Please upgrade your plan.`
  };
}

// Storage Limit Check
export async function checkStorageLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: string = 'free',
  additionalSizeBytes: number = 0
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planTier];
  const storageLimit = limits?.storage_bytes || 0;

  if (storageLimit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Aktuellen Speicherverbrauch berechnen
  const { data, error } = await supabase
    .from('files')
    .select('size')
    .eq('owner_id', userId);

  if (error) {
    console.error('Error checking storage:', error);
    return { allowed: false, message: 'Error checking storage' };
  }

  const currentStorage = data.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalNeeded = currentStorage + additionalSizeBytes;
  const allowed = totalNeeded <= storageLimit;

  return {
    allowed,
    current: currentStorage,
    limit: storageLimit,
    message: allowed
      ? undefined
      : `Storage limit of ${(storageLimit / (1024 * 1024 * 1024)).toFixed(2)} GB exceeded`
  };
}

// Feature Check
export function canUseFeature(
  planTier: string,
  feature: string
): boolean {
  const limits = PLAN_LIMITS[planTier];
  return limits?.features?.[feature] === true;
}

// Usage Tracking Increment
export async function incrementUsageTracking(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_usage_tracking', {
    p_user_id: userId,
    p_feature: feature,
    p_date: today
  });

  if (error) {
    console.error('Error incrementing usage:', error);
  }
}

// DB Function für Increment
/*
CREATE OR REPLACE FUNCTION increment_usage_tracking(
  p_user_id uuid,
  p_feature text,
  p_date date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, feature, date, count)
  VALUES (p_user_id, p_feature, p_date, 1)
  ON CONFLICT (user_id, feature, date)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = now();
END;
$$;
*/
```

### 3. Frontend Feature-Gating

**FeatureGate Component:**
```typescript
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canUseFeature } from '@/lib/plans';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) => {
  const { profile } = useAuth();
  const userTier = profile?.plan_tier || 'free';
  const hasAccess = canUseFeature(userTier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} currentTier={userTier} />;
  }

  return null;
};
```

**UpgradePrompt Component:**
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  currentTier: string;
}

export const UpgradePrompt = ({ feature, currentTier }: UpgradePromptProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-muted-foreground mb-4">
        This feature is not available in your current plan ({currentTier}).
      </p>
      <Button onClick={() => navigate('/settings?tab=plan')}>
        Upgrade Now
      </Button>
    </Card>
  );
};
```

### 4. Stripe Integration

**Edge Function: create-checkout.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings?tab=plan&success=true`,
      cancel_url: `${req.headers.get('origin')}/settings?tab=plan&canceled=true`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
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

**Edge Function: check-subscription.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCT_TO_TIER = {
  'prod_basic': 'basic',
  'prod_plus': 'plus',
  'prod_max': 'max',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          product_id: null,
          plan_tier: 'free',
          subscription_end: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let planTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      planTier = PRODUCT_TO_TIER[productId] || 'free';

      // Update profile
      await supabaseClient
        .from('profiles')
        .update({ plan_tier: planTier })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        product_id: productId,
        plan_tier: planTier,
        subscription_end: subscriptionEnd
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

### Server-seitige Validierung
- **IMMER** Limits auf Server prüfen, niemals nur Client
- **IMMER** `403 Forbidden` bei Feature-Limit-Verstößen zurückgeben
- Usage Tracking **vor** Feature-Ausführung inkrementieren

### Performance
- Plan-Limits im Client cachen (via AuthContext)
- Usage-Abfragen optimieren (Indizes!)
- Optimistic Updates für bessere UX

### Sicherheit
- Stripe Secret Keys nur in Edge Functions
- Product-IDs im Code hinterlegen, nicht dynamisch
- RLS auf usage_tracking aktivieren

### UX
- Freundliche Upgrade-Prompts statt harter Blocks
- Aktuelle Nutzung visualisieren
- Stripe Customer Portal für Self-Service

---

## Checkliste

- [ ] `usage_tracking` Tabelle erstellt
- [ ] Plan-Limits definiert (client + server)
- [ ] Feature-Gate Component implementiert
- [ ] Server-seitige Limit-Checks in Edge Functions
- [ ] Stripe Products & Prices erstellt
- [ ] `create-checkout` Edge Function deployed
- [ ] `check-subscription` Edge Function deployed
- [ ] Customer Portal aktiviert
- [ ] Upgrade-Prompts designt
- [ ] Usage-Anzeigen implementiert

---

## Querverweise
- → `01-Auth-Profile-Pattern.md` (plan_tier in profiles)
- → `03-Security-Pattern.md` (RLS für usage_tracking)
- → `04-KI-Integration-Pattern.md` (Smart Feature Limits)
