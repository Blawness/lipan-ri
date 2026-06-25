"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border border-navy-200 bg-white px-4 py-2 text-sm text-navy-700 transition-colors hover:bg-navy-50 cursor-pointer"
    >
      <Printer className="h-4 w-4" />
      Cetak Halaman
    </button>
  );
}
