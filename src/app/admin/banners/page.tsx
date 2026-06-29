import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { listBanners } from "@/lib/admin/banners";
import { BannerForm } from "./banner-form";
import {
  deleteBannerAction,
  toggleBannerAction,
  reorderBannerAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { ArrowUp, ArrowDown, Eye, EyeOff, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("banners.manage");
  const rows = await listBanners();
  const { error } = await searchParams;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900">Banner</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} banner · tampil di hero halaman utama
      </p>

      {error && (
        <p
          className="mt-4 flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-6">
        <BannerForm />
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((b, i) => (
          <li
            key={b.id}
            className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail from R2 */}
            <img
              src={b.imageUrl}
              alt=""
              className="h-14 w-24 shrink-0 rounded-md object-cover ring-1 ring-navy-100"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-navy-900">
                {b.title || <span className="text-muted-foreground">(tanpa judul)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {b.isActive ? "Aktif" : "Nonaktif"}
                {b.buttonLink ? ` · ${b.buttonLink}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <form action={reorderBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="dir" value="up" />
                <Button size="sm" variant="outline" type="submit" aria-label="Naik" disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
              </form>
              <form action={reorderBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="dir" value="down" />
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  aria-label="Turun"
                  disabled={i === rows.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </form>
              <form action={toggleBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  aria-label={b.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {b.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </form>
              <ConfirmDelete
                action={deleteBannerAction}
                id={b.id}
                title="Hapus banner?"
                description={
                  b.title ? (
                    <>
                      Banner <span className="font-medium text-navy-900">{b.title}</span> akan dihapus.
                    </>
                  ) : (
                    "Banner ini akan dihapus permanen."
                  )
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
