"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useQrPreviewStore } from "@/lib/store";

export function QrPreviewModal() {
  const { slug, number, title, close } = useQrPreviewStore();
  const open = slug !== null;

  if (!slug) return null;

  const qrUrl = `/api/verifikasi/${slug}/qr`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR Code ${number ?? slug}`}
            className="h-64 w-64 rounded-lg border border-navy-100 object-contain"
          />
          <div className="text-center">
            <p className="text-sm font-medium text-navy-900">
              {number ?? slug}
            </p>
            {title && (
              <p className="text-xs text-muted-foreground">{title}</p>
            )}
          </div>
          <a
            href={qrUrl}
            download={`qr-${slug}.png`}
            className="w-full"
          >
            <Button size="sm" className="w-full">
              <Download className="h-4 w-4" />
              Unduh QR
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
