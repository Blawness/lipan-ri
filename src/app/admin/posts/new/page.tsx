import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { PostForm } from "../post-form";
import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireUser();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Tambah Berita</h1>
      <PostForm
        action={createPostAction}
        categories={cats}
        initial={{ title: "", content: "", excerpt: "", featuredImage: "", categoryId: "", isFeatured: false, status: "draft" }}
      />
    </div>
  );
}
