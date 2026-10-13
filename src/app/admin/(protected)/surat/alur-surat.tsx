import { Check, X } from "lucide-react";
import type { LetterStatus } from "@/lib/surat/status";

const LANGKAH: { status: LetterStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Diajukan" },
  { status: "issued", label: "Disahkan" },
];

/** Penanda posisi surat di alur Draft → Diajukan → Disahkan. */
export function AlurSurat({ status, revoked = false }: { status: LetterStatus; revoked?: boolean }) {
  const aktif = LANGKAH.findIndex((l) => l.status === status);
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="Tahapan surat">
      {LANGKAH.map((l, i) => {
        const selesai = i < aktif || (i === aktif && status === "issued");
        const sekarang = i === aktif;
        return (
          <li key={l.status} className="flex items-center gap-2">
            {i > 0 ? (
              <span className={`h-px w-6 sm:w-10 ${i <= aktif ? "bg-navy-700" : "bg-navy-200"}`} aria-hidden />
            ) : null}
            <span
              className={`flex items-center gap-1.5 ${sekarang ? "font-semibold text-navy-900" : selesai ? "text-navy-700" : "text-navy-400"}`}
              aria-current={sekarang ? "step" : undefined}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  selesai
                    ? revoked && l.status === "issued"
                      ? "bg-red-600 text-white"
                      : "bg-navy-800 text-white"
                    : sekarang
                      ? "bg-white text-navy-900 ring-2 ring-navy-800"
                      : "bg-navy-100 text-navy-500"
                }`}
              >
                {selesai ? (
                  revoked && l.status === "issued" ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </span>
              {revoked && l.status === "issued" ? "Dicabut" : l.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
