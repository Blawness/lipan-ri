import Link from "next/link";
import type { Metadata } from "next";
import { Shield, User, Eye, Building2, FileText, Pentagon } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami",
};

const menuItems = [
  { slug: "sekilas-lipan-ri", title: "Profil Lembaga", desc: "Tentang LIPAN RI, program kerja, maksud & tujuan", icon: Shield },
  { slug: "profil-ketua", title: "Profil Ketua", desc: "Latar belakang, pendidikan, dan pengalaman Harun Prayitno", icon: User },
  { slug: "visi-misi", title: "Visi Misi & Motto", desc: "Arah dan prinsip LIPAN RI", icon: Eye },
  { slug: "struktur", title: "Struktur Organisasi", desc: "Susunan organisasi dan divisi", icon: Building2 },
  { slug: "legalitas", title: "Legalitas Lembaga", desc: "Akte, SK Kemenkumham, NPWP, rekening", icon: FileText },
  { slug: "arti-lambang", title: "Arti Lambang", desc: "Makna dari setiap elemen logo LIPAN RI", icon: Pentagon },
];

export default function TentangKamiPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Tentang Kami</h1>
        <p className="mt-2 text-navy-200">
          Informasi seputar LIPAN RI — lembaga, pimpinan, dan struktur organisasi
        </p>
      </div>

      <div className="grid gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.slug}
            href={`/tentang-kami/${item.slug}`}
            className="flex items-start gap-4 p-4 rounded-lg border border-navy-100 hover:border-navy-400 hover:shadow-md hover:bg-navy-50/50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
              <item.icon className="h-5 w-5 text-navy-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
