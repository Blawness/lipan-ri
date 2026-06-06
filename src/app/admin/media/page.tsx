import { MediaLibraryScreen } from "@blawness/admin-kit/screens/media";
import { handleDeleteMedia } from "@blawness/admin-kit/screens/media/lib";
import { countMediaReferences } from "@/lib/admin/media";

export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function deleteAction(formData: FormData) {
    "use server";
    await handleDeleteMedia(formData, countMediaReferences);
  }

  return <MediaLibraryScreen deleteAction={deleteAction} searchParams={searchParams} />;
}
