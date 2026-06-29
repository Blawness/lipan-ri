import type { ReactNode } from "react";
import { AdminLayout } from "@blawness/admin-kit/shell";
import type { NavItem } from "@blawness/admin-kit/shell/sidebar";
import {
  LayoutDashboard, Newspaper, Images, Tags, Users, GalleryHorizontal, FileCheck, PenLine, FolderOpen, Settings,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },

  {
    label: "Konten",
    icon: <FolderOpen className="h-4 w-4" />,
    children: [
      { href: "/admin/posts", label: "Berita", icon: <Newspaper className="h-4 w-4" /> },
      { href: "/admin/categories", label: "Kategori", icon: <Tags className="h-4 w-4" />, requires: "categories.read" },
      { href: "/admin/banners", label: "Banner", icon: <GalleryHorizontal className="h-4 w-4" />, requires: "banners.manage" },
      { href: "/admin/media", label: "Galeri", icon: <Images className="h-4 w-4" /> },
    ],
  },

  {
    label: "Dokumen",
    icon: <FileCheck className="h-4 w-4" />,
    children: [
      { href: "/admin/dokumen", label: "Dokumen", icon: <FileCheck className="h-4 w-4" />, requires: "documents.manage" },
      { href: "/admin/penandatangan", label: "Penandatangan", icon: <PenLine className="h-4 w-4" />, requires: "signatories.manage" },
    ],
  },

  {
    label: "Pengaturan",
    icon: <Settings className="h-4 w-4" />,
    children: [
      { href: "/admin/users", label: "User", icon: <Users className="h-4 w-4" />, requires: "users.read" },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AdminLayout navItems={navItems} logoSrc="/logo.png" brandName="LIPAN RI">
      {children}
    </AdminLayout>
  );
}
