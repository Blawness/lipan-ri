import { notFound } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { getTemplateById } from "@/lib/admin/letter-templates";
import { TemplateForm } from "../../template-form";
import { updateTemplateAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("letterTemplates.manage");
  const { id } = await params;
  const template = await getTemplateById(Number(id));
  if (!template) notFound();

  const action = updateTemplateAction.bind(null, template.id);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Ubah {template.name}</h1>
      <TemplateForm action={action} initial={template} />
    </div>
  );
}
