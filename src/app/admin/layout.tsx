import type { ReactNode } from "react";
import { AdminLayout } from "@blawness/admin-kit/shell";
import type { NavItem } from "@blawness/admin-kit/shell/sidebar";
import {
  LayoutDashboard, Newspaper, Images, Tags, Users, GalleryHorizontal,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/posts", label: "Berita", icon: <Newspaper className="h-4 w-4" /> },
  { href: "/admin/media", label: "Galeri", icon: <Images className="h-4 w-4" /> },
  { href: "/admin/banners", label: "Banner", icon: <GalleryHorizontal className="h-4 w-4" />, adminOnly: true },
  { href: "/admin/categories", label: "Kategori", icon: <Tags className="h-4 w-4" />, adminOnly: true },
  { href: "/admin/users", label: "User", icon: <Users className="h-4 w-4" />, adminOnly: true },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AdminLayout navItems={navItems} logoSrc="/logo.png" brandName="LIPAN RI">
      {children}
    </AdminLayout>
  );
}
