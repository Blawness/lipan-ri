import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — menjalankan dev server lalu menguji alur real user.
 * Jalankan: `pnpm e2e` (atau `pnpm e2e:ui` untuk mode interaktif).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 3,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Pakai production build: jauh lebih stabil & cepat daripada dev
  // (tanpa compile per-route, tanpa double-render) — menghindari 500 acak.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
