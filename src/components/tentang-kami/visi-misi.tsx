import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Target, Heart } from "lucide-react";

export function VisiMisi({ data }: { data: any }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Visi Misi &amp; Motto</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-blue-900">Visi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.visi}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-blue-900">Misi</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              {data.misi.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-100 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-blue-900">Motto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-700 italic">"{data.moto}"</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
