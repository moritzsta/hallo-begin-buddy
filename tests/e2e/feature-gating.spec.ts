import { test, expect } from '@playwright/test';

/**
 * Feature Gating E2E Tests
 * Tests: Free tier limitations, Plan-based feature access
 */

test.describe('Feature Gating', () => {
  const freeUser = {
    email: `free-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Signup as free user
    await page.goto('/auth');
    await page.fill('input[type="email"]', freeUser.email);
    await page.fill('input[type="password"]', freeUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show plan badge for free user', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    
    // Should see Free plan badge
    await expect(page.locator('text=/free/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should limit file size for free users', async ({ page }) => {
    // Try to upload file larger than 5MB (Free tier limit)
    const largeFile = {
      name: 'large-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(6 * 1024 * 1024), // 6 MB
    };
    
    await page.locator('input[type="file"]').setInputFiles(largeFile);
    
    // Should show size limit error
    await expect(page.locator('text=/größe|size|limit|upgrade/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show upgrade prompt for premium features', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    
    // Look for upgrade prompts or locked features
    const upgradeButtons = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")');
    
    // Should have at least one upgrade option visible
    await expect(upgradeButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('should track smart upload usage', async ({ page }) => {
    // Navigate to settings to check usage
    await page.goto('/settings');
    
    // Should show smart upload usage counter
    await expect(page.locator('text=/smart.*upload/i')).toBeVisible({ timeout: 5000 });
    
    // Should show limit (e.g., "10 / 10" or "0 / 10")
    await expect(page.locator('text=/\d+\s*\/\s*\d+/i')).toBeVisible({ timeout: 5000 });
  });
});
