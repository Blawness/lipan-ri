"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DokumenForm } from "./dokumen-form";
import { updateDocumentAction } from "./actions";
import { useDokumenEditStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

type DocData = {
  id: number;
  number: string;
  title: string;
  signatory: string;
  issuedAt: string;
  fileUrl: string | null;
  status: "active" | "revoked";
  showDocument: boolean;
};

const dateToInput = (d: string | Date) =>
  new Date(d).toISOString().slice(0, 10);

export function EditDokumenModal({
  signatories,
}: {
  signatories: { id: number; name: string; title: string | null }[];
}) {
  const { id, close } = useDokumenEditStore();
  const open = id !== null;
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/dokumen/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDoc(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      close();
      setDoc(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Dokumen</DialogTitle>
        </DialogHeader>
        {loading || !doc ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
          </div>
        ) : (
          <DokumenForm
            action={updateDocumentAction.bind(null, doc.id)}
            initial={{
              number: doc.number,
              title: doc.title,
              signatory: doc.signatory,
              issuedAt: dateToInput(doc.issuedAt),
              fileUrl: doc.fileUrl ?? "",
              status: doc.status,
              showDocument: doc.showDocument ?? false,
            }}
            signatories={signatories}
            onCancel={() => handleClose(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
