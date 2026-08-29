import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");

  return (
    <DashboardClient
      mustChangePassword={session.mustChangePassword}
      appointmentsAllowed={session.permissions.appointments || session.isSystemAdmin}
    />
  );
}
