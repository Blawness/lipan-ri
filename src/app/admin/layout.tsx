import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-navy-50">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
