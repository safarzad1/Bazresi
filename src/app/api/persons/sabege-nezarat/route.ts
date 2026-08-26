import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  deleteSabegeNezarat,
  listSabegeNezarat,
  saveSabegeNezarat,
  type SabegeNezaratWriteInput,
} from "@/lib/sabege-nezarat-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function positiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*?THROW[^:]*:\s*/i, "").trim();
    if (message && message.length <= 350) return message;
  }
  return "انجام عملیات سوابق نظارتی و اجرایی انتخابات با خطا روبه‌رو شد.";
}

async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "نشست شما منقضی شده است؛ دوباره وارد شوید." },
        { status: 401 },
      ),
    };
  }
  return { session, response: null };
}

function parseBody(body: Body, actorUserId: string) {
  const id = positiveId(body.id);
  const personId = positiveId(body.personId);
  const doreEntekhabat = textValue(body.doreEntekhabat, 150);
  const sematEntekhabat = textValue(body.sematEntekhabat, 150);
  const mahal = positiveId(body.mahal);

  if (!personId) return { error: "شناسه شخص معتبر نیست.", value: null };
  if (!doreEntekhabat) return { error: "دوره انتخاباتی را وارد کنید.", value: null };
  if (!sematEntekhabat) return { error: "سمت انتخاباتی را وارد کنید.", value: null };
  if (!mahal) return { error: "محل را انتخاب کنید.", value: null };

  const value: SabegeNezaratWriteInput = {
    id,
    personId,
    doreEntekhabat,
    sematEntekhabat,
    mahal,
    actorUserId,
  };

  return { error: null, value };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const personId = positiveId(request.nextUrl.searchParams.get("personId"));
    if (!personId) {
      return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    }

    return NextResponse.json({ rows: await listSabegeNezarat(personId) });
  } catch (error) {
    console.error("SabegeNezarat GET failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }
    const row = await saveSabegeNezarat({ ...parsed.value, id: 0 });
    return NextResponse.json({ message: "سابقه نظارتی و اجرایی با موفقیت ثبت شد.", row }, { status: 201 });
  } catch (error) {
    console.error("SabegeNezarat POST failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }
    if (!parsed.value.id) {
      return NextResponse.json({ message: "شناسه سابقه معتبر نیست." }, { status: 400 });
    }
    const row = await saveSabegeNezarat(parsed.value);
    return NextResponse.json({ message: "سابقه نظارتی و اجرایی با موفقیت ویرایش شد.", row });
  } catch (error) {
    console.error("SabegeNezarat PUT failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const body = (await request.json()) as Body;
    const id = positiveId(body.id);
    const personId = positiveId(body.personId);
    if (!id || !personId) {
      return NextResponse.json({ message: "شناسه سابقه یا شخص معتبر نیست." }, { status: 400 });
    }
    await deleteSabegeNezarat(id, personId);
    return NextResponse.json({ message: "سابقه نظارتی و اجرایی با موفقیت حذف شد." });
  } catch (error) {
    console.error("SabegeNezarat DELETE failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
