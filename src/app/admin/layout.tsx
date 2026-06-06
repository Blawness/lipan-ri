import type { ReactNode } from "react";
import { AdminLayout } from "@blawness/admin-kit/shell";
import type { NavItem } from "@blawness/admin-kit/shell/sidebar";
import {
  LayoutDashboard, Newspaper, Images, Tags, Users, GalleryHorizontal,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Berita", icon: Newspaper },
  { href: "/admin/media", label: "Galeri", icon: Images },
  { href: "/admin/banners", label: "Banner", icon: GalleryHorizontal, adminOnly: true },
  { href: "/admin/categories", label: "Kategori", icon: Tags, adminOnly: true },
  { href: "/admin/users", label: "User", icon: Users, adminOnly: true },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AdminLayout navItems={navItems} logoSrc="/logo.png" brandName="LIPAN RI">
      {children}
    </AdminLayout>
  );
}
