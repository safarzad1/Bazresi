import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import AdminShell from "./components/AdminShell/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  return (
    <AdminShell
      displayName={session.fullName}
      userName={session.userName}
      sematTitle={session.sematTitle}
      isSystemAdmin={session.isSystemAdmin}
      evaluationAllowed={session.permissions.evaluation}
    >
      {children}
    </AdminShell>
  );
}
