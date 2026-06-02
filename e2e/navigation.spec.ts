import { test, expect } from "./fixtures";

test.describe("Navigasi header (desktop)", () => {
  test("tautan utama berfungsi", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("banner");

    await nav.getByRole("link", { name: "Press Rilis" }).click();
    await expect(page).toHaveURL(/\/category\/press-rilis/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Press Rilis/i);

    await page.goto("/");
    await nav.getByRole("link", { name: "Galeri" }).click();
    await expect(page).toHaveURL(/\/galeri/);

    await page.goto("/");
    await nav.getByRole("link", { name: "Kontak" }).click();
    await expect(page).toHaveURL(/\/kontak/);
  });

  test("dropdown Tentang Kami membuka submenu & navigasi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("button", { name: /Tentang Kami/ }).click();

    const menuItem = page.getByRole("menuitem").filter({ hasText: "Visi Misi" });
    await expect(menuItem).toBeVisible();
    await menuItem.getByRole("link").click();

    await expect(page).toHaveURL(/\/tentang-kami\/visi-misi/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Visi Misi/i);
  });

  test("klik logo kembali ke beranda", async ({ page }) => {
    await page.goto("/kontak");
    await page.getByRole("banner").getByAltText("Logo LIPAN RI").click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: /LIPAN\s*RI/ })).toBeVisible();
  });
});
