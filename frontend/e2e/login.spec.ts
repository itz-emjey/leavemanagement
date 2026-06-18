import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should show validation errors
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@company.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/forgot password/i).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
