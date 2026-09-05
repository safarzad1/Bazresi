import { redirect } from "next/navigation";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU, firstAllowedAdminRoute } from "@/lib/access-menu";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!sessionHasMenu(session, ACCESS_MENU.dashboard)) redirect(firstAllowedAdminRoute(session.menuCodes, session.isSystemAdmin));

  return (
    <DashboardClient
      mustChangePassword={session.mustChangePassword}
      personsAllowed={sessionHasMenu(session, ACCESS_MENU.persons)}
      workflowAllowed={sessionHasMenu(session, ACCESS_MENU.appointmentsWorkflow)}
      cancellationsAllowed={sessionHasMenu(session, ACCESS_MENU.appointmentsCancellations)}
      evaluationAllowed={sessionHasMenu(session, ACCESS_MENU.evaluation)}
    />
  );
}
