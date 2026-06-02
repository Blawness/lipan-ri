import { test, expect, devices } from "./fixtures";

// Uji navigasi mobile pada viewport ponsel
test.use({ ...devices["Pixel 7"] });

test.describe("Navigasi mobile", () => {
  test("buka menu, expand submenu, lalu navigasi", async ({ page }) => {
    await page.goto("/");

    // tombol hamburger di header (satu-satunya tombol terlihat di header mobile)
    await page.getByRole("banner").getByRole("button").first().click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Galeri" })).toBeVisible();

    // expand "Tentang Kami"
    await sheet.getByRole("button", { name: /Tentang Kami/ }).click();
    const child = sheet.getByRole("link", { name: "Legalitas" });
    await expect(child).toBeVisible();
    await child.click();

    await expect(page).toHaveURL(/\/tentang-kami\/legalitas/);
    // sheet menutup setelah navigasi
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("tautan langsung di menu mobile berfungsi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("button").first().click();
    await page.getByRole("dialog").getByRole("link", { name: "Kontak" }).click();
    await expect(page).toHaveURL(/\/kontak/);
  });
});
