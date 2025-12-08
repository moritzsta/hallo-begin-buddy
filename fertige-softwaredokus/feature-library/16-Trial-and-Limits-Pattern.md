# 16-Trial-and-Limits-Pattern

## Überblick

**Was:** UI-Komponenten für Trial-Countdown, AI-Usage-Limits und Token-Budget-Anzeige mit Feature-Gating.

**Wann verwenden:**
- Für Freemium-Modelle mit zeitlich begrenzten Trials
- Bei AI-Feature-Limits (Anzahl Aufrufe pro Monat)
- Für Token-basierte Budgets (Premium-Pläne)

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                 Trial & Limits System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │         SubscriptionContext.tsx          │               │
│  │  - currentPlan                           │               │
│  │  - isInTrial, trialDaysRemaining         │               │
│  │  - aiCallsRemaining, totalAiCallsLimit   │               │
│  │  - tokenUsage (Premium)                  │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├─────────────────────┬───────────────────┐      │
│           ▼                     ▼                   ▼      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │TrialCountdown   │  │PromptLimitWarning│ │FeatureGate  │ │
│  │ (Free Plan)     │  │ (Max Prompts)   │  │ (Wrapper)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │         TokenUsageWidget.tsx             │               │
│  │  - Token-Budget Anzeige (Premium)        │               │
│  │  - Cost Tracking                         │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Subscription Context

```typescript
// src/contexts/SubscriptionContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';

type PlanTier = 'free' | 'basic' | 'premium' | 'ai-ready';

interface TokenUsage {
  tokensInputUsed: number;
  tokensOutputUsed: number;
  costCents: number;
  budgetCents: number;
  resetDate: string;
  percentageUsed: number;
  displayTokensUsed: number;
  displayTokensTotal: number;
}

interface SubscriptionContextValue {
  currentPlan: PlanTier | undefined;
  isInTrial: boolean;
  trialDaysRemaining: number | undefined;
  aiCallsRemaining: number | undefined;
  totalAiCallsLimit: number;
  tokenUsage: TokenUsage | null;
  promptCount: number;
  maxPrompts: number;
  canCreatePrompt: boolean;
  canShareFolders: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

// Plan Limits
const PLAN_LIMITS = {
  free: { maxPrompts: 10, aiCalls: 5, canShareFolders: false },
  basic: { maxPrompts: 100, aiCalls: 20, canShareFolders: false },
  premium: { maxPrompts: Infinity, aiCalls: Infinity, canShareFolders: true },
  'ai-ready': { maxPrompts: Infinity, aiCalls: Infinity, canShareFolders: true },
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSupabaseAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanTier | undefined>();
  const [isInTrial, setIsInTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | undefined>();
  const [aiCallsRemaining, setAiCallsRemaining] = useState<number | undefined>();
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [promptCount, setPromptCount] = useState(0);

  const refreshSubscription = async () => {
    if (!user) return;

    try {
      // 1. Profil laden
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // 2. Plan ermitteln (Priorität: stripe > manual > free)
      const plan = (profile.stripe_plan_tier || profile.manual_plan_tier || 'free') as PlanTier;
      setCurrentPlan(plan);

      // 3. Trial-Status prüfen
      if (profile.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        setIsInTrial(daysRemaining > 0);
        setTrialDaysRemaining(daysRemaining);
      }

      // 4. AI Calls (Free/Basic)
      if (plan === 'free' || plan === 'basic') {
        const limit = PLAN_LIMITS[plan].aiCalls;
        const used = profile.ai_calls_used || 0;
        setAiCallsRemaining(Math.max(0, limit - used));
      }

      // 5. Token Usage (Premium/AI-Ready)
      if (plan === 'premium' || plan === 'ai-ready') {
        const { data: usageSummary } = await supabase
          .rpc('get_token_usage_summary', { user_id_param: user.id });

        if (usageSummary && usageSummary[0]) {
          const summary = usageSummary[0];
          setTokenUsage({
            tokensInputUsed: summary.tokens_input_used,
            tokensOutputUsed: summary.tokens_output_used,
            costCents: summary.cost_cents,
            budgetCents: summary.budget_cents,
            resetDate: summary.reset_date,
            percentageUsed: Math.round((summary.cost_cents / summary.budget_cents) * 100),
            displayTokensUsed: summary.tokens_input_used + summary.tokens_output_used,
            displayTokensTotal: Math.round((summary.budget_cents / 0.01) * 1000), // Approximation
          });
        }
      }

      // 6. Prompt Count
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      setPromptCount(count || 0);

    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const limits = currentPlan ? PLAN_LIMITS[currentPlan] : PLAN_LIMITS.free;

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        isInTrial,
        trialDaysRemaining,
        aiCallsRemaining,
        totalAiCallsLimit: limits.aiCalls,
        tokenUsage,
        promptCount,
        maxPrompts: limits.maxPrompts,
        canCreatePrompt: promptCount < limits.maxPrompts,
        canShareFolders: limits.canShareFolders,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
```

