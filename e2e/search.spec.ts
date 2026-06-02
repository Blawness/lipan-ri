import { test, expect } from "./fixtures";

test.describe("Pencarian", () => {
  test("cari dari header menampilkan hasil", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("banner").getByPlaceholder("Cari...");
    await input.fill("sertifikat");
    await input.press("Enter");

    await expect(page).toHaveURL(/\/search\?q=sertifikat/);
    await expect(page.getByRole("heading", { name: "Pencarian" })).toBeVisible();
    await expect(page.getByText(/hasil untuk/)).toBeVisible();

    // ada minimal satu kartu hasil
    const results = page.locator('main a[href^="/"]').filter({ has: page.locator("h2, h3") });
    expect(await results.count()).toBeGreaterThan(0);
  });

  test("kata kunci tanpa hasil menampilkan pesan kosong", async ({ page }) => {
    await page.goto("/search?q=zxqwlipanxyz123");
    await expect(
      page.getByText(/Tidak ada hasil untuk/)
    ).toBeVisible();
  });

  test("pencarian kosong tidak menampilkan hasil", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: "Pencarian" })).toBeVisible();
    await expect(page.getByText(/hasil untuk/)).toHaveCount(0);
  });
});
