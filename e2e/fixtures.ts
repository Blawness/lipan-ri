import { test as base } from "@playwright/test";

/**
 * `goto` default ke `domcontentloaded` — halaman berita memuat banyak gambar
 * eksternal (R2 / lipan-ri.org); menunggu event `load` penuh bikin flaky.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const original = page.goto.bind(page);
    page.goto = ((url, opts) =>
      original(url, { waitUntil: "domcontentloaded", ...opts })) as typeof page.goto;
    await use(page);
  },
});

export { expect, devices } from "@playwright/test";
