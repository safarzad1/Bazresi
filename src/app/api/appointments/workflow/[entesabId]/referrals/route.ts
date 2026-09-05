import { NextRequest, NextResponse } from "next/server";
import { appointmentReferralAction } from "@/lib/appointment-workflow-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ entesabId: string }> };
type ReferralAction = "forward" | "reply" | "recall" | "archive" | "restore";

function validId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export async function POST(request: NextRequest, context: Context) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });
  if (!sessionHasMenu(session, ACCESS_MENU.appointmentsWorkflow)) {
    return NextResponse.json({ message: "مجوز مدیریت ارجاعات انتصابات را ندارید." }, { status: 403 });
  }

  const entesabId = validId((await context.params).entesabId);
  if (!entesabId) return NextResponse.json({ message: "شناسه درخواست معتبر نیست." }, { status: 400 });

  try {
    const body = await request.json() as { action?: unknown; referralId?: unknown; destinationPostIds?: unknown; note?: unknown };
    const action = String(body.action || "") as ReferralAction;
    if (!["forward", "reply", "recall", "archive", "restore"].includes(action)) {
      return NextResponse.json({ message: "عملیات ارجاع معتبر نیست." }, { status: 400 });
    }

    const referralId = validId(body.referralId) || null;
    const destinationPostIds = Array.isArray(body.destinationPostIds)
      ? [...new Set(body.destinationPostIds.map(validId).filter(Boolean))].slice(0, 10)
      : [];
    const note = String(body.note || "").trim().slice(0, 1000) || null;

    if (action === "forward" && !destinationPostIds.length) {
      return NextResponse.json({ message: "حداقل یک گیرنده برای ارجاع انتخاب کنید." }, { status: 400 });
    }
    if (["reply", "recall", "archive", "restore"].includes(action) && !referralId) {
      return NextResponse.json({ message: "ارجاع موردنظر انتخاب نشده است." }, { status: 400 });
    }
    if (["forward", "reply"].includes(action) && !note) {
      return NextResponse.json({ message: "درج توضیحات ارجاع یا پاسخ الزامی است." }, { status: 400 });
    }

    const result = await appointmentReferralAction({
      actorUserId: session.userId,
      entesabId,
      action,
      referralId,
      destinationPostIds,
      note,
    });

    const messages: Record<ReferralAction, string> = {
      forward: "درخواست برای گیرنده‌های انتخاب‌شده ارجاع شد.",
      reply: "پاسخ ارجاع ثبت و برای ارجاع‌دهنده ارسال شد.",
      recall: "ارجاع خوانده‌نشده بازپس‌گیری شد.",
      archive: "ارجاع در کارتابل شما بایگانی شد.",
      restore: "ارجاع از بایگانی خارج شد.",
    };
    return NextResponse.json({ message: messages[action], ...result });
  } catch (error) {
    console.error("Appointment referral action failed", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "ثبت عملیات ارجاع انجام نشد." }, { status: 500 });
  }
}
