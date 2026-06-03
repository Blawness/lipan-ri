import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // The only unauthenticated route reachable here is /admin/login: the proxy
  // (src/proxy.ts) redirects every other /admin/* to login, and each admin
  // page additionally calls requireUser()/requireAdmin() before touching data.
  // So rendering bare children here (no shell) cannot leak protected content.
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-navy-50/60">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-navy-100 bg-white/80 px-6 backdrop-blur-sm">
          <span className="text-sm font-medium text-navy-500">Panel Admin</span>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm text-navy-600 sm:inline">
              {session.user.email}
            </span>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700 ring-1 ring-brand-100">
              {session.user.role}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
