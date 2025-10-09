import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface PlanLimits {
  smartUploadsPerMonth: number;
  storageGB: number;
  maxFileSizeMB: number;
  maxFiles: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    smartUploadsPerMonth: 10,
    storageGB: 1,
    maxFileSizeMB: 5,
    maxFiles: 100,
  },
  basic: {
    smartUploadsPerMonth: 50,
    storageGB: 10,
    maxFileSizeMB: 25,
    maxFiles: 500,
  },
  plus: {
    smartUploadsPerMonth: 200,
    storageGB: 50,
    maxFileSizeMB: 100,
    maxFiles: 2000,
  },
  max: {
    smartUploadsPerMonth: 1000,
    storageGB: 200,
    maxFileSizeMB: 2048,
    maxFiles: 10000,
  },
};

export interface PlanCheckResult {
  allowed: boolean;
  planTier: string;
  limit: number;
  current: number;
  error?: string;
}

/**
 * Check if user has reached their smart upload limit for the current month
 */
export async function checkSmartUploadLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: string = 'free'
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  const today = new Date().toISOString().split('T')[0];

  // Get current month's usage
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', 'smart_upload')
    .eq('date', today)
    .single();

  const currentCount = usage?.count || 0;
  const allowed = currentCount < limits.smartUploadsPerMonth;

  return {
    allowed,
    planTier,
    limit: limits.smartUploadsPerMonth,
    current: currentCount,
    error: allowed ? undefined : 'Smart upload limit reached for your plan',
  };
}

/**
 * Check if user has reached their storage limit
 */
export async function checkStorageLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: string = 'free',
  additionalSizeBytes: number = 0
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;

  // Get current storage usage
  const { data: files } = await supabase
    .from('files')
    .select('size')
    .eq('owner_id', userId);

  const currentBytes = (files || []).reduce((sum, file) => sum + (file.size || 0), 0);
  const currentGB = currentBytes / (1024 * 1024 * 1024);
  const newTotalGB = (currentBytes + additionalSizeBytes) / (1024 * 1024 * 1024);
  const allowed = newTotalGB <= limits.storageGB;

  return {
    allowed,
    planTier,
    limit: limits.storageGB,
    current: Number(currentGB.toFixed(2)),
    error: allowed ? undefined : `Storage limit reached. Your plan allows ${limits.storageGB} GB`,
  };
}

/**
 * Check if file size exceeds plan limit
 */
export function checkFileSizeLimit(
  fileSizeBytes: number,
  planTier: string = 'free'
): PlanCheckResult {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const allowed = fileSizeMB <= limits.maxFileSizeMB;

  return {
    allowed,
    planTier,
    limit: limits.maxFileSizeMB,
    current: Number(fileSizeMB.toFixed(2)),
    error: allowed ? undefined : `File size exceeds limit. Your plan allows ${limits.maxFileSizeMB} MB per file`,
  };
}

/**
 * Check if user has reached their max files limit
 */
export async function checkMaxFilesLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: string = 'free'
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;

  // Get current file count
  const { count } = await supabase
    .from('files')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  const currentCount = count || 0;
  const allowed = currentCount < limits.maxFiles;

  return {
    allowed,
    planTier,
    limit: limits.maxFiles,
    current: currentCount,
    error: allowed ? undefined : `Maximum files limit reached. Your plan allows ${limits.maxFiles} files`,
  };
}

/**
 * Get user's plan tier from profile
 */
export async function getUserPlanTier(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', userId)
    .single();

  return profile?.plan_tier || 'free';
}

/**
 * Increment usage tracking for a feature
 */
export async function incrementUsageTracking(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Try to get existing record
  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('date', today)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('usage_tracking')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('date', today);
  } else {
    // Insert new record
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      feature,
      date: today,
      count: 1,
    });
  }
}
