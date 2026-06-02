import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProfilKetua() {
  return (
    <section className="bg-navy-50/60 border-y border-navy-100 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center max-w-4xl mx-auto">
          <div className="mx-auto h-40 w-40 md:h-48 md:w-48 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 ring-4 ring-white shadow-xl flex items-center justify-center">
            <span className="font-heading text-5xl font-extrabold text-gold-400">
              HP
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">
              Ketua Umum LIPAN RI
            </p>
            <h2 className="font-heading mt-1 text-2xl md:text-3xl font-bold text-navy-900">
              Harun Prayitno, SE, SH, MH
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              &ldquo;Berbekal pengalaman dan kemitraan dengan BPN dalam
              penanganan konflik dan sengketa pertanahan di seluruh wilayah
              NKRI selama kurang lebih 20 tahun, kami hadir untuk mengadvokasi
              keadilan bagi masyarakat.&rdquo;
            </p>
            <Link
              href="/tentang-kami/profil-ketua"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Selengkapnya tentang Ketua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
