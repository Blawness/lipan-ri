"use client";

import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePengurusQrPreviewStore } from "@/lib/store";

export function QrPreviewButton({
  slug,
  nama,
  jabatan,
}: {
  slug: string;
  nama: string;
  jabatan: string;
}) {
  const open = usePengurusQrPreviewStore((s) => s.open);

  return (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      title="Pratinjau QR code"
      onClick={() => open(slug, nama, jabatan)}
    >
      <QrCode className="h-3.5 w-3.5" />
      QR
    </Button>
  );
}
