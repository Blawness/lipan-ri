import "dotenv/config";
import { db } from "../src/db";
import { posts, categories } from "../src/db/schema";
import { uploadImage } from "@blawness/admin-kit";

/**
 * Scrape semua berita dari lipan-ri.org (WordPress REST API) ke DB.
 * - Upsert by slug (aman dijalankan ulang).
 * - Featured image di-rehost ke Cloudflare R2 (key berita/<slug>.jpg).
 * - Kategori dipetakan by slug; yang belum ada dibuat.
 * - Gambar di dalam konten dibiarkan menunjuk ke lipan-ri.org.
 */

const SRC = "https://lipan-ri.org/wp-json/wp/v2";
const FEATURED_COUNT = 5; // berita terbaru yang ditandai is_featured

const NAMED: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#039;": "'", "&#39;": "'", "&nbsp;": " ", "&hellip;": "…",
  "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“",
  "&#8221;": "”", "&#8211;": "–", "&#8212;": "—",
  "&#8230;": "…",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&[a-z]+;/gi, (m) => NAMED[m] ?? m);
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

interface WpPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
}

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${SRC}/${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    if (res.status === 400 || res.status === 404) break; // habis halaman
    if (!res.ok) throw new Error(`${endpoint} page ${page}: HTTP ${res.status}`);
    const batch = (await res.json()) as T[];
    out.push(...batch);
    const total = Number(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= total) break;
    page++;
  }
  return out;
}

async function ensureCategories(): Promise<Map<number, number>> {
  const wpCats = await fetchAll<{ id: number; slug: string; name: string }>("categories");
  const ours = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const bySlug = new Map(ours.map((c) => [c.slug, c.id]));
  const map = new Map<number, number>();

  for (const wc of wpCats) {
    let id = bySlug.get(wc.slug);
    if (!id) {
      const [row] = await db
        .insert(categories)
        .values({ slug: wc.slug, name: decodeEntities(wc.name) })
        .returning({ id: categories.id });
      id = row.id;
      bySlug.set(wc.slug, id);
      console.log(`  + kategori baru: ${wc.slug}`);
    }
    map.set(wc.id, id);
  }
  return map;
}

async function rehostImage(slug: string, url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { url: r2url } = await uploadImage(buf, `berita/${slug}`);
    return r2url;
  } catch (e) {
    console.warn(`  ⚠️  gambar gagal (${slug}): ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("📡 Ambil kategori…");
  const catMap = await ensureCategories();

  console.log("📡 Ambil daftar berita…");
  const wpPosts = await fetchAll<WpPost>("posts?_embed=1");
  console.log(`   ${wpPosts.length} berita ditemukan.`);

  // urut terbaru → tentukan yang featured
  wpPosts.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const featuredSlugs = new Set(wpPosts.slice(0, FEATURED_COUNT).map((p) => p.slug));

  let done = 0;
  const BATCH = 4;
  for (let i = 0; i < wpPosts.length; i += BATCH) {
    const slice = wpPosts.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (wp) => {
        const featuredImage = await rehostImage(
          wp.slug,
          wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url
        );
        const categoryId = wp.categories?.length ? catMap.get(wp.categories[0]) ?? null : null;
        const values = {
          slug: wp.slug,
          title: decodeEntities(wp.title.rendered),
          content: wp.content.rendered,
          excerpt: stripTags(wp.excerpt.rendered).replace(/\s*\[…\]\s*$/, "").slice(0, 400),
          featuredImage,
          categoryId,
          status: "published" as const,
          isFeatured: featuredSlugs.has(wp.slug),
          publishedAt: new Date(wp.date),
          updatedAt: new Date(),
        };
        await db
          .insert(posts)
          .values(values)
          .onConflictDoUpdate({
            target: posts.slug,
            // jangan timpa featured_image lama dengan null kalau rehost gagal
            set: featuredImage ? values : { ...values, featuredImage: undefined },
          });
        done++;
        if (done % 10 === 0 || done === wpPosts.length)
          console.log(`   …${done}/${wpPosts.length}`);
      })
    );
  }

  console.log("🎉 Selesai. Total post di DB:", (await db.select({ id: posts.id }).from(posts)).length);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Scrape gagal:", e);
  process.exit(1);
});
