import { test, expect } from "@playwright/test";

test.describe("Tentang Kami", () => {
  test("halaman indeks menampilkan 6 menu", async ({ page }) => {
    await page.goto("/tentang-kami");
    await expect(page.getByRole("heading", { level: 1, name: "Tentang Kami" })).toBeVisible();
    for (const t of [
      "Profil Lembaga",
      "Profil Ketua",
      "Visi Misi & Motto",
      "Struktur Organisasi",
      "Legalitas Lembaga",
      "Arti Lambang",
    ]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
  });

  // setiap renderer berbasis JSON harus tampil dengan benar
  const pages: [string, RegExp][] = [
    ["/tentang-kami/sekilas-lipan-ri", /Profil Lembaga/],
    ["/tentang-kami/profil-ketua", /Ketua/],
    ["/tentang-kami/visi-misi", /Visi Misi/],
    ["/tentang-kami/struktur", /Struktur Organisasi/],
    ["/tentang-kami/legalitas", /Legalitas/],
    ["/tentang-kami/arti-lambang", /Arti Lambang/],
  ];

  for (const [url, heading] of pages) {
    test(`renderer ${url} tampil`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    });
  }

  test("dari indeks bisa klik ke salah satu halaman", async ({ page }) => {
    await page.goto("/tentang-kami");
    await page.getByRole("link", { name: /Struktur Organisasi/ }).click();
    await expect(page).toHaveURL(/\/tentang-kami\/struktur/);
  });
});