### Schritt 2: Trial Countdown Component

```typescript
// src/components/TrialCountdown.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useState, useEffect } from 'react';

interface TrialCountdownProps {
  compact?: boolean;
}

export const TrialCountdown = ({ compact = false }: TrialCountdownProps) => {
  const navigate = useNavigate();
  const {
    currentPlan,
    trialDaysRemaining,
    isInTrial,
    aiCallsRemaining,
    tokenUsage,
    totalAiCallsLimit
  } = useSubscription();
  
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('trialCountdownOpen');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('trialCountdownOpen', String(isOpen));
  }, [isOpen]);

  if (!currentPlan) return null;

  // Compact Badge für Header
  if (compact) {
    if (currentPlan === 'premium' || currentPlan === 'ai-ready') {
      return tokenUsage ? (
        <Badge variant={tokenUsage.percentageUsed > 80 ? "destructive" : "secondary"}>
          <Sparkles className="h-3 w-3 mr-1" />
          {tokenUsage.percentageUsed}% Budget
        </Badge>
      ) : null;
    }
    
    return (
      <Badge variant={aiCallsRemaining === 0 ? "destructive" : "secondary"}>
        <Sparkles className="h-3 w-3 mr-1" />
        {aiCallsRemaining}/{totalAiCallsLimit} AI
      </Badge>
    );
  }

  // Full Card für Sidebar/Dashboard
  const isUrgent = isInTrial && trialDaysRemaining !== undefined && trialDaysRemaining < 2;

  // Premium/AI-Ready: Token-Budget anzeigen
  if ((currentPlan === 'premium' || currentPlan === 'ai-ready') && tokenUsage) {
    const isLow = tokenUsage.percentageUsed > 80;
    const isCritical = tokenUsage.percentageUsed > 95;

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className={isCritical ? 'border-destructive border-2' : isLow ? 'border-yellow-500 border-2' : ''}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Token-Budget
                  <Badge variant={isCritical ? "destructive" : "secondary"}>
                    {tokenUsage.percentageUsed}%
                  </Badge>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    isCritical ? 'bg-destructive' : isLow ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(tokenUsage.percentageUsed, 100)}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{tokenUsage.displayTokensUsed.toLocaleString()} Tokens</span>
                <span>Reset: {new Date(tokenUsage.resetDate).toLocaleDateString()}</span>
              </div>

              {isLow && (
                <Button size="sm" className="w-full" onClick={() => navigate('/subscriptions')}>
                  Budget-Details
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Free/Basic: AI Calls anzeigen
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isUrgent ? 'border-destructive border-2' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isUrgent ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Sparkles className="h-4 w-4" />}
                {isInTrial ? 'Trial' : 'Free Plan'}
                {isInTrial && trialDaysRemaining !== undefined && (
                  <Badge variant={isUrgent ? "destructive" : "default"}>
                    {trialDaysRemaining} Tage
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CollapsibleTrigger>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* AI Calls Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>KI-Funktionen</span>
                <span>{aiCallsRemaining}/{totalAiCallsLimit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    aiCallsRemaining === 0 ? 'bg-destructive' : 
                    aiCallsRemaining && aiCallsRemaining <= 1 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(aiCallsRemaining || 0) / totalAiCallsLimit * 100}%` }}
                />
              </div>
            </div>

            <Button 
              size="sm" 
              variant={isUrgent ? "default" : "outline"} 
              className="w-full"
              onClick={() => navigate('/subscriptions')}
            >
              {isUrgent ? 'Jetzt upgraden' : 'Pläne ansehen'}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
