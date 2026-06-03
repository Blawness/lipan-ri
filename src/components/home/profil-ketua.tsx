import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProfilKetua() {
  return (
    <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 border-y border-navy-700 py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center max-w-4xl mx-auto">
          <div className="relative mx-auto md:mx-0">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold-400/20 via-gold-400/5 to-transparent blur-md" />
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal */}
              <img
                src="/ketua-harun-prayitno.png"
                alt="Harun Prayitno, SE, SH, MH — Ketua Umum LIPAN RI"
                className="mx-auto h-56 w-44 md:h-72 md:w-56 rounded-2xl object-cover object-top ring-1 ring-gold-400/30 shadow-2xl shadow-navy-950/80"
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-gold-400/40" />
              <p className="text-xs font-semibold text-gold-300 uppercase tracking-[0.2em]">
                Ketua Umum LIPAN RI
              </p>
            </div>
            <p className="text-sm text-navy-300 mb-3">Putra Asli Banyumas</p>
            <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-white/95 leading-tight">
              Harun Prayitno, SE, SH, MH
            </h2>
            <div className="mt-4 h-0.5 w-16 bg-gradient-to-r from-gold-400 to-transparent rounded-full" />
            <blockquote className="mt-5 text-navy-200/80 leading-relaxed text-sm md:text-base italic border-l-2 border-gold-400/20 pl-4">
              &ldquo;Berbekal pengalaman dan kemitraan dengan BPN dalam
              penanganan konflik dan sengketa pertanahan di seluruh wilayah
              NKRI selama kurang lebih 20 tahun, kami hadir untuk mengadvokasi
              keadilan bagi masyarakat.&rdquo;
            </blockquote>
            <Link
              href="/tentang-kami/profil-ketua"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold text-gold-300 hover:text-gold-200 transition-colors group"
            >
              Selengkapnya tentang Ketua
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
