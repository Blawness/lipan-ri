import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="gradient-header text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">LIPAN RI</h3>
            <p className="text-sm text-navy-200 leading-relaxed">
              Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia.
              Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Tautan</h3>
            <ul className="space-y-1 text-sm text-navy-200">
              <li><Link href="/tentang-kami/profil-ketua" className="hover:text-white transition-colors">Profil Ketua</Link></li>
              <li><Link href="/tentang-kami/struktur" className="hover:text-white transition-colors">Struktur Organisasi</Link></li>
              <li><Link href="/galeri" className="hover:text-white transition-colors">Galeri</Link></li>
              <li><Link href="/kontak" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Kontak</h3>
            <div className="text-sm text-navy-200 space-y-1">
              <p>Gedung YARNATI Lt. 4 Ruang 407-408</p>
              <p>Jl. Proklamasi No. 44, Menteng</p>
              <p>Jakarta Pusat 10320</p>
              <p className="mt-2">Telp: 021-392-8018</p>
              <p>Email: dpn.lipanri@gmail.com</p>
              <a href="https://www.youtube.com/@lipanri8748" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-navy-300 hover:text-white transition-colors mt-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-navy-700/50" />
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-navy-800/50 rounded-full px-4 py-2 text-xs text-navy-300">
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            Terdaftar Kemenkumham RI — AHU-0010835.AH.01.07 Tahun 2017
          </div>
        </div>
        <p className="text-center text-sm text-navy-300">
          Copyright &copy; {new Date().getFullYear()} LIPAN RI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
