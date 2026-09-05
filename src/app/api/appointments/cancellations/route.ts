import { NextResponse } from "next/server";
import { listCancellationWorkflow } from "@/lib/cancellation-proposals-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 });
  if (!sessionHasMenu(session, ACCESS_MENU.appointmentsCancellations)) {
    return NextResponse.json({ message: "مجوز مشاهده فرایند لغو انتصاب را ندارید." }, { status: 403 });
  }

  try {
    const rows = await listCancellationWorkflow(session.userId);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Cancellation workflow list failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "دریافت فرایندهای لغو انتصاب انجام نشد." },
      { status: 500 },
    );
  }
}
