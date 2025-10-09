import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * File Upload E2E Tests
 * Tests: Manual Upload, Smart Upload, Duplicate Detection
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('File Upload Flow', () => {
  const testUser = {
    email: `upload-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Signup and login
    await page.goto('/auth');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should upload file successfully', async ({ page }) => {
    // Create test file path
    const testFilePath = join(__dirname, '../fixtures/test-document.pdf');
    
    // Find and click upload button/area
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(testFilePath);
    
    // Wait for upload to complete
    await expect(page.locator('text=/erfolgreich|success|uploaded/i')).toBeVisible({ timeout: 15000 });
    
    // Verify file appears in list
    await expect(page.locator('text=/test-document/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle duplicate file upload', async ({ page }) => {
    const testFilePath = join(__dirname, '../fixtures/test-document.pdf');
    
    // Upload first time
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(testFilePath);
    await expect(page.locator('text=/erfolgreich|success/i')).toBeVisible({ timeout: 15000 });
    
    // Upload same file again
    await uploadInput.setInputFiles(testFilePath);
    
    // Should show duplicate warning/dialog
    await expect(page.locator('text=/duplikat|duplicate|bereits|already/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show upload progress', async ({ page }) => {
    const testFilePath = join(__dirname, '../fixtures/large-test-file.pdf');
    
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(testFilePath);
    
    // Should show progress bar or percentage
    await expect(page.locator('[role="progressbar"], text=/%|prozent/i')).toBeVisible({ timeout: 5000 });
  });
});
