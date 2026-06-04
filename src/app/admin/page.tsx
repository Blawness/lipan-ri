import Link from "next/link";
import { db } from "@/db";
import { posts, media, users } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { Newspaper, FileEdit, Images, Users, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function AdminDashboard() {
  await requireUser();
  const [[pub], [drf], [m], [u], recent] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(posts)
      .where(sql`${posts.status} = 'published'`),
    db
      .select({ n: sql<number>`count(*)` })
      .from(posts)
      .where(sql`${posts.status} = 'draft'`),
    db.select({ n: sql<number>`count(*)` }).from(media),
    db.select({ n: sql<number>`count(*)` }).from(users),
    db
      .select({
        id: posts.id,
        title: posts.title,
        status: posts.status,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt))
      .limit(5),
  ]);

  const stats = [
    {
      label: "Berita terbit",
      value: pub.n,
      icon: Newspaper,
      href: "/admin/posts",
      tint: "bg-brand-50 text-brand-600",
    },
    {
      label: "Berita draft",
      value: drf.n,
      icon: FileEdit,
      href: "/admin/posts",
      tint: "bg-navy-100 text-navy-700",
    },
    {
      label: "Media",
      value: m.n,
      icon: Images,
      href: "/admin/media",
      tint: "bg-gold-100 text-gold-600",
    },
    {
      label: "User",
      value: u.n,
      icon: Users,
      href: "/admin/users",
      tint: "bg-navy-100 text-navy-700",
    },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ringkasan konten situs LIPAN RI.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-navy-900">
            Berita terbaru
          </h2>
          <Link
            href="/admin/posts"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            Lihat semua
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-12 text-center">
            <Newspaper className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">Belum ada berita</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
            {recent.map((r) => (
              <li key={r.id} className="border-b border-navy-50 last:border-0">
                <Link
                  href={`/admin/posts/${r.id}/edit`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-navy-50/40"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-navy-900">
                    {r.title}
                  </span>
                  <span className="flex items-center gap-3">
                    {r.status === "published" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Terbit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                        Draft
                      </span>
                    )}
                    {r.updatedAt && (
                      <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                        {dateFmt.format(r.updatedAt)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
