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
import { DocumentLogs } from "./document-logs";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Buka dokumen A lalu cepat-cepat B: respons A yang datang belakangan
    // jangan sampai menimpa form B.
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/admin/dokumen/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDoc(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      close();
      setDoc(null);
      setError(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Edit Dokumen</DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-navy-700">
              Gagal memuat dokumen. Coba tutup lalu buka lagi.
            </p>
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
              Tutup
            </Button>
          </div>
        ) : loading || !doc ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
          </div>
        ) : (
          <>
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
              onSuccess={() => {
                handleClose(false);
                toast.success("Dokumen berhasil diperbarui.");
              }}
            />
            <div className="-mx-4 -mb-4 mt-4 border-t border-navy-100 px-4 pb-4 pt-2">
              <DocumentLogs documentId={doc.id} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
