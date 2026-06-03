import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote, Target, Lightbulb } from "lucide-react";
import Image from "next/image";
import type { ProfilKetuaContent } from "@/lib/page-content";

export function ProfilKetua({ data }: { data: ProfilKetuaContent }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100 text-center">
        <Image
          src="/ketua-harun-prayitno.png"
          alt={data.nama}
          width={128}
          height={128}
          className="mx-auto rounded-full mb-4 border-2 border-white/30"
        />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{data.nama}</h1>
        <p className="text-navy-200">Ketua Umum LIPAN-RI</p>
        <p className="text-navy-300 text-sm mt-1">Putra Asli Banyumas</p>
      </div>

      <Card className="border-navy-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900">
            <Quote className="h-5 w-5" /> Semboyan Jati Diri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.semboyan.map((s: string, i: number) => (
              <div key={i} className="bg-navy-50 rounded-lg px-4 py-3 text-sm text-navy-800 italic">
                {i + 1}. {s}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="prose prose-blue max-w-none mb-6">
        {data.latarBelakang.map((p: string, i: number) => (
          <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
        ))}
      </div>

      <Card className="border-navy-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900">
            <Lightbulb className="h-5 w-5" /> Motivasi Pengabdian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{data.motivasi}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              <Target className="h-4 w-4" /> Visi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">&ldquo;{data.visi}&rdquo;</p>
          </CardContent>
        </Card>
        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              Misi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {data.misi.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
