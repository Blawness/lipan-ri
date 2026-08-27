import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getSignatories } from "@/lib/signatories";
import { DokumenForm } from "../dokumen-form";
import { createDocumentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDokumenPage() {
  await requireUser();
  const signatories = await getSignatories();
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">
        Tambah Dokumen
      </h1>
      <DokumenForm
        action={createDocumentAction}
        initial={{
          number: "",
          title: "",
          signatory: "",
          issuedAt: "",
          fileUrl: "",
          status: "active",
          showDocument: false,
        }}
        signatories={signatories}
      />
    </div>
  );
}
