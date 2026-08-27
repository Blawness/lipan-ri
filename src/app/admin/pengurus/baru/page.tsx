import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { suggestNomorAnggota } from "@/lib/admin/pengurus";
import { createPengurusAction } from "../actions";
import { PengurusForm } from "../pengurus-form";

export const dynamic = "force-dynamic";

export default async function PengurusBaruPage() {
  await requireUser();
  const nomorAnggota = await suggestNomorAnggota();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900">
        Tambah Pengurus
      </h1>
      <div className="mt-6">
        <PengurusForm
          action={createPengurusAction}
          initial={{
            slot: "",
            slug: "",
            nomorAnggota,
            nama: "",
            jabatan: "",
            foto: "",
            deskripsi: "",
            email: "",
            telepon: "",
            status: "aktif",
            mulaiMenjabat: new Date().toISOString().slice(0, 10),
            selesaiMenjabat: "",
          }}
        />
      </div>
    </div>
  );
}
