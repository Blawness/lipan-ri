"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DokumenForm } from "./dokumen-form";
import { createDocumentAction } from "./actions";
import { toast } from "sonner";
import { useDokumenCreateStore } from "@/lib/store";

export function CreateDokumenModal({
  signatories,
}: {
  signatories: { id: number; name: string; title: string | null }[];
}) {
  const { open, setOpen } = useDokumenCreateStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
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
            showDocument: false,
          }}
          signatories={signatories}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            toast.success("Dokumen berhasil dibuat.");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
