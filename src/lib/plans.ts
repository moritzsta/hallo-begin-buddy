export type PlanTier = 'free' | 'basic' | 'plus' | 'max';

export interface PlanLimits {
  smartUploadsPerMonth: number;
  storageGB: number;
  maxFileSizeMB: number;
  maxFiles: number;
  features: {
    advancedSearch: boolean;
    bulkOperations: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  priceEUR: number;
  priceLabel: string;
  limits: PlanLimits;
  popular?: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    priceEUR: 0,
    priceLabel: '0 €',
    limits: {
      smartUploadsPerMonth: 10,
      storageGB: 1,
      maxFileSizeMB: 5,
      maxFiles: 100,
      features: {
        advancedSearch: false,
        bulkOperations: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
  },
  basic: {
    tier: 'basic',
    name: 'Basic',
    priceEUR: 3.99,
    priceLabel: '3,99 €',
    limits: {
      smartUploadsPerMonth: 50,
      storageGB: 10,
      maxFileSizeMB: 25,
      maxFiles: 500,
      features: {
        advancedSearch: true,
        bulkOperations: false,
        apiAccess: false,
        prioritySupport: false,
      },
    },
  },
  plus: {
    tier: 'plus',
    name: 'Plus',
    priceEUR: 7.99,
    priceLabel: '7,99 €',
    popular: true,
    limits: {
      smartUploadsPerMonth: 200,
      storageGB: 50,
      maxFileSizeMB: 100,
      maxFiles: 2000,
      features: {
        advancedSearch: true,
        bulkOperations: true,
        apiAccess: true,
        prioritySupport: false,
      },
    },
  },
  max: {
    tier: 'max',
    name: 'Max',
    priceEUR: 12.99,
    priceLabel: '12,99 €',
    limits: {
      smartUploadsPerMonth: 1000,
      storageGB: 200,
      maxFileSizeMB: 2048,
      maxFiles: 10000,
      features: {
        advancedSearch: true,
        bulkOperations: true,
        apiAccess: true,
        prioritySupport: true,
      },
    },
  },
};

export const getPlanConfig = (tier: PlanTier): PlanConfig => {
  return PLAN_CONFIGS[tier];
};

export const canUseFeature = (userTier: PlanTier, feature: keyof PlanLimits['features']): boolean => {
  return PLAN_CONFIGS[userTier].limits.features[feature];
};

export const getUpgradeMessage = (feature: string, currentTier: PlanTier): string => {
  const nextTier = getNextTierForFeature(currentTier, feature);
  if (!nextTier) return 'Upgrade to access this feature';
  return `Upgrade to ${PLAN_CONFIGS[nextTier].name} to access ${feature}`;
};

const getNextTierForFeature = (currentTier: PlanTier, feature: string): PlanTier | null => {
  const tiers: PlanTier[] = ['free', 'basic', 'plus', 'max'];
  const currentIndex = tiers.indexOf(currentTier);
  
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tier = tiers[i];
    if (PLAN_CONFIGS[tier].limits.features[feature as keyof PlanLimits['features']]) {
      return tier;
    }
  }
  
  return null;
};