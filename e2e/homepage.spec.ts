import { test, expect } from "@playwright/test";

test.describe("Beranda", () => {
  test("memuat hero, logo, dan tagline", async ({ page }) => {
    await page.goto("/");

    // Hero
    await expect(page.getByRole("heading", { level: 1, name: /LIPAN\s*RI/ })).toBeVisible();
    await expect(
      page.getByText("Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia")
    ).toBeVisible();

    // Logo di header
    await expect(page.getByRole("banner").getByAltText("Logo LIPAN RI")).toBeVisible();

    // CTA hero
    await expect(page.getByRole("link", { name: "Tentang Kami" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Lihat Arsip" })).toBeVisible();
  });

  test("menampilkan berita utama & terbaru beserta gambar", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Berita Terbaru" })).toBeVisible();

    // minimal ada beberapa kartu berita yang mengarah ke artikel
    const articleLinks = page.locator('main a[href^="/"]').filter({ has: page.locator("h2, h3") });
    expect(await articleLinks.count()).toBeGreaterThan(0);

    // featured image utama tampil
    await expect(page.locator("main img").first()).toBeVisible();
  });

  test("sidebar berita terbaru & kategori tampil", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Berita Terbaru" }).last()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kategori" })).toBeVisible();
  });

  test("footer tampil dengan tautan & sosial", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      /youtube\.com/
    );
  });

  test("CTA hero menuju halaman profil lembaga", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Lihat Arsip" }).click();
    await expect(page).toHaveURL(/\/arsip$/);
  });
});
