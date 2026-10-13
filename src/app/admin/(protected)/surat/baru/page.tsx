import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { listActiveTemplates } from "@/lib/admin/letter-templates";
import { getSignatories } from "@/lib/signatories";
import { SuratForm } from "../surat-form";
import { createLetterAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SuratBaruPage() {
  await requirePermission("letters.write");
  const [templates, sigs] = await Promise.all([listActiveTemplates(), getSignatories()]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/surat"
          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" /> Daftar surat
        </Link>
        <h1 className="font-heading text-xl font-bold text-navy-900">Surat Baru</h1>
        <p className="hidden text-sm text-muted-foreground xl:block">
          Isi formulir di kiri; pratinjau surat lengkap dengan kop diperbarui seketika.
        </p>
      </div>
      <SuratForm
        action={createLetterAction}
        templates={templates.map((t) => ({ id: t.id, name: t.name, bodyDefault: t.bodyDefault, fields: t.fields }))}
        signatories={sigs}
        canSubmit
        initial={{ templateId: null, subject: "", bodyHtml: "", fieldValues: {}, signatoryId: null }}
      />
    </div>
  );
}
