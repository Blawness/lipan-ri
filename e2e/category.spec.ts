import { test, expect } from "@playwright/test";

test.describe("Halaman kategori", () => {
  test("menampilkan judul, jumlah artikel, dan daftar", async ({ page }) => {
    await page.goto("/category/berita");

    await expect(page.getByRole("heading", { level: 1, name: "Berita" })).toBeVisible();
    await expect(page.getByText(/\d+ artikel/)).toBeVisible();

    const cards = page.locator('main a[href^="/"]').filter({ has: page.locator("h2, h3") });
    expect(await cards.count()).toBeGreaterThan(0);
    expect(await cards.count()).toBeLessThanOrEqual(6); // PER_PAGE
  });

  test("paginasi: navigasi ke halaman berikutnya", async ({ page }) => {
    await page.goto("/category/berita");

    const next = page.getByRole("link", { name: /Selanjutnya/ });
    // kategori Berita punya 100 artikel → pasti ada paginasi
    await expect(next).toBeVisible();
    await next.click();

    await expect(page).toHaveURL(/\/category\/berita\?page=2/);
    await expect(page.getByText("Halaman 2 dari")).toBeVisible();

    await page.getByRole("link", { name: /Sebelumnya/ }).click();
    await expect(page).toHaveURL(/\/category\/berita\?page=1/);
  });

  test("kategori tidak dikenal menampilkan 404", async ({ page }) => {
    const res = await page.goto("/category/kategori-ngawur-xyz");
    expect(res?.status()).toBe(404);
  });
});
