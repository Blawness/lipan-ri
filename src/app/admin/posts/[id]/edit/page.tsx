import { notFound } from "next/navigation";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getPostByIdAdmin } from "@/lib/admin/posts";
import { PostForm } from "../../post-form";
import { updatePostAction, type PostFormState } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();
  const post = await getPostByIdAdmin(postId);
  if (!post) notFound();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);

  const action = updatePostAction.bind(null, postId) as (prev: PostFormState, fd: FormData) => Promise<PostFormState>;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Edit Berita</h1>
      <PostForm
        action={action}
        categories={cats}
        initial={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt ?? "",
          featuredImage: post.featuredImage ?? "",
          categoryId: post.categoryId ? String(post.categoryId) : "",
          isFeatured: !!post.isFeatured,
          status: post.status ?? "draft",
        }}
      />
    </div>
  );
}
