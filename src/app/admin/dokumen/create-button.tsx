"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDokumenCreateStore } from "@/lib/store";
import { CreateDokumenModal } from "./create-modal";

export function CreateDokumenButton() {
  const setOpen = useDokumenCreateStore((s) => s.setOpen);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        render={<span><Plus className="h-4 w-4" /> Tambah Dokumen</span>}
      />
      <CreateDokumenModal />
    </>
  );
}
