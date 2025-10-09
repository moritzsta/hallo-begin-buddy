import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests: Signup, Login, Logout, Protected Routes
 */

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  test('should signup new user successfully', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill signup form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Should redirect to main app
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Should see welcome elements
    await expect(page.locator('text=/willkommen|welcome/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to main app
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should logout user successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Logout via profile menu
    await page.click('[data-testid="profile-menu"], button:has-text("Profil"), button:has-text("Profile")');
    await page.click('text=/abmelden|logout/i');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Clear all cookies/storage
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/');
    
    // Should redirect to auth
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });
});
