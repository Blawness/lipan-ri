"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { usePengurusQrPreviewStore } from "@/lib/store";

export function QrPreviewModal() {
  const { slug, nama, jabatan, close } = usePengurusQrPreviewStore();
  const open = slug !== null;
  const [copied, setCopied] = useState(false);

  if (!slug) return null;

  const qrUrl = `/api/verifikasi-pengurus/${encodeURIComponent(slug)}/qr`;

  async function handleCopy() {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not supported or denied
    }
  }

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
            alt={`QR Code ${nama ?? slug}`}
            className="h-64 w-64 rounded-lg border border-navy-100 object-contain"
          />
          <div className="text-center">
            <p className="text-sm font-medium text-navy-900">
              {nama ?? slug}
            </p>
            {jabatan && (
              <p className="text-xs text-muted-foreground">{jabatan}</p>
            )}
          </div>
          <div className="flex w-full gap-2">
            <a
              href={qrUrl}
              download={`qr-${slug}.png`}
              className="flex-1"
            >
              <Button size="sm" className="w-full">
                <Download className="h-4 w-4" />
                Unduh
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
