"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDokumenEditStore } from "@/lib/store";

export function EditDokumenButton({ id }: { id: number }) {
  const open = useDokumenEditStore((s) => s.open);

  return (
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
  );
}
