import { notFound } from "next/navigation";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getDocumentById } from "@/lib/admin/documents";
import { getSignatories } from "@/lib/signatories";
import { DokumenForm } from "../../dokumen-form";
import { updateDocumentAction } from "../../actions";

export const dynamic = "force-dynamic";

const dateToInput = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditDokumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [doc, signatories] = await Promise.all([
    getDocumentById(Number(id)),
    getSignatories(),
  ]);

  if (!doc) {
    notFound();
  }

  const boundAction = updateDocumentAction.bind(null, doc.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">
        Edit Dokumen
      </h1>
      <DokumenForm
        action={boundAction}
        initial={{
          number: doc.number,
          title: doc.title,
          signatory: doc.signatory,
          issuedAt: dateToInput(doc.issuedAt),
          fileUrl: doc.fileUrl ?? "",
          status: doc.status ?? "active",
          showDocument: doc.showDocument ?? false,
        }}
        signatories={signatories}
      />
    </div>
  );
}
