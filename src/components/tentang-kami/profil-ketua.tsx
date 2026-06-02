import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Briefcase, Users, Quote, Target, Lightbulb } from "lucide-react";

export function ProfilKetua({ data }: { data: any }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{data.nama}</h1>
        <p className="text-navy-200">Ketua Umum LIPAN-RI</p>
        <p className="text-navy-300 text-sm mt-1">{data.lahir}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              <GraduationCap className="h-4 w-4" /> Pendidikan Formal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendidikan.map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs font-mono">{p.tahun}</Badge>
                <div>
                  <p className="text-sm font-medium text-navy-900">{p.jurusan}</p>
                  <p className="text-xs text-muted-foreground">{p.institusi}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              <Briefcase className="h-4 w-4" /> Pengalaman Pekerjaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pekerjaan.map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs font-mono">{p.tahun}</Badge>
                <div>
                  <p className="text-sm font-medium text-navy-900">{p.jabatan}</p>
                  <p className="text-xs text-muted-foreground">{p.perusahaan}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-navy-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
            <Users className="h-4 w-4" /> Pengalaman Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.organisasi.map((o: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs font-mono">{o.tahun}</Badge>
              <div>
                <p className="text-sm font-medium text-navy-900">{o.jabatan}</p>
                <p className="text-xs text-muted-foreground">{o.organisasi}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground italic">"{data.visi}"</p>
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
