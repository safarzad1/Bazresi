import { NextRequest, NextResponse } from "next/server";
import { getCancellationProposalDocument } from "@/lib/cancellation-proposals-db";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ proposalId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });
  if (!session.permissions.appointments && !session.isSystemAdmin) return NextResponse.json({ message: "مجوز دسترسی به انتصابات را ندارید." }, { status: 403 });

  const params = await context.params;
  const proposalId = Number(params.proposalId);
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) {
    return NextResponse.json({ message: "شناسه پیشنهاد معتبر نیست." }, { status: 400 });
  }

  try {
    const document = await getCancellationProposalDocument(session.userId, proposalId);
    if (!document) return NextResponse.json({ message: "تصویر فرم پیدا نشد یا مجوز مشاهده آن را ندارید." }, { status: 404 });

    return new Response(new Uint8Array(document.FileData), {
      headers: {
        "Content-Type": document.ContentType,
        "Content-Length": String(document.FileSize),
        "Cache-Control": "private, no-store",
        "ETag": document.DocumentHash ? `\"${document.DocumentHash}\"` : "",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Cancellation document read failed:", error);
    return NextResponse.json({ message: "دریافت تصویر فرم انجام نشد." }, { status: 500 });
  }
}
