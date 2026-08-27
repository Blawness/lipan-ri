import type { Page, Response } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * E2E: legalitas dokumen via QR code
 *
 * Seed data expected (from src/db/seed.ts):
 *   - slug `test-certificate-001-a1b2c3` → active (valid)
 *   - slug `003-revoked-g7h8i9`       → revoked (tidak berlaku)
 *
 * Tests skipped if seed data not found (e.g. production DB without seed).
 */

/**
 * Halaman verifikasi memakai `force-dynamic`, sehingga `notFound()` tetap
 * dibalas HTTP 200 (soft-404) — status saja tidak cukup untuk mendeteksi seed
 * yang hilang. Deteksi lewat isi halaman yang ter-render.
 *
 * `page.goto` selesai saat event `load`, saat itu halaman masih menampilkan
 * fallback `loading.tsx` ("Memuat…"), jadi pemeriksaan langsung selalu balapan.
 * Tunggu dulu sampai salah satu hasil akhir muncul, baru putuskan.
 */
async function seedTidakAda(page: Page, res: Response | null): Promise<boolean> {
  if (!res || res.status() === 404) return true;

  const takAda = page.getByText("Halaman tidak ditemukan");
  const kartuDokumen = page.getByRole("heading", {
    name: /^Dokumen (Valid|Tidak Berlaku)$/,
  });
  await takAda.or(kartuDokumen).first().waitFor();

  return takAda.isVisible();
}

const VALID_SLUG = "test-certificate-001-a1b2c3";
const REVOKED_SLUG = "003-revoked-g7h8i9";
const NONEXISTENT_SLUG = "slug-ini-tidak-ada-samasekali-xyz";

test.describe("Verifikasi dokumen", () => {
  test("halaman verifikasi dokumen valid", async ({ page }) => {
    const res = await page.goto(`/verifikasi/${VALID_SLUG}`);
    if (await seedTidakAda(page, res)) {
      test.skip(true, "Seed document not found — run `pnpm db:seed` first");
      return;
    }

    await expect(
      page.getByRole("heading", { name: "Dokumen Valid" })
    ).toBeVisible();

    await expect(page.getByText("001/SK/LIPAN/VI/2025")).toBeVisible();
    await expect(page.getByText("Surat Keterangan Keanggotaan")).toBeVisible();
    await expect(
      page.getByText("Harun Prayitno, SE, SH, MH")
    ).toBeVisible();
    await expect(page.getByText("15 Juni 2025")).toBeVisible();
  });

  test("halaman verifikasi dokumen dicabut (revoked)", async ({ page }) => {
    const res = await page.goto(`/verifikasi/${REVOKED_SLUG}`);
    if (await seedTidakAda(page, res)) {
      test.skip(true, "Seed revoked document not found — run `pnpm db:seed` first");
      return;
    }

    await expect(
      page.getByRole("heading", { name: "Dokumen Tidak Berlaku" })
    ).toBeVisible();

    await expect(page.getByText("Dokumen ini telah dicabut")).toBeVisible();
    await expect(page.getByText("003/SK/LIPAN/VIII/2025")).toBeVisible();
  });

  test("slug tidak ditemukan → halaman not-found", async ({ page }) => {
    await page.goto(`/verifikasi/${NONEXISTENT_SLUG}`);
    // Next.js may return 200 for custom not-found pages in production;
    // verify the fallback page rendered (no "Dokumen Valid" or "Dokumen Tidak Berlaku")
    await expect(
      page.getByRole("heading", { name: "Dokumen Valid" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Dokumen Tidak Berlaku" })
    ).toHaveCount(0);
    // The page should NOT show document metadata
    await expect(page.getByText("Nomor Surat")).toHaveCount(0);
  });
});

test.describe("QR code API", () => {
  test("GET /api/verifikasi/[slug]/qr mengembalikan PNG", async ({ page }) => {
    const res = await page.goto(`/api/verifikasi/${VALID_SLUG}/qr`);
    // If seed data absent, endpoint may fail — skip gracefully
    if (!res || res.status() >= 500 || res.status() === 404) {
      test.skip(true, "Seed document not available for QR test");
      return;
    }

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");

    const buffer = await res.body();
    expect(buffer.length).toBeGreaterThan(0);

    // Verify it starts with PNG magic bytes
    const pngMagic = [0x89, 0x50, 0x4e, 0x47];
    expect(Array.from(buffer.slice(0, 4))).toEqual(pngMagic);
  });

  test("slug tidak dikenal → response dari QR endpoint", async ({ page }) => {
    const res = await page.goto(`/api/verifikasi/${NONEXISTENT_SLUG}/qr`);
    // QR generation always succeeds (it just encodes the URL), even for unknown slugs
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("Verifikasi dengan QR slug edge-cases", () => {
  test("verifikasi page menampilkan metadata lengkap", async ({ page }) => {
    const res = await page.goto(`/verifikasi/${VALID_SLUG}`);
    if (await seedTidakAda(page, res)) {
      test.skip(true, "Seed document not found");
      return;
    }

    // Scroll to top of card to ensure labels are visible
    await page.getByRole("heading", { name: "Dokumen Valid" }).scrollIntoViewIfNeeded();

    const labels = [
      "Nomor Surat",
      "Perihal",
      "Tanggal Terbit",
      "Penandatangan",
    ];
    for (const label of labels) {
      await expect(page.getByText(label)).toBeVisible();
    }

    await expect(
      page.getByText("Verifikasi oleh LIPAN RI")
    ).toBeVisible();
  });
});
