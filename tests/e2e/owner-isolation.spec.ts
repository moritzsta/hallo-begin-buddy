import { test, expect } from '@playwright/test';

/**
 * Owner Isolation (RLS) E2E Tests
 * Critical Security Test: User A cannot see User B's files
 */

test.describe('Owner Isolation (RLS)', () => {
  const userA = {
    email: `user-a-${Date.now()}@example.com`,
    password: 'TestPasswordA123!',
  };
  
  const userB = {
    email: `user-b-${Date.now()}@example.com`,
    password: 'TestPasswordB123!',
  };

  test('should isolate files between users', async ({ browser }) => {
    // Create two separate contexts for two users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    
    try {
      // User A: Signup and upload a file
      await pageA.goto('/auth');
      await pageA.fill('input[type="email"]', userA.email);
      await pageA.fill('input[type="password"]', userA.password);
      await pageA.click('button[type="submit"]');
      await expect(pageA).toHaveURL('/', { timeout: 10000 });
      
      // Upload file as User A
      await pageA.locator('input[type="file"]').setInputFiles({
        name: 'user-a-document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('User A Private Document'),
      });
      await expect(pageA.locator('text=/user-a-document/i')).toBeVisible({ timeout: 15000 });
      
      // User B: Signup
      await pageB.goto('/auth');
      await pageB.fill('input[type="email"]', userB.email);
      await pageB.fill('input[type="password"]', userB.password);
      await pageB.click('button[type="submit"]');
      await expect(pageB).toHaveURL('/', { timeout: 10000 });
      
      // User B should NOT see User A's file
      await expect(pageB.locator('text=/user-a-document/i')).not.toBeVisible({ timeout: 5000 });
      
      // Upload file as User B
      await pageB.locator('input[type="file"]').setInputFiles({
        name: 'user-b-document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('User B Private Document'),
      });
      await expect(pageB.locator('text=/user-b-document/i')).toBeVisible({ timeout: 15000 });
      
      // User A should NOT see User B's file
      await pageA.reload();
      await expect(pageA.locator('text=/user-b-document/i')).not.toBeVisible({ timeout: 5000 });
      
      // User A should still see their own file
      await expect(pageA.locator('text=/user-a-document/i')).toBeVisible({ timeout: 5000 });
      
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should isolate folders between users', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    
    try {
      // User A: Create folder
      await pageA.goto('/auth');
      await pageA.fill('input[type="email"]', userA.email);
      await pageA.fill('input[type="password"]', userA.password);
      await pageA.click('button[type="submit"]');
      await expect(pageA).toHaveURL('/', { timeout: 10000 });
      
      // Create folder as User A
      await pageA.click('button:has-text("Ordner"), button:has-text("Folder")');
      await pageA.fill('input[placeholder*="Name"], input[name="name"]', 'User A Private Folder');
      await pageA.click('button[type="submit"]');
      await expect(pageA.locator('text=/User A Private Folder/i')).toBeVisible({ timeout: 5000 });
      
      // User B: Login
      await pageB.goto('/auth');
      await pageB.fill('input[type="email"]', userB.email);
      await pageB.fill('input[type="password"]', userB.password);
      await pageB.click('button[type="submit"]');
      await expect(pageB).toHaveURL('/', { timeout: 10000 });
      
      // User B should NOT see User A's folder
      await expect(pageB.locator('text=/User A Private Folder/i')).not.toBeVisible({ timeout: 5000 });
      
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
