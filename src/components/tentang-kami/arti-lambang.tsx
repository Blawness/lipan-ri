import { Card, CardContent } from "@/components/ui/card";
import { Pentagon } from "lucide-react";
import type { LambangContent } from "@/lib/page-content";

export function ArtiLambang({ data }: { data: LambangContent }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Arti Lambang</h1>
      </div>

      <div className="flex justify-center mb-10">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-navy-900 via-navy-700 to-navy-500 flex items-center justify-center shadow-xl">
          <div className="text-center">
            <Pentagon className="h-20 w-20 text-white mx-auto mb-2" />
            <div className="text-white text-xs font-bold tracking-widest">LIPAN RI</div>
            <div className="text-navy-200 text-[10px] mt-1">Setya Bhakti Pertiwi</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {data.elemen.map((e, i) => (
          <Card key={i} className="border-navy-100 hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-navy-600 font-bold text-sm">{i + 1}</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">{e.nama}</h3>
                <p className="text-sm text-muted-foreground mt-1">{e.arti}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
