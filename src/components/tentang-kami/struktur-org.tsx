import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";

export function StrukturOrg({}: { data: StrukturContent }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Struktur Organisasi</h1>
        <p className="text-navy-100 mt-1 text-sm">
          Susunan kepengurusan LIPAN RI
        </p>
      </div>

      <Card className="border-navy-100 overflow-hidden py-0">
        <CardContent className="p-4 md:p-6">
          <div className="relative w-full overflow-x-auto rounded-lg bg-white">
            <Image
              src="/struktur-lipan.svg"
              alt="Bagan Struktur Organisasi LIPAN RI"
              width={1440}
              height={810}
              className="w-full h-auto min-w-[720px]"
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
