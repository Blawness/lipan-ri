import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Berita", href: "/" },
  { label: "Press Rilis", href: "/category/press-rilis" },
  {
    label: "Tentang Kami",
    href: "/tentang-kami",
    children: [
      { label: "Profil Lembaga", href: "/tentang-kami/sekilas-lipan-ri" },
      { label: "Profil Ketua", href: "/tentang-kami/profil-ketua" },
      { label: "Visi Misi", href: "/tentang-kami/visi-misi" },
      { label: "Struktur", href: "/tentang-kami/struktur" },
      { label: "Legalitas", href: "/tentang-kami/legalitas" },
      { label: "Arti Lambang", href: "/tentang-kami/arti-lambang" },
    ],
  },
  { label: "Galeri", href: "/galeri" },
  { label: "Kontak", href: "/kontak" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy-100 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo statis kecil, optimasi next/image tak perlu */}
            <img
              src="/logo.png"
              alt="Logo LIPAN RI"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div className="hidden sm:block">
              <div className="font-heading text-sm font-extrabold text-navy-900 leading-tight">LIPAN RI</div>
              <div className="text-[10px] text-brand-500 font-semibold tracking-widest uppercase leading-tight">
                Independen
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              if ("children" in item && item.children) {
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "gap-0.5"
                      )}
                    >
                      {item.label}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.href}>
                          <Link href={child.href} className="w-full">
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form action="/search" className="hidden sm:flex items-center">
            <Input
              name="q"
              placeholder="Cari..."
              className="w-40 h-8 text-xs"
            />
          </form>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
