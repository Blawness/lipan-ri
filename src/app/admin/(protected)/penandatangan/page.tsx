import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getSignatories } from "@/lib/signatories";
import { createSignatoryAction, deleteSignatoryAction, updateSignatoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PenandatanganPage() {
  await requireUser();
  const [sigs, userOptions] = await Promise.all([
    getSignatories(),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.email)),
  ]);

  return (
    <div className="max-w-3xl">
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
        <div className="w-40 space-y-1.5">
          <label htmlFor="position" className="text-sm font-medium text-navy-800">
            Jabatan
          </label>
          <Input id="position" name="position" placeholder="Ketua Umum" />
        </div>
        <div className="w-48 space-y-1.5">
          <label htmlFor="userId" className="text-sm font-medium text-navy-800">
            Akun Pengesah
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue=""
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm"
          >
            <option value="">— belum ditautkan —</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
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
            <form action={updateSignatoryAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <Input
                name="position"
                defaultValue={s.position ?? ""}
                placeholder="Jabatan"
                className="h-8 w-40"
              />
              <select
                name="userId"
                defaultValue={s.userId ?? ""}
                className="h-8 w-44 rounded-md border border-navy-200 bg-white px-2 text-sm"
              >
                <option value="">— belum ditautkan —</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="outline">Simpan</Button>
            </form>
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
