import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCancellationFormSettings } from "@/lib/cancellation-form-settings-db";
import {
  createCancellationProposal,
  getCancellationProposalByEntesab,
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

function jsonValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isPng(buffer: Buffer) {
  return buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && error.message.length <= 500) return error.message;
  return fallback;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 });
  if (!session.permissions.appointments && !session.isSystemAdmin) return NextResponse.json({ message: "مجوز دسترسی به انتصابات را ندارید." }, { status: 403 });

  const entesabId = await entesabIdFrom(context);
  if (!entesabId) return NextResponse.json({ message: "شناسه انتصاب معتبر نیست." }, { status: 400 });

  try {
    const [draft, settings, existingProposal] = await Promise.all([
      getCancellationProposalDraft(session.userId, entesabId),
      getCancellationFormSettings(),
      getCancellationProposalByEntesab(session.userId, entesabId),
    ]);
    if (!draft) {
      return NextResponse.json(
        { message: "این ابلاغ قابل لغو نیست، مجوز آن را ندارید یا قبلاً برای آن پیشنهاد لغو ثبت شده است." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      draft,
      settings,
      canEditSettings: session.isSystemAdmin,
      reasons: existingProposal?.reasons ?? [],
      proposalId: existingProposal?.proposalId,
      documentUrl: existingProposal
        ? `/api/appointments/cancellation-proposals/${existingProposal.proposalId}/document`
        : undefined,
    });
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
  if (!session.permissions.appointments && !session.isSystemAdmin) return NextResponse.json({ message: "مجوز دسترسی به انتصابات را ندارید." }, { status: 403 });

  const entesabId = await entesabIdFrom(context);
  if (!entesabId) return NextResponse.json({ message: "شناسه انتصاب معتبر نیست." }, { status: 400 });

  try {
    const formData = await request.formData();
    const reasons = cleanReasons(jsonValue(formData.get("reasons")));
    const formImage = formData.get("formImage");
    if (!reasons.length) return NextResponse.json({ message: "حداقل یک دلیل لغو ابلاغ وارد کنید." }, { status: 400 });
    if (reasons.some((reason) => reason.length > 220)) {
      return NextResponse.json({ message: "هر دلیل باید حداکثر ۲۲۰ نویسه باشد." }, { status: 400 });
    }
    if (!(formImage instanceof File)) {
      return NextResponse.json({ message: "تصویر فرم لغو ابلاغ ارسال نشده است." }, { status: 400 });
    }
    if (formImage.size < 100 || formImage.size > 12 * 1024 * 1024) {
      return NextResponse.json({ message: "حجم تصویر فرم باید حداکثر ۱۲ مگابایت باشد." }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await formImage.arrayBuffer());
    if (!isPng(imageBuffer)) {
      return NextResponse.json({ message: "فایل فرم باید تصویر PNG معتبر باشد." }, { status: 400 });
    }

    const draft = await getCancellationProposalDraft(session.userId, entesabId);
    if (!draft) {
      return NextResponse.json(
        { message: "این ابلاغ قابل لغو نیست، مجوز آن را ندارید یا قبلاً برای آن پیشنهاد لغو ثبت شده است." },
        { status: 409 },
      );
    }

    const documentHash = createHash("sha256").update(imageBuffer).digest("hex");
    const formFileName = `${randomUUID()}.png`;
    const saved = await createCancellationProposal(
      session.userId,
      entesabId,
      reasons,
      formFileName,
      "image/png",
      imageBuffer,
      documentHash,
    );

    return NextResponse.json({
      message: "لغو ابلاغ، دلایل و پیوست PNG نامه ثبت شد.",
      proposalId: saved.proposalId,
      documentHash: saved.documentHash,
      documentUrl: `/api/appointments/cancellation-proposals/${saved.proposalId}/document`,
    });
  } catch (error) {
    console.error("Cancellation proposal create failed:", error);
    return NextResponse.json(
      { message: errorMessage(error, "ثبت لغو ابلاغ انجام نشد.") },
      { status: 500 },
    );
  }
}