```

### Schritt 3: Feature Gate Component

```typescript
// src/components/FeatureGate.tsx
import { useSubscription, useFeatureAccess } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate = ({ feature, children, fallback }: FeatureGateProps) => {
  const { getRequiredPlanForFeature, getUpgradeMessage } = useFeatureAccess();
  const requiredPlan = getRequiredPlanForFeature(feature);
  const { currentPlan } = useSubscription();

  // Feature verfügbar
  if (!requiredPlan || isPlanSufficient(currentPlan, requiredPlan)) {
    return <>{children}</>;
  }

  // Feature gesperrt
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="opacity-50 cursor-not-allowed">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getUpgradeMessage(feature)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Disabled Button für gesperrte Features
export const DisabledFeatureButton = ({ 
  feature, 
  children, 
  ...props 
}: { feature: string; children: React.ReactNode } & React.ComponentProps<typeof Button>) => {
  const { getUpgradeMessage } = useFeatureAccess();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props} disabled className="opacity-50">
            <Lock className="h-3 w-3 mr-1" />
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getUpgradeMessage(feature)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper
function isPlanSufficient(currentPlan: string | undefined, requiredPlan: string): boolean {
  const planOrder = ['free', 'basic', 'ai-ready', 'premium'];
  const currentIndex = planOrder.indexOf(currentPlan || 'free');
  const requiredIndex = planOrder.indexOf(requiredPlan);
  return currentIndex >= requiredIndex;
}
```

### Schritt 4: Prompt Limit Warning

```typescript
// src/components/PromptLimitWarning.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const PromptLimitWarning = () => {
  const navigate = useNavigate();
  const { promptCount, maxPrompts, canCreatePrompt, currentPlan } = useSubscription();

  // Nur für Free/Basic relevant
  if (currentPlan === 'premium' || currentPlan === 'ai-ready') return null;
  
  // Noch genug Platz
  if (promptCount < maxPrompts - 2) return null;

  const isAtLimit = !canCreatePrompt;
  const isNearLimit = promptCount >= maxPrompts - 2;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? 'Prompt-Limit erreicht' : 'Fast am Limit'}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          {isAtLimit 
            ? `Du hast das Maximum von ${maxPrompts} Prompts erreicht.`
            : `Du hast ${promptCount} von ${maxPrompts} Prompts erstellt.`
          }
        </p>
        <Button size="sm" onClick={() => navigate('/subscriptions')}>
          Jetzt upgraden
        </Button>
      </AlertDescription>
    </Alert>
  );
};
```

---

## Best Practices

1. **Collapsible Widgets:** Widgets standardmäßig einklappbar, State in localStorage
2. **Visual Feedback:** Farbcodierung für kritische Zustände (rot > gelb > grün)
3. **Progress Bars:** Visuell zeigen wie viel Budget/Calls verbraucht
4. **Compact Mode:** Kleine Badges für Header, volle Cards für Sidebar
5. **Upgrade CTAs:** Deutliche Upgrade-Buttons bei Limits
6. **Tooltips:** Bei gesperrten Features erklären warum

---

## Plan-Limits Übersicht

| Plan | Max Prompts | AI Calls | Folder Sharing | Token Budget |
|------|-------------|----------|----------------|--------------|
| Free | 10 | 5/Monat | ❌ | - |
| Basic | 100 | 20/Monat | ❌ | - |
| AI-Ready | ∞ | ∞ | ✅ | 70€/Monat |
| Premium | ∞ | ∞ | ✅ | 100€/Monat |

---

## Checkliste

- [ ] SubscriptionContext mit allen Plan-Daten
- [ ] TrialCountdown (Compact + Full)
- [ ] PromptLimitWarning
- [ ] FeatureGate Wrapper
- [ ] DisabledFeatureButton
- [ ] TokenUsageWidget (Premium)
- [ ] Progress Bars mit Farbcodierung
- [ ] Collapsible mit localStorage-Persistenz
- [ ] Upgrade CTAs zu /subscriptions

---

## Querverweise

- **02-Subscription-Feature-Gating-Pattern:** Plan-Logik im Backend
- **06-UI-UX-Pattern:** Widget-Design
- **15-i18n-Pattern:** Mehrsprachige Limit-Texte

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
