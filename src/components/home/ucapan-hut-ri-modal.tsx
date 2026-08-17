"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { HUT_RI } from "@/lib/hut-ri";

/** Sekali per sesi browser — pindah halaman tidak memunculkannya lagi. */
const SESSION_KEY = `ucapan-hut-ri-${HUT_RI.tahun}`;

const PESAN_WHATSAPP = `Dirgahayu Republik Indonesia ke-${HUT_RI.ke}! ${HUT_RI.tema}.\n\nUcapan dari ${HUT_RI.ketua}, ${HUT_RI.jabatan}:\nhttps://www.lipan-ri.com`;

export function UcapanHutRiModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Beri jeda supaya halaman sempat tampil dulu, tidak menyergap.
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogTitle className="sr-only">
          Dirgahayu Republik Indonesia ke-{HUT_RI.ke}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Ucapan HUT ke-{HUT_RI.ke} Republik Indonesia dari {HUT_RI.ketua},{" "}
          {HUT_RI.jabatan}.
        </DialogDescription>

        {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal */}
        <img
          src={HUT_RI.gambar}
          alt={HUT_RI.gambarAlt}
          width={1280}
          height={1600}
          className="max-h-[70vh] w-full object-contain"
        />

        <DialogFooter className="mx-0 mb-0 rounded-none">
          <DialogClose render={<Button variant="outline" />}>Tutup</DialogClose>
          <Button
            render={
              <a
                href={`https://wa.me/?text=${encodeURIComponent(PESAN_WHATSAPP)}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Share2 data-icon="inline-start" />
            Bagikan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
