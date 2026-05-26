import { Card, CardContent } from "@/components/ui/card";
import { Pentagon } from "lucide-react";

export function ArtiLambang({ data }: { data: any }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Arti Lambang</h1>
      </div>

      <div className="flex justify-center mb-10">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center shadow-xl">
          <div className="text-center">
            <Pentagon className="h-20 w-20 text-white mx-auto mb-2" />
            <div className="text-white text-xs font-bold tracking-widest">LIPAN RI</div>
            <div className="text-blue-200 text-[10px] mt-1">Setya Bhakti Pertiwi</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {data.elemen.map((e: any, i: number) => (
          <Card key={i} className="border-blue-100 hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">{e.nama}</h3>
                <p className="text-sm text-muted-foreground mt-1">{e.arti}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
