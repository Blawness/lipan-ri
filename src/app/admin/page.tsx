import { db } from "@/db";
import { posts, media, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireUser();
  const [[p], [m], [u]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(posts),
    db.select({ n: sql<number>`count(*)` }).from(media),
    db.select({ n: sql<number>`count(*)` }).from(users),
  ]);

  const stats = [
    { label: "Berita", value: p.n },
    { label: "Media", value: m.n },
    { label: "User", value: u.n },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-navy-900">{s.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
