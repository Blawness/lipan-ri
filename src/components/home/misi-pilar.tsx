import { ShieldCheck, Scale, Award } from "lucide-react";

const pilar = [
  {
    icon: ShieldCheck,
    title: "Independen",
    desc: "Bergerak tanpa kepentingan golongan, murni untuk kepentingan negara dan masyarakat.",
  },
  {
    icon: Scale,
    title: "Berintegritas",
    desc: "Menjunjung kejujuran dan keadilan dalam setiap investigasi dan pengawasan aset.",
  },
  {
    icon: Award,
    title: "Profesional",
    desc: "Penanganan menyeluruh, berkelanjutan, dan berkeadilan oleh tim yang kompeten.",
  },
];

export function MisiPilar() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-navy-900">
          Mengawal Aset Negara &amp; Masyarakat
        </h2>
        <div className="mx-auto my-4 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-gold-400" />
        <p className="text-muted-foreground leading-relaxed">
          Mengawasi, menyelamatkan, investigasi, pemantauan, pemeliharaan serta
          pencatatan barang aset milik Negara dan Masyarakat di seluruh wilayah
          Negara Kesatuan Republik Indonesia.
        </p>
        <p className="mt-4 text-sm font-semibold text-brand-600 uppercase tracking-widest">
          Melayani &bull; Membantu &bull; Dipercaya
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {pilar.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
              <p.icon className="h-6 w-6" />
            </div>
            <h3 className="font-heading mt-4 text-lg font-bold text-navy-900">
              {p.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
