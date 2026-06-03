"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Dashboard", admin: false },
  { href: "/admin/posts", label: "Berita", admin: false },
  { href: "/admin/media", label: "Galeri", admin: false },
  { href: "/admin/categories", label: "Kategori", admin: true },
  { href: "/admin/users", label: "User", admin: true },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-navy-100 bg-white p-4 flex flex-col">
      <p className="font-heading font-bold text-navy-900 px-2 mb-4">LIPAN RI Admin</p>
      <nav className="flex-1 space-y-1">
        {links
          .filter((l) => !l.admin || role === "admin")
          .map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-navy-700 hover:bg-navy-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
      </nav>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Keluar
        </Button>
      </form>
    </aside>
  );
}
