import { NextRequest, NextResponse } from "next/server";
import { buildCancellationDocumentSvg } from "@/lib/cancellation-document";
import {
  buildCancellationLetterBlocks,
  normalizeCancellationLetterFormatting,
} from "@/lib/cancellation-letter-formatting";
import { getCancellationFormSettings } from "@/lib/cancellation-form-settings-db";
import {
  createCancellationProposal,
  getCancellationProposalDraft,
} from "@/lib/cancellation-proposals-db";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ entesabId: string }> };

function positiveId(value: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function entesabIdFrom(context: RouteContext) {
  const params = await context.params;
  return positiveId(params.entesabId);
}

function cleanReasons(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 10);
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && error.message.length <= 500) return error.message;
  return fallback;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 });

  const entesabId = await entesabIdFrom(context);
  if (!entesabId) return NextResponse.json({ message: "شناسه انتصاب معتبر نیست." }, { status: 400 });

  try {
    const [draft, settings] = await Promise.all([
      getCancellationProposalDraft(session.userId, entesabId),
      getCancellationFormSettings(),
    ]);
    if (!draft) {
      return NextResponse.json(
        { message: "این ابلاغ قابل لغو نیست، مجوز آن را ندارید یا قبلاً برای آن پیشنهاد لغو ثبت شده است." },
        { status: 404 },
      );
    }
    return NextResponse.json({ draft, settings, canEditSettings: true });
  } catch (error) {
    console.error("Cancellation proposal draft failed:", error);
    return NextResponse.json(
      { message: errorMessage(error, "دریافت اطلاعات فرم لغو ابلاغ انجام نشد.") },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 });

  const entesabId = await entesabIdFrom(context);
  if (!entesabId) return NextResponse.json({ message: "شناسه انتصاب معتبر نیست." }, { status: 400 });

  try {
    const body = (await request.json().catch(() => ({}))) as { reasons?: unknown; formatting?: unknown };
    const reasons = cleanReasons(body.reasons);
    if (!reasons.length) return NextResponse.json({ message: "حداقل یک دلیل لغو ابلاغ وارد کنید." }, { status: 400 });
    if (reasons.some((reason) => reason.length > 220)) {
      return NextResponse.json({ message: "هر دلیل باید حداکثر ۲۲۰ نویسه باشد." }, { status: 400 });
    }

    const draft = await getCancellationProposalDraft(session.userId, entesabId);
    if (!draft) {
      return NextResponse.json(
        { message: "این ابلاغ قابل لغو نیست، مجوز آن را ندارید یا قبلاً برای آن پیشنهاد لغو ثبت شده است." },
        { status: 409 },
      );
    }

    const settings = await getCancellationFormSettings();
    const blocks = buildCancellationLetterBlocks(draft, reasons);
    const formatting = normalizeCancellationLetterFormatting(body.formatting, blocks);
    const document = buildCancellationDocumentSvg(draft, reasons, settings, formatting);
    const saved = await createCancellationProposal(
      session.userId,
      entesabId,
      reasons,
      document.svg,
      document.hash,
    );

    return NextResponse.json({
      message: "پیشنهاد لغو ابلاغ ثبت و تصویر فرم تهیه شد.",
      proposalId: saved.proposalId,
      documentHash: saved.documentHash,
      documentUrl: `/api/appointments/cancellation-proposals/${saved.proposalId}/document`,
    });
  } catch (error) {
    console.error("Cancellation proposal create failed:", error);
    return NextResponse.json(
      { message: errorMessage(error, "ثبت پیشنهاد لغو ابلاغ انجام نشد.") },
      { status: 500 },
    );
  }
}
