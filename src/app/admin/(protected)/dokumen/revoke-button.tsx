"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { revokeDocumentAction } from "./actions";

// Pencabutan tidak bisa dibatalkan dari UI, jadi wajib lewat konfirmasi —
// sama seperti ConfirmDelete — bukan langsung jalan saat tombol diklik.
export function RevokeButton({ id, number }: { id: number; number: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  function handleConfirm() {
    start(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("revokeReason", reason);
      try {
        await revokeDocumentAction(fd);
        toast.success("Dokumen berhasil dicabut.");
        setReason("");
      } catch {
        toast.error("Gagal mencabut dokumen.");
      } finally {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" title="Cabut legalitas">
            <Ban className="h-3.5 w-3.5" />
            Cabut
          </Button>
        }
      />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cabut dokumen?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-navy-900">{number}</span> akan
            ditandai tidak berlaku di halaman verifikasi publik. Tindakan ini
            tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label
            htmlFor={`revoke-reason-${id}`}
            className="text-sm font-medium text-navy-800"
          >
            Alasan (opsional)
          </label>
          <textarea
            id={`revoke-reason-${id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Mis. diganti surat nomor baru"
            className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200"
          />
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={pending} />}
          >
            Batal
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Cabut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
