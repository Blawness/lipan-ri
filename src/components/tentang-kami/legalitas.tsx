import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Landmark, CreditCard, Building2, ScrollText } from "lucide-react";

export function Legalitas({ data }: { data: any }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Legalitas Lembaga</h1>
      </div>

      <Card className="border-navy-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900">
            <FileText className="h-5 w-5" /> Akte Notaris
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.akte.map((a: any, i: number) => (
            <div key={i} className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider mb-1">{a.label}</p>
              <p className="text-sm text-navy-900">{a.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-navy-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900">
            <ScrollText className="h-5 w-5" /> SK Kemenkumham
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.sk.map((s: any, i: number) => (
            <div key={i} className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-sm text-navy-900">{s.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              <CreditCard className="h-4 w-4" /> NPWP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-navy-900">{data.npwp}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.kpp}</p>
          </CardContent>
        </Card>

        <Card className="border-navy-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
              <Landmark className="h-4 w-4" /> Rekening Bank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-navy-900">{data.bank.nama}</p>
            <p className="text-sm font-mono text-navy-800 mt-1">{data.bank.norek}</p>
            <p className="text-xs text-muted-foreground mt-1">a.n. {data.bank.atasNama}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-navy-100 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-900 text-lg">
            <Building2 className="h-4 w-4" /> Berita Negara
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{data.beritaNegara}</p>
        </CardContent>
      </Card>
    </div>
  );
}
