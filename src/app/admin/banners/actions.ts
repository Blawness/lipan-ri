"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@blawness/admin-kit/auth-helpers";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanner,
  type BannerInput,
} from "@/lib/admin/banners";

function readInput(formData: FormData): BannerInput | null {
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!imageUrl) return null;
  const opt = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  return {
    imageUrl,
    title: opt("title"),
    subtitle: opt("subtitle"),
    buttonText: opt("buttonText"),
    buttonLink: opt("buttonLink"),
  };
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function createBannerAction(formData: FormData) {
  await requireAdmin();
  const input = readInput(formData);
  if (!input) redirect("/admin/banners?error=Gambar+banner+wajib+diunggah");
  await createBanner(input);
  revalidate();
  redirect("/admin/banners");
}

export async function updateBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const input = readInput(formData);
  if (!id || !input) redirect("/admin/banners?error=Data+banner+tidak+lengkap");
  await updateBanner(id, input!);
  revalidate();
  redirect("/admin/banners");
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await deleteBanner(id);
  revalidate();
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await toggleBanner(id);
  revalidate();
}

export async function reorderBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!id || (dir !== "up" && dir !== "down")) return;
  await reorderBanner(id, dir);
  revalidate();
}
