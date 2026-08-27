"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDokumenEditStore } from "@/lib/store";
import { EditDokumenModal } from "./edit-modal";

export function EditDokumenButton({
  id,
  signatories,
}: {
  id: number;
  signatories: { id: number; name: string; title: string | null }[];
}) {
  const open = useDokumenEditStore((s) => s.open);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        type="button"
        title="Edit dokumen"
        onClick={() => open(id)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <EditDokumenModal signatories={signatories} />
    </>
  );
}
