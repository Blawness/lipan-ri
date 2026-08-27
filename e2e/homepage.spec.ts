import { test, expect } from "./fixtures";

test.describe("Beranda", () => {
  test("memuat hero, logo, dan navigasi", async ({ page }) => {
    await page.goto("/");

    // Hero kini digerakkan tabel `banners`: judul tiap slide berasal dari data,
    // jadi yang dijamin hanyalah ada satu slide ber-<h1> yang tampil. Teks
    // tagline diuji di footer, satu-satunya tempat ia selalu ada.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await expect(page.getByRole("banner").getByAltText("Logo LIPAN RI")).toBeVisible();
    // "Tentang Kami" di header adalah trigger dropdown (button), bukan link.
    const nav = page.getByRole("banner");
    await expect(nav.getByRole("button", { name: "Tentang Kami" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Berita", exact: true })).toBeVisible();
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
    await expect(
      footer.getByText(
        /Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia/
      )
    ).toBeVisible();
  });

  test("CTA Semua berita menuju halaman berita", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Semua berita" }).click();
    await expect(page).toHaveURL(/\/berita$/);
  });
});
