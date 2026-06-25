import { test, expect } from "./fixtures";

/**
 * Authenticated smoke tests: every admin page must render (not 500) for a
 * logged-in admin. This is the class of bug a server-only dependency failure
 * causes (e.g. jsdom not loading in serverless) — caught here by loading each
 * page and asserting a non-error status + the expected heading.
 *
 * Read-only: only navigates and asserts. No create/update/delete (the DB is
 * shared with production). Runs only when E2E_ADMIN_* creds are set; point
 * E2E_BASE_URL at a deployed env to catch serverless-only failures.
 */
const ADMIN_PAGES: ReadonlyArray<readonly [path: string, heading: RegExp]> = [
  ["/admin", /Dashboard/],
  ["/admin/posts", /Berita/],
  ["/admin/posts/new", /Tambah Berita/],
  ["/admin/media", /Galeri/],
  ["/admin/categories", /Kategori/],
  ["/admin/users", /User/],
  ["/admin/banners", /Banner/],
  ["/admin/dokumen", /Dokumen/],
  ["/admin/dokumen/baru", /Tambah Dokumen/],
];

test.describe("Admin (terotentikasi)", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL & E2E_ADMIN_PASSWORD to run authenticated admin tests",
  );

  for (const [path, heading] of ADMIN_PAGES) {
    test(`${path} memuat tanpa server error`, async ({ page }) => {
      const res = await page.goto(path);
      expect(
        res?.status() ?? 0,
        `${path} mengembalikan status error`,
      ).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    });
  }
});
