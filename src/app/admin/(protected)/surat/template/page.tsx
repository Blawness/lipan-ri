import Link from "next/link";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/lib/admin/letter-templates";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplateListPage() {
  await requirePermission("letterTemplates.manage");
  const rows = await listTemplates();

  return (
    <div className="space-y-6">
      <ToastOnParam
        param="saved"
        messages={{
          created: "Jenis surat berhasil dibuat.",
          updated: "Jenis surat berhasil diperbarui.",
        }}
      />
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-navy-900">Jenis Surat</h1>
        <Button render={<Link href="/admin/surat/template/baru"><Plus className="h-4 w-4" /> Jenis Baru</Link>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-left text-xs uppercase text-navy-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Pola Nomor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada jenis surat.</td></tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="border-t border-navy-100">
                  <td className="px-4 py-3 font-medium text-navy-900">{t.name}</td>
                  <td className="px-4 py-3">{t.code}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.numberPattern}</td>
                  <td className="px-4 py-3">{t.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/admin/surat/template/${t.id}/edit`}><Pencil className="h-4 w-4" /></Link>} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
