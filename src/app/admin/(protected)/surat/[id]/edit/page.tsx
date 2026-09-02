import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { getLetterDetail } from "@/lib/admin/letters";
import { listActiveTemplates, getTemplateById } from "@/lib/admin/letter-templates";
import { getSignatories } from "@/lib/signatories";
import { canEdit } from "@/lib/surat/status";
import { SuratForm } from "../../surat-form";
import { updateLetterAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SuratEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("letters.write");
  const { id } = await params;
  const letterId = Number(id);
  if (!Number.isInteger(letterId) || letterId <= 0) notFound();
  const letter = await getLetterDetail(letterId);
  if (!letter) notFound();
  if (!canEdit(letter.status)) redirect(`/admin/surat/${letter.id}`);

  const [templates, sigs, ownTemplate] = await Promise.all([
    listActiveTemplates(),
    getSignatories(),
    getTemplateById(letter.templateId),
  ]);
  // Template surat ini mungkin sudah dinonaktifkan setelah surat dibuat —
  // kalau tidak lagi muncul di daftar aktif, tetap sisipkan supaya select
  // "Jenis Surat" (terkunci) dan blok field dinamis tidak kosong, sementara
  // server tetap menuntut field itu terisi saat submit.
  const templateOptions = templates.some((t) => t.id === letter.templateId)
    ? templates
    : ownTemplate
      ? [...templates, ownTemplate]
      : templates;
  const action = updateLetterAction.bind(null, letter.id);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Ubah Surat</h1>
      {letter.rejectionNote ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ditolak penandatangan: {letter.rejectionNote}
        </p>
      ) : null}
      <SuratForm
        action={action}
        templates={templateOptions.map((t) => ({ id: t.id, name: t.name, bodyDefault: t.bodyDefault, fields: t.fields }))}
        signatories={sigs}
        canSubmit
        lockTemplate
        initial={{
          templateId: letter.templateId,
          subject: letter.subject,
          bodyHtml: letter.bodyHtml,
          fieldValues: letter.fieldValues,
          signatoryId: letter.signatoryId,
        }}
      />
    </div>
  );
}
