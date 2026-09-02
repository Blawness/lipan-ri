import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config.
 *
 * Default: builds & starts a local production server and tests localhost.
 * Override the target with `E2E_BASE_URL` to test a deployed environment
 * (preview/production) — required to catch *serverless-only* bugs (e.g. a
 * dependency that loads locally but not in Vercel's runtime). When E2E_BASE_URL
 * is set, the local webServer is skipped.
 *
 * Authenticated admin tests (e2e/admin-auth.spec.ts) run only when
 * `E2E_ADMIN_EMAIL` + `E2E_ADMIN_PASSWORD` are set; a `setup` project logs in
 * once and saves the session to e2e/.auth/admin.json.
 *
 * Jalankan: `pnpm e2e`. Contoh terhadap produksi:
 *   E2E_BASE_URL=https://www.lipan-ri.com E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… \
 *     pnpm e2e --project=admin
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const usingExternalTarget = !!process.env.E2E_BASE_URL;
const adminAuthFile = "e2e/.auth/admin.json";

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
    baseURL,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /admin\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: [/admin\.setup\.ts/, /admin-auth\.spec\.ts/, /surat\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin",
      testMatch: [/admin-auth\.spec\.ts/, /surat\.spec\.ts/],
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: adminAuthFile },
    },
  ],
  // Pakai production build lokal — jauh lebih stabil & cepat daripada dev.
  // Dilewati saat menargetkan URL ter-deploy (E2E_BASE_URL).
  ...(usingExternalTarget
    ? {}
    : {
        webServer: {
          command: "pnpm build && pnpm start",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
        },
      }),
});
