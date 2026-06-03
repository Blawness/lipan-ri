import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("wrong password shows error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "nobody@example.com");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.locator('p[role="alert"]')).toContainText("salah");
});
