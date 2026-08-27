import { test, expect } from "./fixtures";

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
    ["/tentang-kami/profil-ketua", /Harun Prayitno/],
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
    await page.getByRole("main").getByRole("link", { name: /Struktur Organisasi/ }).click();
    await expect(page).toHaveURL(/\/tentang-kami\/struktur/);
  });
});

test.describe("Struktur — kartu bisa diklik", () => {
  test("klik kartu membuka panel detail, chip relasi memindah seleksi", async ({ page }) => {
    await page.goto("/tentang-kami/struktur");

    // Belum ada yang dipilih → panel belum muncul.
    await expect(page.getByRole("region", { name: /^Detail / })).toHaveCount(0);

    await page.getByRole("button", { name: /^Sekretaris Jenderal/ }).click();

    const panel = page.getByRole("region", { name: "Detail Sekretaris Jenderal" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Cahya Puspita Rini");
    await expect(panel).toContainText(/administrasi dan kesekretariatan/i);

    // Atasan langsung dan bawahan langsung ikut tampil.
    await expect(panel.getByText("Bertanggung jawab ke")).toBeVisible();
    await expect(panel.getByRole("button", { name: /Ketua/ })).toBeVisible();

    // Chip bawahan memindahkan seleksi ke pengurus itu.
    await panel.getByRole("button", { name: /SDM dan Umum/ }).click();
    await expect(page.getByRole("region", { name: "Detail SDM dan Umum" })).toContainText(
      "Ruswondo Awidjan",
    );

    await page.getByRole("button", { name: "Tutup detail" }).click();
    await expect(page.getByRole("region", { name: /^Detail / })).toHaveCount(0);
  });

  test("di layar kecil kartu tetap bisa diketuk", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tentang-kami/struktur");

    await expect(page.getByText(/Geser & cubit untuk menjelajah/)).toBeVisible();
    await page.getByRole("button", { name: /^Bendahara Umum/ }).click();
    await expect(page.getByRole("region", { name: "Detail Bendahara Umum" })).toContainText(
      "Velia Dwi Yulianti",
    );
  });
});
