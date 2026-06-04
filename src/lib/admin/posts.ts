import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { uniquePostSlug } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";

export type PostInput = {
  title: string;
  content: string; // raw HTML from editor; sanitized here
  excerpt?: string | null;
  featuredImage?: string | null;
  categoryId?: number | null;
  isFeatured: boolean;
  status: "draft" | "published";
};

export type ListPostsAdminParams = {
  q?: string;
  status?: "published" | "draft" | "all";
  page?: number;
  pageSize?: number;
};

export async function listPostsAdmin({
  q,
  status = "all",
  page = 1,
  pageSize = 15,
}: ListPostsAdminParams = {}) {
  const conditions = [];
  if (q && q.trim()) conditions.push(ilike(posts.title, `%${q.trim()}%`));
  if (status === "published" || status === "draft") {
    conditions.push(eq(posts.status, status));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        isFeatured: posts.isFeatured,
        updatedAt: posts.updatedAt,
        categoryName: categories.name,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(where)
      .orderBy(desc(posts.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(posts).where(where),
  ]);

  return { rows, total: Number(countResult[0]?.value ?? 0) };
}

export async function getPostByIdAdmin(id: number) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function createPost(input: PostInput, authorId: number) {
  const slug = await uniquePostSlug(input.title);
  const [row] = await db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      content: sanitizeHtml(input.content),
      excerpt: input.excerpt ?? null,
      featuredImage: input.featuredImage ?? null,
      categoryId: input.categoryId ?? null,
      isFeatured: input.isFeatured,
      status: input.status,
      authorId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id });
  return row.id;
}

export async function updatePost(id: number, input: PostInput) {
  const slug = await uniquePostSlug(input.title, id);
  // Stamp publishedAt the first time a post goes live; the public site orders
  // and filters by it, so a draft promoted to published must get a date.
  const [existing] = await db
    .select({ publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!existing) throw new Error(`Post ${id} tidak ditemukan`);
  const publishedAt =
    input.status === "published"
      ? (existing?.publishedAt ?? new Date())
      : existing?.publishedAt ?? null;

  await db
    .update(posts)
    .set({
      slug,
      title: input.title,
      content: sanitizeHtml(input.content),
      excerpt: input.excerpt ?? null,
      featuredImage: input.featuredImage ?? null,
      categoryId: input.categoryId ?? null,
      isFeatured: input.isFeatured,
      status: input.status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id));
}
