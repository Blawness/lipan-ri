import { test, expect } from "@playwright/test";

test.describe("Verifikasi pengurus", () => {
  test("pengurus aktif tampil sebagai sah", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");

    await expect(
      page.getByRole("heading", { name: "Pengurus Aktif" }),
    ).toBeVisible();
    await expect(page.getByText("Cahya Puspita Rini, S.E.")).toBeVisible();
    await expect(page.getByText("Sekretaris Jenderal")).toBeVisible();
    await expect(page.getByText(/LIPAN-2026-\d{4}/)).toBeVisible();
    await expect(page.getByText(/s\.d\. sekarang|—/)).toBeVisible();
  });

  test("kontak tidak dibocorkan di halaman publik", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test("halaman tidak boleh diindeks", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("endpoint QR mengembalikan PNG", async ({ request }) => {
    const res = await request.get(
      "/api/verifikasi-pengurus/cahya-puspita-rini/qr",
    );
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(body.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(
      true,
    );
  });
});
