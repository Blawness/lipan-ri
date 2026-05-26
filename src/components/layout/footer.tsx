import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="gradient-header text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">LIPAN RI</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia.
              Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Tautan</h3>
            <ul className="space-y-1 text-sm text-blue-200">
              <li><Link href="/tentang-kami/profil-ketua" className="hover:text-white transition-colors">Profil Ketua</Link></li>
              <li><Link href="/tentang-kami/struktur" className="hover:text-white transition-colors">Struktur Organisasi</Link></li>
              <li><Link href="/galeri" className="hover:text-white transition-colors">Galeri</Link></li>
              <li><Link href="/kontak" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Kontak</h3>
            <div className="text-sm text-blue-200 space-y-1">
              <p>Gedung YARNATI Lt. 4 Ruang 407-408</p>
              <p>Jl. Proklamasi No. 44, Menteng</p>
              <p>Jakarta Pusat 10320</p>
              <p className="mt-2">Telp: 021-392-8018</p>
              <p>Email: dpn.lipanri@gmail.com</p>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-blue-700/50" />
        <p className="text-center text-sm text-blue-300">
          Copyright &copy; {new Date().getFullYear()} LIPAN RI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
