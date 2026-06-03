import { test as setup } from "@playwright/test";
import fs from "node:fs";

/**
 * Logs in once and saves the admin session for the `admin` project to reuse.
 * Requires E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD (an existing admin account).
 * Without them it writes an empty state and skips, so the suite still runs.
 */
const authFile = "e2e/.auth/admin.json";

setup("authenticate admin", async ({ page }) => {
  fs.mkdirSync("e2e/.auth", { recursive: true });

  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
    return;
  }

  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 20_000 });
  await page.context().storageState({ path: authFile });
});
