import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getSignatories } from "@/lib/signatories";
import { createSignatoryAction, deleteSignatoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PenandatanganPage() {
  await requireUser();
  const sigs = await getSignatories();

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-navy-900">
        Penandatangan
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Daftar nama penandatangan dokumen
      </p>

      <form
        action={createSignatoryAction}
        className="mt-6 flex items-end gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-sm"
      >
        <div className="flex-1 space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-navy-800">
            Nama
          </label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Harun Prayitno"
          />
        </div>
        <div className="w-28 space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-navy-800">
            Gelar
          </label>
          <Input id="title" name="title" placeholder="SE, SH, MH" />
        </div>
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </form>

      <ul className="mt-4 space-y-2">
        {sigs.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-navy-100 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium text-navy-900">
              {s.name}
              {s.title && (
                <span className="ml-1 text-muted-foreground">
                  , {s.title}
                </span>
              )}
            </span>
            <ConfirmDelete
              action={deleteSignatoryAction}
              id={s.id}
              title="Hapus penandatangan?"
              description={
                <>
                  <span className="font-medium text-navy-900">{s.name}</span>{" "}
                  akan dihapus dari daftar.
                </>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
