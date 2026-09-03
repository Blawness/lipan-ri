"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
// `rbac` diimpor sebagai nilai yang benar-benar dipakai, bukan sekadar
// `import "@/rbac"`: server action hidup di graf modul tersendiri, dan
// registrasi RBAC dari layout/instrumentation tidak selalu ikut ke sana —
// gejalanya "RBAC not configured" saat aksi jalan di instance yang dingin.
import { rbac } from "@/rbac";
import { slugify } from "@/lib/slug";
import {
  createPengurus,
  updatePengurus,
  deletePengurus,
  type PengurusInput,
} from "@/lib/admin/pengurus";

const schema = z.object({
  slot: z.string().optional(),
  slug: z.string().optional(),
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

/** Error Postgres asli (kode + constraint), tanpa perlu tipe driver spesifik. */
interface PgError {
  code?: string;
  constraint?: string;
}

function isPgError(e: unknown): e is PgError {
  return typeof e === "object" && e !== null && "code" in e;
}

/** Petakan pelanggaran unique index menjadi pesan berbahasa Indonesia. */
function pesanKesalahanSimpan(e: unknown): string {
  if (isPgError(e) && e.code === "23505") {
    const constraint = e.constraint ?? "";
    if (constraint.includes("pengurus_slot_unique")) {
      return "Posisi itu sudah diisi pengurus lain.";
    }
    if (constraint.includes("pengurus_slug_unique")) {
      return "Slug itu sudah dipakai.";
    }
    if (constraint.includes("pengurus_nomor_anggota_unique")) {
      return "Nomor anggota itu sudah dipakai.";
    }
  }
  return "Gagal menyimpan data.";
}

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

  const slugMentah = d.slug?.trim();
  const slug = slugify(slugMentah || d.nama) || slugify(d.nama);

  return {
    slot: d.slot?.trim() || null,
    slug,
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
  await rbac.requirePermission("pengurus.manage");
  let ok = false;
  try {
    const input = parse(formData);
    await createPengurus(input);
    ok = true;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.issues[0].message };
    }
    return { error: pesanKesalahanSimpan(e) };
  }
  if (ok) {
    revalidatePath("/admin/pengurus");
    revalidatePath("/tentang-kami/struktur");
    redirect("/admin/pengurus?saved=created");
  }
  return {};
}

export async function updatePengurusAction(
  id: number,
  _prev: PengurusFormState,
  formData: FormData,
): Promise<PengurusFormState> {
  await rbac.requirePermission("pengurus.manage");
  let ok = false;
  try {
    const input = parse(formData);
    await updatePengurus(id, input);
    ok = true;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.issues[0].message };
    }
    return { error: pesanKesalahanSimpan(e) };
  }
  if (ok) {
    revalidatePath("/admin/pengurus");
    revalidatePath("/tentang-kami/struktur");
    redirect("/admin/pengurus?saved=updated");
  }
  return {};
}

export async function deletePengurusAction(formData: FormData) {
  await rbac.requirePermission("pengurus.manage");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deletePengurus(id);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
}
