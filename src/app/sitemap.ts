import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts, pages, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.lipan-ri.com";

  const allPosts = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(eq(posts.status, "published"));

  const allPages = await db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages);

  const allCategories = await db
    .select({ slug: categories.slug })
    .from(categories);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/galeri`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/kontak`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((p) => ({
    url: `${baseUrl}/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const pageRoutes: MetadataRoute.Sitemap = allPages.map((p) => ({
    url: `${baseUrl}/tentang-kami/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...pageRoutes, ...categoryRoutes];
}
