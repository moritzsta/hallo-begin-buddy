import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUpgradeMessage, PLAN_CONFIGS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

interface UpgradePromptProps {
  feature: string;
  currentTier: PlanTier;
  variant?: 'card' | 'inline';
}

export const UpgradePrompt = ({ 
  feature, 
  currentTier,
  variant = 'card' 
}: UpgradePromptProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const message = getUpgradeMessage(feature, currentTier);

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>{message}</span>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/settings?tab=plan')}
          className="h-auto p-0"
        >
          {t('plans.upgrade')} <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            {t('plans.upgradeTitle')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {message}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/settings?tab=plan')}>
              {t('plans.viewPlans')}
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              {t('common.back')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};