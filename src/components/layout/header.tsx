import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Berita", href: "/" },
  { label: "Press Rilis", href: "/category/press-rilis" },
  { label: "Tentang Kami", href: "/tentang-kami" },
  { label: "Galeri", href: "/galeri" },
  { label: "Kontak", href: "/kontak" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
              LR
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-blue-900 leading-tight">LIPAN RI</div>
              <div className="text-[10px] text-blue-500 tracking-widest uppercase leading-tight">
                Independen
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {item.label}
              </Link>
            ))}
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
