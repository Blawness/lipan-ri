import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { TemplateForm } from "../template-form";
import { createTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TemplateBaruPage() {
  await requirePermission("letterTemplates.manage");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Jenis Surat Baru</h1>
      <TemplateForm
        action={createTemplateAction}
        initial={{
          code: "",
          name: "",
          numberPattern: "{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}",
          bodyDefault: "",
          fields: [],
          isActive: true,
        }}
      />
    </div>
  );
}
