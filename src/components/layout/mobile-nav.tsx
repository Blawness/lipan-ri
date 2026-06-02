"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Berita", href: "/berita" },
  { label: "Press Rilis", href: "/category/press-rilis" },
  {
    label: "Tentang Kami",
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" />}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-64 pt-12">
        <nav className="flex flex-col gap-1">
          {navLinks.map((item) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full justify-between"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </button>
                  {expanded && (
                    <div className="ml-4 flex flex-col gap-1 mt-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start text-sm text-muted-foreground"
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href!}
                href={item.href!}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "justify-start"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
