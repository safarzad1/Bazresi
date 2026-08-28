import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import AppointmentAccessClientOnly from "./AppointmentAccessClientOnly";

export const dynamic = "force-dynamic";

export default async function AppointmentAccessPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!session.isSystemAdmin) redirect("/Admin/Dashboard");
  return <AppointmentAccessClientOnly />;
}
