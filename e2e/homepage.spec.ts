import { test, expect } from "./fixtures";

test.describe("Beranda", () => {
  test("memuat hero, logo, dan tagline", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /LIPAN\s*RI/ })).toBeVisible();
    await expect(
      page.getByText(
        "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia",
        { exact: true }
      )
    ).toBeVisible();

    await expect(page.getByRole("banner").getByAltText("Logo LIPAN RI")).toBeVisible();
    await expect(page.getByRole("link", { name: "Tentang Kami" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Lihat Berita" })).toBeVisible();
  });

  test("menampilkan berita utama & terbaru beserta gambar", async ({ page }) => {
    // Berita feed is now at /berita (moved from homepage)
    await page.goto("/berita");

    const main = page.getByRole("main");
    await expect(page.getByRole("heading", { level: 2, name: "Berita Terbaru" })).toBeVisible();

    const articleLinks = main.locator('a[href^="/"]').filter({ has: page.locator("h2, h3") });
    expect(await articleLinks.count()).toBeGreaterThan(0);

    await expect(main.locator("img").first()).toBeVisible();
  });

  test("sidebar berita terbaru & kategori tampil", async ({ page }) => {
    // Sidebar is now at /berita (moved from homepage)
    await page.goto("/berita");
    const aside = page.getByRole("complementary");
    await expect(aside.getByRole("heading", { name: "Berita Terbaru" })).toBeVisible();
    await expect(aside.getByRole("heading", { name: "Kategori" })).toBeVisible();
  });

  test("footer tampil dengan tautan sosial", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      /youtube\.com/
    );
  });

  test("CTA Lihat Berita menuju halaman berita", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Lihat Berita" }).click();
    await expect(page).toHaveURL(/\/berita$/);
  });
});
