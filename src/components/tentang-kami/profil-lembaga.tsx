import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Archive, Target, Clock } from "lucide-react";

export function ProfilLembaga({ data }: { data: any }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Profil Lembaga</h1>
      </div>

      <Card className="border-blue-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5" /> Tentang LIPAN RI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{data.tentang}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{data.berdiri}</p>
        </CardContent>
      </Card>

      <Card className="border-blue-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Eye className="h-5 w-5" /> Kasus yang Ditangani
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.kasus.map((k: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-blue-500 mt-1">&#8226;</span> {k}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-blue-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Clock className="h-5 w-5" /> Program Kerja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">Jangka Pendek</Badge>
            <ul className="space-y-1">
              {data.programKerja.pendek.map((p: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-400">&#8226;</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Badge variant="secondary" className="mb-2">Jangka Menengah</Badge>
            <ul className="space-y-1">
              {data.programKerja.menengah.map((p: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-400">&#8226;</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Badge variant="secondary" className="mb-2">Jangka Panjang</Badge>
            <ul className="space-y-1">
              {data.programKerja.panjang.map((p: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-400">&#8226;</span> {p}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
              <Target className="h-4 w-4" /> Maksud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.maksud}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
              <Archive className="h-4 w-4" /> Tujuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {data.tujuan.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
