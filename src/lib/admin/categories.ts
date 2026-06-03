import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { slugify } from "@/lib/slug";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function createCategory(name: string, description: string | null) {
  await db.insert(categories).values({ name, slug: slugify(name), description });
}

export async function updateCategory(id: number, name: string, description: string | null) {
  await db.update(categories).set({ name, slug: slugify(name), description }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
}
