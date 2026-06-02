import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const levelLabels: Record<number, string> = {
  0: "Dewan",
  1: "Penasehat & Pengawas",
  2: "Pimpinan",
  3: "Sekretariat",
  4: "Divisi",
};

function getLevelColor(level: number): string {
  const colors = [
    "bg-navy-900 text-white",
    "bg-navy-800 text-white",
    "bg-navy-700 text-white",
    "bg-navy-600 text-white",
    "bg-navy-500 text-white",
  ];
  return colors[level] ?? colors[4];
}

export function StrukturOrg({ data }: { data: any }) {
  const grouped = data.struktur.reduce((acc: Record<number, any[]>, item: any) => {
    if (!acc[item.level]) acc[item.level] = [];
    acc[item.level].push(item);
    return acc;
  }, {});

  const levels = Object.keys(grouped).map(Number).sort();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Struktur Organisasi</h1>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-navy-200" />

        <div className="space-y-0">
          {levels.map((level) => (
            <div key={level} className="relative pl-10 pb-6">
              <div className="absolute left-1.5 top-2 w-5 h-5 rounded-full bg-navy-600 border-4 border-navy-100" />

              <Badge className="mb-3" variant="secondary">
                {levelLabels[level] ?? `Level ${level}`}
              </Badge>

              <div className="space-y-2">
                {grouped[level].map((item: any, i: number) => (
                  <Card key={i} className="border-navy-100 hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${getLevelColor(level)} flex items-center justify-center text-xs font-bold`}>
                        {item.nama.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-navy-900">{item.nama}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
