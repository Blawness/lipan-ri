"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQrPreviewStore } from "@/lib/store";

export function QrPreviewButton({
  slug,
  number,
  title,
}: {
  slug: string;
  number: string;
  title: string;
}) {
  const open = useQrPreviewStore((s) => s.open);

  return (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      title="Pratinjau QR code"
      onClick={() => open(slug, number, title)}
    >
      <Download className="h-3.5 w-3.5" />
      QR
    </Button>
  );
}
