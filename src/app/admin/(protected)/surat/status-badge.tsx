import { STATUS_LABEL, type LetterStatus } from "@/lib/surat/status";

const CLASS: Record<string, string> = {
  draft: "bg-navy-100 text-navy-700",
  submitted: "bg-amber-100 text-amber-800",
  issued: "bg-emerald-100 text-emerald-800",
  revoked: "bg-red-100 text-red-700",
};

/**
 * Status yang ditampilkan berasal dari dua sumber: `letters.status` untuk alur
 * penyusunan, dan `documents.status` untuk pencabutan. Pencabutan sengaja tidak
 * disalin ke `letters` agar tidak ada dua sumber kebenaran.
 */
export function StatusBadge({
  status,
  documentStatus,
}: {
  status: LetterStatus;
  documentStatus?: "active" | "revoked" | null;
}) {
  const revoked = status === "issued" && documentStatus === "revoked";
  const key = revoked ? "revoked" : status;
  const label = revoked ? "Dicabut" : STATUS_LABEL[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS[key]}`}>
      {label}
    </span>
  );
}
