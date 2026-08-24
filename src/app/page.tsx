import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  redirect(session ? "/Admin/Dashboard" : "/Login");
}
