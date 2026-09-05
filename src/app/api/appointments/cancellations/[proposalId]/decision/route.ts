import { NextRequest, NextResponse } from "next/server";
import { decideCancellationProposal } from "@/lib/cancellation-proposals-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ proposalId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 });
  if (!sessionHasMenu(session, ACCESS_MENU.appointmentsCancellations)) {
    return NextResponse.json({ message: "مجوز بررسی درخواست لغو انتصاب را ندارید." }, { status: 403 });
  }

  const { proposalId: rawProposalId } = await context.params;
  const proposalId = Number(rawProposalId);
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) {
    return NextResponse.json({ message: "شناسه درخواست معتبر نیست." }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({})) as { decision?: unknown; note?: unknown };
    const decisionCode = body.decision === "approve" ? 4 : body.decision === "reject" ? 3 : 0;
    if (decisionCode !== 3 && decisionCode !== 4) {
      return NextResponse.json({ message: "نتیجه بررسی معتبر نیست." }, { status: 400 });
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
    if (decisionCode === 3 && !note) {
      return NextResponse.json({ message: "برای عدم تأیید، درج توضیحات الزامی است." }, { status: 400 });
    }

    const result = await decideCancellationProposal(
      session.userId,
      proposalId,
      decisionCode,
      note || null,
    );
    return NextResponse.json({
      ...result,
      message: decisionCode === 4 ? "لغو انتصاب تأیید و ابلاغ جاری خاتمه یافت." : "درخواست لغو انتصاب تأیید نشد.",
    });
  } catch (error) {
    console.error("Cancellation workflow decision failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "ثبت نتیجه بررسی انجام نشد." },
      { status: 500 },
    );
  }
}
