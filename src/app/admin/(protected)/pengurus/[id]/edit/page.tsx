import { notFound } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { getPengurusById } from "@/lib/admin/pengurus";
import { updatePengurusAction } from "../../actions";
import { PengurusForm } from "../../pengurus-form";

export const dynamic = "force-dynamic";

const tanggal = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function PengurusEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("pengurus.manage");
  const { id } = await params;
  const p = await getPengurusById(Number(id));
  if (!p) notFound();

  const action = updatePengurusAction.bind(null, p.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900">
        Ubah Pengurus
      </h1>
      <div className="mt-6">
        <PengurusForm
          action={action}
          initial={{
            slot: p.slot ?? "",
            slug: p.slug,
            nomorAnggota: p.nomorAnggota,
            nama: p.nama,
            jabatan: p.jabatan,
            foto: p.foto ?? "",
            deskripsi: p.deskripsi ?? "",
            email: p.email ?? "",
            telepon: p.telepon ?? "",
            status: (p.status ?? "aktif") as "aktif" | "nonaktif",
            mulaiMenjabat: tanggal(p.mulaiMenjabat),
            selesaiMenjabat: tanggal(p.selesaiMenjabat),
          }}
        />
      </div>
    </div>
  );
}
