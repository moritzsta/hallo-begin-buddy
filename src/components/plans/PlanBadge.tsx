import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { PLAN_CONFIGS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { Crown, Zap, Star } from 'lucide-react';

interface PlanBadgeProps {
  tier: PlanTier;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

const PLAN_ICONS = {
  free: null,
  basic: <Zap className="h-3 w-3" />,
  plus: <Star className="h-3 w-3" />,
  max: <Crown className="h-3 w-3" />,
};

export const PlanBadge = ({ tier, showIcon = true, variant }: PlanBadgeProps) => {
  const { t } = useTranslation();
  const config = PLAN_CONFIGS[tier];
  const icon = showIcon ? PLAN_ICONS[tier] : null;

  const badgeVariant = variant || (tier === 'free' ? 'outline' : tier === 'max' ? 'default' : 'secondary');

  return (
    <Badge variant={badgeVariant} className="gap-1">
      {icon}
      {config.name}
    </Badge>
  );
};