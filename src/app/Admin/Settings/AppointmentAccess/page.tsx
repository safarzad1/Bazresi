import { redirect } from "next/navigation";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import AppointmentAccessClientOnly from "./AppointmentAccessClientOnly";

export const dynamic = "force-dynamic";

export default async function AppointmentAccessPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!sessionHasMenu(session, ACCESS_MENU.settings)) redirect("/Admin/Dashboard");
  return <AppointmentAccessClientOnly />;
}
