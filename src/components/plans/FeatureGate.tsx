import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canUseFeature } from '@/lib/plans';
import type { PlanLimits } from '@/lib/plans';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: keyof PlanLimits['features'];
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
  const userTier = (profile?.plan_tier || 'free') as 'free' | 'basic' | 'plus' | 'max';
  const hasAccess = canUseFeature(userTier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt feature={String(feature)} currentTier={userTier} />;
  }

  return null;
};