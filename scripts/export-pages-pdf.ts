import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.EXPORT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "pdf-export");
const ARTICLES_DIR = path.join(OUT_DIR, "artikel");

const STATIC_ROUTES = ["/", "/berita", "/arsip", "/galeri", "/kontak", "/tentang-kami"];

// A4 in PDF points (1pt = 1/72in)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function slugify(pathname: string) {
  if (pathname === "/") return "beranda";
  return pathname.replace(/^\//, "").replace(/\//g, "_");
}

// A post article route is a bare top-level slug, e.g. /some-article-title
// (as opposed to /berita, /tentang-kami/x, /category/x, etc.)
function isArticleRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 1 && !STATIC_ROUTES.includes(pathname);
}

async function fetchSitemapRoutes(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  return urls.map((u) => new URL(u).pathname);
}

// Tiles a tall desktop screenshot across as many A4 pages as needed, edge to
// edge, so the PDF matches the real desktop view instead of a reflowed print
// stylesheet.
async function tiledPdfFromScreenshot(pngBuffer: Buffer): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(pngBuffer);
  const scale = A4_WIDTH / img.width;
  const scaledHeight = img.height * scale;
  const numPages = Math.max(1, Math.ceil(scaledHeight / A4_HEIGHT));

  for (let i = 0; i < numPages; i++) {
    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(img, {
      x: 0,
      y: A4_HEIGHT * (i + 1) - scaledHeight,
      width: A4_WIDTH,
      height: scaledHeight,
    });
  }
  return doc;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(ARTICLES_DIR, { recursive: true });

  const sitemapRoutes = await fetchSitemapRoutes();
  const allRoutes = [...new Set([...STATIC_ROUTES, ...sitemapRoutes])];

  console.log(`Found ${allRoutes.length} public routes to export.`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const merged = await PDFDocument.create();
  let mergedCount = 0;

  for (const route of allRoutes) {
    const url = `${BASE_URL}${route}`;
    const isArticle = isArticleRoute(route);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      const screenshot = await page.screenshot({ fullPage: true, type: "png" });
      const tiled = await tiledPdfFromScreenshot(screenshot);

      if (isArticle) {
        const file = path.join(ARTICLES_DIR, `${slugify(route)}.pdf`);
        await writeFile(file, await tiled.save());
        console.log(`OK   ${route} -> ${path.relative(process.cwd(), file)}`);
      } else {
        const copiedPages = await merged.copyPages(tiled, tiled.getPageIndices());
        copiedPages.forEach((p) => merged.addPage(p));
        mergedCount++;
        console.log(`OK   ${route} -> (merged into halaman-utama.pdf)`);
      }
    } catch (err) {
      console.error(`FAIL ${route}:`, (err as Error).message);
    }
  }

  await browser.close();

  const mergedPath = path.join(OUT_DIR, "halaman-utama.pdf");
  await writeFile(mergedPath, await merged.save());

  console.log(`Done.`);
  console.log(`- Merged pages (${mergedCount} routes): ${mergedPath}`);
  console.log(`- Individual articles: ${ARTICLES_DIR}`);
}

main();
