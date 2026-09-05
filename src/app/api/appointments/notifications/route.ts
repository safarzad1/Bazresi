import { NextResponse } from "next/server";
import { listAppointmentWorkflow } from "@/lib/appointment-workflow-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { message: "نشست شما منقضی شده است؛ دوباره وارد شوید." },
      { status: 401 },
    );
  }
  if (!sessionHasMenu(session, ACCESS_MENU.appointmentsWorkflow)) {
    return NextResponse.json(
      { message: "مجوز دسترسی به اعلان‌های انتصابات را ندارید." },
      { status: 403 },
    );
  }

  try {
    const rows = await listAppointmentWorkflow(session.userId);
    const pending = rows.filter(
      (row) => row.RecordState === 2 && row.CanDecide,
    );
    const items = pending.slice(0, 20).map((row) => ({
      entesabId: row.EntesabId,
      fullName: row.FullName,
      postTitle: row.PostOnvan,
      requesterFullName: row.RequesterFullName,
      createDateTime: row.CreateDateTime,
      unread: row.UnreadReferrals > 0,
    }));

    return NextResponse.json({
      pendingCount: pending.length,
      unreadCount: pending.filter((row) => row.UnreadReferrals > 0).length,
      items,
    });
  } catch (error) {
    console.error("Appointment notifications GET failed", error);
    return NextResponse.json(
      { message: "دریافت اعلان‌های انتصابات با خطا روبه‌رو شد." },
      { status: 500 },
    );
  }
}
