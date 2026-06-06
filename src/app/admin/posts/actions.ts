"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { createPost, updatePost, deletePost, type PostInput } from "@/lib/admin/posts";

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  content: z.string().min(1, "Isi wajib diisi"),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.coerce.number().int().positive().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(["draft", "published"]),
});

export type PostFormState = { error?: string };

function parse(formData: FormData): PostInput {
  const data = schema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt") || undefined,
    featuredImage: formData.get("featuredImage") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    status: formData.get("status"),
  });
  return {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt ?? null,
    featuredImage: data.featuredImage ? data.featuredImage : null,
    categoryId: data.categoryId ?? null,
    isFeatured: !!data.isFeatured,
    status: data.status,
  };
}

export async function createPostAction(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const session = await requireUser();
  let input: PostInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await createPost(input, Number(session.user.id));
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=created");
}

export async function updatePostAction(id: number, _prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await requireUser();
  let input: PostInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await updatePost(id, input);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=updated");
}

export async function deletePostAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deletePost(id);
  revalidatePath("/admin/posts");
}
