import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { PlanConfig } from '@/lib/plans';

interface PlanCardProps {
  plan: PlanConfig;
  currentTier: string;
  onUpgrade: () => void;
  isSubscribed: boolean;
  loading?: boolean;
}

export const PlanCard = ({ plan, currentTier, onUpgrade, isSubscribed, loading }: PlanCardProps) => {
  const { t } = useTranslation();
  const isCurrent = currentTier === plan.tier;
  const isDowngrade = getPlanWeight(plan.tier) < getPlanWeight(currentTier);

  return (
    <Card className={`relative ${isCurrent ? 'border-primary shadow-lg' : ''} ${plan.popular ? 'border-primary/50' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3">{t('plans.popular')}</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          <div className="mt-2">
            <span className="text-3xl font-bold">{plan.priceLabel}</span>
            {plan.priceEUR > 0 && (
              <span className="text-muted-foreground ml-2">{t('plans.perMonth')}</span>
            )}
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.limits.smartUploadsPerMonth} {t('plans.smartUploads')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.limits.storageGB} GB {t('plans.storage')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.limits.maxFileSizeMB} MB {t('plans.maxFileSize')}</span>
          </div>
          
          {plan.limits.features.advancedSearch && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('plans.advancedSearch')}</span>
            </div>
          )}
          {plan.limits.features.bulkOperations && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('plans.bulkOperations')}</span>
            </div>
          )}
          {plan.limits.features.apiAccess && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('plans.apiAccess')}</span>
            </div>
          )}
          {plan.limits.features.prioritySupport && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{t('plans.prioritySupport')}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        {isCurrent ? (
          <Button disabled className="w-full">
            {t('plans.currentPlan')}
          </Button>
        ) : plan.tier === 'free' ? (
          <Button disabled variant="outline" className="w-full">
            {t('plans.freePlan')}
          </Button>
        ) : isDowngrade ? (
          <Button disabled variant="outline" className="w-full">
            {t('plans.downgrade')}
          </Button>
        ) : (
          <Button 
            onClick={onUpgrade} 
            disabled={loading}
            className="w-full"
          >
            {loading ? t('common.loading') : t('plans.upgradeTo', { plan: plan.name })}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const getPlanWeight = (tier: string): number => {
  const weights: Record<string, number> = {
    free: 0,
    basic: 1,
    plus: 2,
    max: 3,
  };
  return weights[tier] || 0;
};