import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { firstAllowedAdminRoute } from "@/lib/access-menu";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  redirect(session ? firstAllowedAdminRoute(session.menuCodes, session.isSystemAdmin) : "/Login");
}
