import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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

export async function listPostsAdmin() {
  return db
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
    .orderBy(desc(posts.updatedAt));
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
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id));
}
