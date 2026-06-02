import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Target, Heart } from "lucide-react";
import type { VisiMisiContent } from "@/lib/page-content";

export function VisiMisi({ data }: { data: VisiMisiContent }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Visi Misi &amp; Motto</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-navy-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-navy-600" />
            </div>
            <CardTitle className="text-navy-900">Visi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.visi}</p>
          </CardContent>
        </Card>

        <Card className="border-navy-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center mb-3">
              <Target className="h-5 w-5 text-navy-600" />
            </div>
            <CardTitle className="text-navy-900">Misi</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              {data.misi.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-navy-100 hover:shadow-md transition-shadow bg-gradient-to-br from-navy-50 to-white">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-navy-600 flex items-center justify-center mb-3">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-navy-900">Motto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-navy-700 italic">&ldquo;{data.moto}&rdquo;</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
