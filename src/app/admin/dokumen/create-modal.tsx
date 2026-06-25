"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DokumenForm } from "./dokumen-form";
import { createDocumentAction } from "./actions";
import { useDokumenCreateStore } from "@/lib/store";

export function CreateDokumenModal() {
  const { open, setOpen } = useDokumenCreateStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Tambah Dokumen</DialogTitle>
        </DialogHeader>
        <DokumenForm
          action={createDocumentAction}
          initial={{
            number: "",
            title: "",
            signatory: "",
            issuedAt: "",
            fileUrl: "",
            status: "active",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
