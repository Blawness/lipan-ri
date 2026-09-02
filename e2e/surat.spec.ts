import { Pool } from "pg";
import { test, expect } from "./fixtures";

/**
 * E2E: modul surat.
 *
 * Dua kelompok test:
 *
 * 1. "Admin surat (baca saja)" — smoke test seperti admin-auth.spec.ts: tiap
 *    halaman admin/surat harus render tanpa server error. Read-only, aman
 *    dijalankan kapan saja E2E_ADMIN_* diisi.
 *
 * 2. "Alur penuh surat (menulis data)" — draft → ajukan → sahkan →
 *    verifikasi publik. Test ini MENULIS baris nyata ke `letter_templates`,
 *    `letters`, dan `documents` — tabel yang sama dipakai produksi
 *    (`/verifikasi/<slug>` bisa diakses publik). Karena itu ia hanya jalan
 *    kalau operator secara eksplisit mengizinkan lewat E2E_ALLOW_WRITES=1,
 *    dan ia membersihkan sendiri baris yang dibuatnya di `afterAll` — lihat
 *    komentar di sana untuk urutan penghapusan dan alasannya.
 */

const ADMIN_SURAT_PAGES: ReadonlyArray<readonly [path: string, heading: RegExp]> = [
  ["/admin/surat", /^Surat$/],
  ["/admin/surat/baru", /Surat Baru/],
  ["/admin/surat/template", /Jenis Surat/],
  ["/admin/surat/template/baru", /Jenis Surat Baru/],
];

test.describe("Admin surat (baca saja)", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL & E2E_ADMIN_PASSWORD to run authenticated admin tests",
  );

  for (const [path, heading] of ADMIN_SURAT_PAGES) {
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

test.describe("Alur penuh surat (menulis data)", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL ||
      !process.env.E2E_ADMIN_PASSWORD ||
      process.env.E2E_ALLOW_WRITES !== "1",
    "Test ini menulis baris nyata ke database bersama (letter_templates, letters, documents) — " +
      "set E2E_ALLOW_WRITES=1 (selain E2E_ADMIN_EMAIL/PASSWORD) untuk menjalankannya secara sadar.",
  );

  const runId = Date.now().toString(36);
  const templateCode = `E2E${runId}`.slice(0, 10);
  const templateName = `Surat Tugas E2E ${runId}`;
  const subject = `Penugasan Uji Otomatis ${runId}`;

  let pool: Pool | undefined;
  let letterId: number | undefined;
  let documentSlug: string | undefined;

  test.beforeAll(() => {
    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
  });

  test.afterAll(async () => {
    // Dibersihkan lewat koneksi Drizzle/pg langsung, bukan lewat aksi admin —
    // supaya pembersihan tidak bergantung pada UI yang mungkin sudah gagal
    // di tengah jalan. Urutannya penting:
    //   1. letters lebih dulu — letter_templates.id direferensikan RESTRICT
    //      oleh letters.templateId, jadi template tidak bisa dihapus selama
    //      masih ada surat yang menunjuknya. Menghapus baris letters juga
    //      men-cascade baris letter_logs miliknya.
    //   2. documents — dihapus lewat slug (bukan id) karena beberapa
    //      kegagalan di tengah test bisa membuat kita tidak pernah membaca
    //      documents.id. Menghapus baris documents men-cascade document_logs.
    //   3. letter_templates — aman dihapus sekarang karena baris letters yang
    //      menunjuknya sudah tidak ada.
    // Tiap langkah dibungkus try/catch sendiri: gagal di satu langkah (mis.
    // baris memang belum sempat dibuat) tidak boleh menggagalkan langkah lain.
    if (!pool) return;
    try {
      if (letterId) {
        const res = await pool.query("DELETE FROM letters WHERE id = $1", [letterId]);
        console.log(`[cleanup] letters id=${letterId}: ${res.rowCount} baris dihapus`);
      }
    } catch (e) {
      console.error(`[cleanup] gagal hapus letters id=${letterId}:`, e);
    }
    try {
      if (documentSlug) {
        const res = await pool.query("DELETE FROM documents WHERE slug = $1", [documentSlug]);
        console.log(`[cleanup] documents slug=${documentSlug}: ${res.rowCount} baris dihapus`);
      }
    } catch (e) {
      console.error(`[cleanup] gagal hapus documents slug=${documentSlug}:`, e);
    }
    try {
      const res = await pool.query("DELETE FROM letter_templates WHERE code = $1", [templateCode]);
      console.log(`[cleanup] letter_templates code=${templateCode}: ${res.rowCount} baris dihapus`);
    } catch (e) {
      console.error(`[cleanup] gagal hapus letter_templates code=${templateCode}:`, e);
    }
    await pool.end();
  });

  test("draft dapat dibuat, diajukan, disahkan, dan terverifikasi", async ({ page }) => {
    // 1. Buat jenis surat.
    await page.goto("/admin/surat/template/baru");
    await page.getByLabel("Nama Jenis Surat").fill(templateName);
    await page.getByLabel("Kode").fill(templateCode);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/surat\/template/);
    await expect(page.getByText(templateName)).toBeVisible();

    // 2. Buat draft surat dari jenis di atas.
    await page.goto("/admin/surat/baru");
    await page.getByLabel("Jenis Surat").selectOption({ label: templateName });
    await page.getByLabel("Perihal").fill(subject);
    await page.getByLabel("Penandatangan").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Simpan Draft" }).click();
    await page.waitForURL(/\/admin\/surat\/\d+/);

    const match = page.url().match(/\/admin\/surat\/(\d+)/);
    expect(match).not.toBeNull();
    letterId = Number(match![1]);

    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    // 3. Ajukan untuk pengesahan.
    await page.getByRole("button", { name: "Ajukan untuk Pengesahan" }).click();
    await expect(page.getByText("Menunggu Pengesahan")).toBeVisible();

    // 4. Sahkan — admin punya jalan darurat pengesahan, jadi satu sesi cukup.
    await page.getByRole("button", { name: "Sahkan & Terbitkan" }).click();
    await expect(page.getByText("Terbit", { exact: true })).toBeVisible();

    // 5. Verifikasi publik.
    const verifikasi = page.getByRole("link", { name: "Halaman Verifikasi" });
    const href = await verifikasi.getAttribute("href");
    expect(href).toContain("/verifikasi/");
    documentSlug = href!.split("/").filter(Boolean).pop();

    await page.goto(href!);
    await expect(page.getByRole("heading", { name: "Dokumen Valid" })).toBeVisible();
  });
});
