import { test, expect } from "@playwright/test";

test.describe("Detail berita", () => {
  test("klik kartu berita membuka artikel lengkap", async ({ page }) => {
    await page.goto("/category/berita");

    const firstCard = page
      .locator('main a[href^="/"]')
      .filter({ has: page.locator("h2, h3") })
      .first();
    const title = (await firstCard.locator("h2, h3").first().innerText()).trim();
    await firstCard.click();

    // pindah ke halaman artikel (bukan kategori/tentang)
    await expect(page).not.toHaveURL(/\/category\//);
    await expect(page.locator("article")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title.slice(0, 20));

    // breadcrumb ada
    await expect(page.getByRole("link", { name: "Beranda" })).toBeVisible();

    // konten artikel ada
    await expect(page.locator("article .prose")).toBeVisible();
  });

  test("artikel menampilkan berita lainnya (terkait)", async ({ page }) => {
    await page.goto("/category/berita");
    await page
      .locator('main a[href^="/"]')
      .filter({ has: page.locator("h2, h3") })
      .first()
      .click();

    await expect(page.getByRole("heading", { name: "Berita Lainnya" })).toBeVisible();
  });

  test("slug tidak dikenal menampilkan 404", async ({ page }) => {
    const res = await page.goto("/slug-yang-tidak-ada-12345");
    expect(res?.status()).toBe(404);
  });
});
