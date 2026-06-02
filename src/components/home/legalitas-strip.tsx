import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";

const legal = [
  { label: "Akta Pendirian", detail: "Notaris No. 18 — 19 Juli 2017" },
  {
    label: "SK Kemenkumham",
    detail: "AHU-0010835.AH.01.07 Tahun 2017",
  },
  {
    label: "Perubahan 2024",
    detail: "AHU-0001069.AH.01.06 Tahun 2024",
  },
];

export function LegalitasStrip() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="rounded-3xl gradient-hero text-white p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-gold-300 text-sm font-semibold uppercase tracking-wider">
            <BadgeCheck className="h-5 w-5" />
            Lembaga Resmi &amp; Terdaftar
          </div>
          <h2 className="font-heading mt-3 text-2xl md:text-3xl font-bold">
            Legalitas yang Dapat Dipertanggungjawabkan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {legal.map((l) => (
              <div
                key={l.label}
                className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4"
              >
                <div className="text-xs text-gold-200 uppercase tracking-wider">
                  {l.label}
                </div>
                <div className="mt-1 text-sm text-navy-100 font-medium">
                  {l.detail}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/tentang-kami/legalitas"
            className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-gold-300 hover:text-gold-200 transition-colors"
          >
            Lihat legalitas lengkap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
