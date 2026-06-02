import { test, expect } from "@playwright/test";

test.describe("Halaman statis", () => {
  test("Arsip menampilkan daftar berita", async ({ page }) => {
    await page.goto("/arsip");
    await expect(page.getByRole("heading", { level: 1, name: /Arsip/ })).toBeVisible();
    const links = page.locator('main a[href^="/"]');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("Galeri tampil (foto atau pesan kosong)", async ({ page }) => {
    await page.goto("/galeri");
    await expect(page.getByRole("heading", { level: 1, name: "Galeri Foto" })).toBeVisible();
    // entah ada grid foto, atau pesan "Belum ada foto"
    const hasPhotos = (await page.locator("main img").count()) > 0;
    const hasEmpty = await page.getByText("Belum ada foto tersedia.").isVisible().catch(() => false);
    expect(hasPhotos || hasEmpty).toBeTruthy();
  });

  test("Kontak menampilkan info resmi", async ({ page }) => {
    await page.goto("/kontak");
    await expect(page.getByRole("heading", { level: 1, name: "Hubungi Kami" })).toBeVisible();
    await expect(page.getByText("dpn.lipanri@gmail.com")).toBeVisible();
    await expect(page.getByText(/Jakarta Pusat/)).toBeVisible();
  });
});

test.describe("Metadata & SEO", () => {
  test("favicon & apple-icon ter-link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="icon"]').first()).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });

  test("sitemap.xml tersedia", async ({ page }) => {
    const res = await page.goto("/sitemap.xml");
    expect(res?.status()).toBe(200);
    expect(await page.content()).toContain("lipan-ri.org");
  });

  test("robots.txt tersedia", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/sitemap/i);
  });

  test("judul halaman benar", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LIPAN RI/);
  });
});
