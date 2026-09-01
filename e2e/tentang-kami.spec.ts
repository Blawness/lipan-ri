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
  // Nama & jabatan pengurus datang dari DB dan bisa berubah, jadi ekspektasi
  // diambil dari kartu yang diklik (aria-label = "Jabatan — Nama") alih-alih
  // ditulis ulang sebagai konstanta di test.
  const namaDari = (label: string) => label.split(" — ")[1];

  test("klik kartu membuka modal detail, chip relasi memindah seleksi", async ({
    page,
  }) => {
    await page.goto("/tentang-kami/struktur");

    // Belum ada yang dipilih → modal belum muncul.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const kartu = page.getByRole("button", { name: /^Sekretaris Jenderal —/ });
    const label = (await kartu.getAttribute("aria-label")) ?? "";
    // Baris terakhir kartu adalah nomor anggota.
    const baris = (await kartu.innerText()).trim().split("\n");
    const nomor = baris[baris.length - 1].trim();
    await kartu.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAccessibleName(label);
    await expect(modal).toContainText(namaDari(label));
    await expect(modal).toContainText(nomor);

    // Atasan langsung dan bawahan langsung ikut tampil.
    await expect(modal.getByText("Bertanggung jawab ke")).toBeVisible();
    await expect(modal.getByText("Membawahi")).toBeVisible();

    // Chip relasi memakai pemisah "·"; yang terakhir adalah bawahan langsung.
    const chip = modal.getByRole("button", { name: /·/ }).last();
    const [chipJabatan, chipNama] = (await chip.innerText())
      .split("·")
      .map((t) => t.replace(/\s+/g, " ").trim());
    await chip.click();
    // Judul modal (sr-only) ikut berganti → seleksi benar-benar berpindah.
    await expect(modal).toHaveAccessibleName(`${chipJabatan} — ${chipNama}`);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("di layar kecil kartu tetap bisa diketuk", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tentang-kami/struktur");

    await expect(page.getByText(/Geser & cubit untuk menjelajah/)).toBeVisible();
    const kartu = page.getByRole("button", { name: /^Bendahara Umum —/ });
    const label = (await kartu.getAttribute("aria-label")) ?? "";
    await kartu.click();
    await expect(page.getByRole("dialog")).toContainText(namaDari(label));
  });

  test("nama pengurus datang dari database, bukan konstanta", async ({ page }) => {
    await page.goto("/tentang-kami/struktur");
    // Slot yang terisi adalah button yang bisa diklik dan memuat nama pengurus —
    // bukan sekadar cek ketiadaan "—", yang juga bisa merah saat admin sah
    // menonaktifkan seorang pengurus (slot itu lalu menampilkan "—").
    const kartu = page.getByRole("button", { name: /Harun Prayitno/ });
    await expect(kartu).toBeVisible();
    await expect(kartu).toContainText(/^Ketua/);
  });
});
