import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import EvaluationClient from "./EvaluationClient";

export default async function EvaluationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!session.permissions.evaluation && !session.isSystemAdmin) redirect("/Admin/Dashboard");
  return <EvaluationClient isSystemAdmin={session.isSystemAdmin} />;
}
