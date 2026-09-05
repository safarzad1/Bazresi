import { redirect } from "next/navigation";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import EvaluationClient from "./EvaluationClient";

export default async function EvaluationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!sessionHasMenu(session, ACCESS_MENU.evaluation)) redirect("/Admin/Dashboard");
  return <EvaluationClient isSystemAdmin={session.isSystemAdmin} />;
}
