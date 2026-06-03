import { requireAdmin } from "@/lib/auth-helpers";
import { listUsers } from "@/lib/admin/users";
import { createUserAction, resetPasswordAction, setRoleAction, deleteUserAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const rows = await listUsers();
  const { error } = await searchParams;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">User</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <form action={createUserAction} className="grid grid-cols-2 gap-2 mb-6 bg-white p-4 rounded-lg ring-1 ring-navy-100">
        <Input name="name" placeholder="Nama" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password (min 8)" required />
        <select name="role" className="h-9 rounded-md border border-navy-200 px-2 text-sm">
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" className="col-span-2">Tambah User</Button>
      </form>

      <ul className="bg-white rounded-lg ring-1 ring-navy-100 divide-y divide-navy-50">
        {rows.map((u) => (
          <li key={u.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-900">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <form action={setRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role ?? "editor"} className="h-8 rounded-md border border-navy-200 px-2 text-xs">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" variant="outline" type="submit">Set Role</Button>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <form action={resetPasswordAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <Input name="password" type="password" placeholder="Password baru" className="h-8 w-40" />
                <Button size="sm" variant="outline" type="submit">Reset Password</Button>
              </form>
              {u.id !== Number(session.user.id) && (
                <form action={deleteUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <Button size="sm" variant="outline" type="submit">Hapus</Button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
