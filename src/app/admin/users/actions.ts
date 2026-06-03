"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { createUser, updateUserPassword, updateUserRole, deleteUser } from "@/lib/admin/users";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["admin", "editor"]),
});

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  const { email, name, password, role } = parsed.data;
  await createUser(email, name, password, role);
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  await updateUserPassword(id, password);
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "");
  if (!id || (role !== "admin" && role !== "editor")) return;
  await updateUserRole(id, role);
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (id === Number(session.user.id)) return; // never delete yourself
  await deleteUser(id);
  revalidatePath("/admin/users");
}
