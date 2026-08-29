import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");

  return (
    <DashboardClient
      displayName={session.fullName}
      mustChangePassword={session.mustChangePassword}
    />
  );
}
