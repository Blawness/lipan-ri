"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import {
  createPengurus,
  updatePengurus,
  deletePengurus,
  type PengurusInput,
} from "@/lib/admin/pengurus";

const schema = z.object({
  slot: z.string().optional(),
  slug: z.string().min(1, "Slug wajib diisi"),
  nomorAnggota: z.string().min(1, "Nomor anggota wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  foto: z.string().optional(),
  deskripsi: z.string().optional(),
  email: z.string().optional(),
  telepon: z.string().optional(),
  status: z.enum(["aktif", "nonaktif"]),
  mulaiMenjabat: z.string().min(1, "Tanggal mulai menjabat wajib diisi"),
  selesaiMenjabat: z.string().optional(),
});

export type PengurusFormState = { error?: string };

function parse(formData: FormData): PengurusInput {
  const d = schema.parse({
    slot: formData.get("slot") || undefined,
    slug: formData.get("slug"),
    nomorAnggota: formData.get("nomorAnggota"),
    nama: formData.get("nama"),
    jabatan: formData.get("jabatan"),
    foto: formData.get("foto") || undefined,
    deskripsi: formData.get("deskripsi") || undefined,
    email: formData.get("email") || undefined,
    telepon: formData.get("telepon") || undefined,
    status: formData.get("status") || "aktif",
    mulaiMenjabat: formData.get("mulaiMenjabat"),
    selesaiMenjabat: formData.get("selesaiMenjabat") || undefined,
  });

  return {
    slot: d.slot?.trim() || null,
    slug: d.slug.trim(),
    nomorAnggota: d.nomorAnggota.trim(),
    nama: d.nama.trim(),
    jabatan: d.jabatan.trim(),
    foto: d.foto?.trim() || null,
    deskripsi: d.deskripsi?.trim() || null,
    email: d.email?.trim() || null,
    telepon: d.telepon?.trim() || null,
    status: d.status,
    mulaiMenjabat: new Date(d.mulaiMenjabat),
    selesaiMenjabat: d.selesaiMenjabat ? new Date(d.selesaiMenjabat) : null,
  };
}

export async function createPengurusAction(
  _prev: PengurusFormState,
  formData: FormData,
): Promise<PengurusFormState> {
  await requireUser();
  let input: PengurusInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await createPengurus(input);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
  redirect("/admin/pengurus?saved=created");
}

export async function updatePengurusAction(
  id: number,
  _prev: PengurusFormState,
  formData: FormData,
): Promise<PengurusFormState> {
  await requireUser();
  let input: PengurusInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await updatePengurus(id, input);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
  redirect("/admin/pengurus?saved=updated");
}

export async function deletePengurusAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deletePengurus(id);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
}
