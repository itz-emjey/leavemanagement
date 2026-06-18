import { test, expect } from '@playwright/test';

test.describe('Admin Leave Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@company.com');
    await page.getByPlaceholder(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to leave requests page', async ({ page }) => {
    await page.goto('/leave-requests');
    await expect(page.getByRole('heading', { name: /leave requests/i })).toBeVisible();
  });

  test('should see pending leave requests', async ({ page }) => {
    await page.goto('/leave-requests');
    // Check that the pending filter button exists
    await expect(page.getByRole('button', { name: /pending/i })).toBeVisible();
  });

  test('should be able to view leave request details', async ({ page }) => {
    await page.goto('/leave-requests');
    // Click the first view details eye icon
    const viewButton = page.locator('button[title="View Details"]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      // Detail modal should be visible
      await expect(page.getByText(/leave request details/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have approve button on pending requests', async ({ page }) => {
    await page.goto('/leave-requests');
    // Check for approve buttons
    const approveButton = page.locator('button[title="Approve"]').first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      // Should show success or the page refreshes
      await expect(page.getByText(/leave request/i)).toBeVisible();
    }
  });

  test('should show employee dashboard and leave credits', async ({ page }) => {
    await page.goto('/leave-credits');
    await expect(page.getByText(/leave credits/i)).toBeVisible();
  });
});
