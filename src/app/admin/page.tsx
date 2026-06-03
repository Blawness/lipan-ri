import Link from "next/link";
import { db } from "@/db";
import { posts, media, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { Newspaper, Images, Users, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireUser();
  const [[p], [m], [u]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(posts),
    db.select({ n: sql<number>`count(*)` }).from(media),
    db.select({ n: sql<number>`count(*)` }).from(users),
  ]);

  const stats = [
    { label: "Berita", value: p.n, icon: Newspaper, href: "/admin/posts", tint: "bg-brand-50 text-brand-600" },
    { label: "Media", value: m.n, icon: Images, href: "/admin/media", tint: "bg-gold-100 text-gold-600" },
    { label: "User", value: u.n, icon: Users, href: "/admin/users", tint: "bg-navy-100 text-navy-700" },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ringkasan konten situs LIPAN RI.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-xl border border-navy-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-brand-200"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-navy-300 transition-colors group-hover:text-brand-500" />
              </div>
              <p className="mt-4 text-3xl font-bold text-navy-900">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
