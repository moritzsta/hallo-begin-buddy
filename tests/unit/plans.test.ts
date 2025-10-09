import { describe, it, expect } from 'vitest';
import { 
  getPlanConfig, 
  canUseFeature, 
  getNextTierForFeature,
  PlanTier 
} from '@/lib/plans';

/**
 * Unit Tests for Plan Configuration & Feature Gating
 */

describe('Plan Configuration', () => {
  it('should return correct config for each tier', () => {
    const freeConfig = getPlanConfig('free');
    expect(freeConfig.tier).toBe('free');
    expect(freeConfig.price).toBe(0);
    expect(freeConfig.smartUploadsPerMonth).toBe(10);
    
    const basicConfig = getPlanConfig('basic');
    expect(basicConfig.tier).toBe('basic');
    expect(basicConfig.price).toBe(3.99);
    expect(basicConfig.smartUploadsPerMonth).toBe(50);
    
    const plusConfig = getPlanConfig('plus');
    expect(plusConfig.tier).toBe('plus');
    expect(plusConfig.price).toBe(7.99);
    
    const maxConfig = getPlanConfig('max');
    expect(maxConfig.tier).toBe('max');
    expect(maxConfig.price).toBe(12.99);
  });

  it('should handle invalid tier gracefully', () => {
    const config = getPlanConfig('invalid' as PlanTier);
    expect(config.tier).toBe('free');
  });
});

describe('Feature Access', () => {
  it('should allow basic features for free tier', () => {
    expect(canUseFeature('free', 'advancedSearch')).toBe(false);
    expect(canUseFeature('free', 'bulkOperations')).toBe(false);
    expect(canUseFeature('free', 'apiAccess')).toBe(false);
  });

  it('should allow advanced search for basic+', () => {
    expect(canUseFeature('basic', 'advancedSearch')).toBe(true);
    expect(canUseFeature('plus', 'advancedSearch')).toBe(true);
    expect(canUseFeature('max', 'advancedSearch')).toBe(true);
  });

  it('should allow bulk operations for plus+', () => {
    expect(canUseFeature('free', 'bulkOperations')).toBe(false);
    expect(canUseFeature('basic', 'bulkOperations')).toBe(false);
    expect(canUseFeature('plus', 'bulkOperations')).toBe(true);
    expect(canUseFeature('max', 'bulkOperations')).toBe(true);
  });

  it('should allow priority support only for max', () => {
    expect(canUseFeature('free', 'prioritySupport')).toBe(false);
    expect(canUseFeature('basic', 'prioritySupport')).toBe(false);
    expect(canUseFeature('plus', 'prioritySupport')).toBe(false);
    expect(canUseFeature('max', 'prioritySupport')).toBe(true);
  });
});

describe('Upgrade Suggestions', () => {
  it('should suggest correct upgrade tier', () => {
    expect(getNextTierForFeature('free', 'advancedSearch')).toBe('basic');
    expect(getNextTierForFeature('free', 'bulkOperations')).toBe('plus');
    expect(getNextTierForFeature('basic', 'bulkOperations')).toBe('plus');
    expect(getNextTierForFeature('plus', 'prioritySupport')).toBe('max');
  });

  it('should return null if already have access', () => {
    expect(getNextTierForFeature('max', 'advancedSearch')).toBe(null);
    expect(getNextTierForFeature('plus', 'bulkOperations')).toBe(null);
  });
});
