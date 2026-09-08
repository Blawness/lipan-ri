import MediaLibraryScreen from "@blawness/admin-kit/screens/media";
import { handleDeleteMedia } from "@blawness/admin-kit/screens/media/lib";
import { getMediaById } from "@blawness/admin-kit/admin/media";
import { requireUserId } from "@blawness/admin-kit/auth-helpers";
import { logAudit } from "@blawness/admin-kit";
import { countMediaReferences, arsipkanObjekR2 } from "@/lib/admin/media";

export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function deleteAction(formData: FormData) {
    "use server";
    const actorId = await requireUserId();
    const id = Number(formData.get("id"));
    const row =
      Number.isInteger(id) && id > 0
        ? await getMediaById(id).catch(() => null)
        : null;

    // Salin dulu ke trash/ selama berkasnya memang boleh dihapus. Kalau masih
    // dipakai, handleDeleteMedia di bawah yang menolak — jadi jangan bikin
    // salinan sampah untuk percobaan yang bakal ditolak.
    let arsip: string | null = null;
    if (row && (await countMediaReferences(row.url)) === 0) {
      arsip = await arsipkanObjekR2(row.url);
    }

    // Melempar NEXT_REDIRECT kalau berkasnya masih dirujuk, jadi logAudit di
    // bawah hanya jalan untuk penghapusan yang benar-benar terjadi.
    await handleDeleteMedia(formData, countMediaReferences);

    if (row) {
      logAudit({
        actorId,
        action: "media.delete",
        entityType: "media",
        entityId: row.id,
        metadata: { url: row.url, album: row.album, arsip },
      }).catch(() => {});
    }
  }

  return <MediaLibraryScreen deleteAction={deleteAction} searchParams={searchParams} />;
}
