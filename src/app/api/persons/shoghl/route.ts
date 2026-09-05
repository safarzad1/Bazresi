import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import { deleteShoghl, listShoghl, saveShoghl, type ShoghlWriteInput } from "@/lib/shoghl-db";
import { toLatinDigits } from "@/Utils/nationalCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShoghlBody = Record<string, unknown>;

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function positiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeDate(value: unknown) {
  const date = toLatinDigits(textValue(value, 25));
  return date || null;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*?THROW[^:]*:\s*/i, "").trim();
    if (message && message.length <= 350) return message;
  }
  return "انجام عملیات سوابق شغلی با خطا روبه‌رو شد.";
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
  if (!sessionHasMenu(session, ACCESS_MENU.persons)) {
    return {
      session: null,
      response: NextResponse.json({ message: "دسترسی به بخش اشخاص برای شما فعال نیست." }, { status: 403 }),
    };
  }
  return { session, response: null };
}

function parseBody(body: ShoghlBody, actorUserId: string) {
  const id = positiveId(body.id);
  const personId = positiveId(body.personId);
  const mahal = positiveId(body.mahal);
  const sematPostSazmani = textValue(body.sematPostSazmani, 150);
  const azTarikh = normalizeDate(body.azTarikh);
  const taTarikh = normalizeDate(body.taTarikh);

  if (!personId) return { error: "شناسه شخص معتبر نیست.", value: null };
  if (!mahal) return { error: "محل خدمت (شهرستان) را انتخاب کنید.", value: null };
  if (!sematPostSazmani) return { error: "سمت (پست سازمانی) را وارد کنید.", value: null };
  if (azTarikh && !/^\d{4}\/\d{2}\/\d{2}$/.test(azTarikh)) {
    return { error: "تاریخ شروع باید به شکل 1405/01/01 باشد.", value: null };
  }
  if (taTarikh && !/^\d{4}\/\d{2}\/\d{2}$/.test(taTarikh)) {
    return { error: "تاریخ پایان باید به شکل 1405/01/01 باشد.", value: null };
  }
  if (azTarikh && taTarikh && taTarikh < azTarikh) {
    return { error: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.", value: null };
  }

  const value: ShoghlWriteInput = {
    id,
    personId,
    mahal,
    sematPostSazmani,
    azTarikh,
    taTarikh,
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
    return NextResponse.json({ rows: await listShoghl(personId) });
  } catch (error) {
    console.error("Shoghl GET failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as ShoghlBody, auth.session.userId);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }
    const row = await saveShoghl({ ...parsed.value, id: 0 });
    return NextResponse.json({ message: "سابقه شغلی با موفقیت ثبت شد.", row }, { status: 201 });
  } catch (error) {
    console.error("Shoghl POST failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as ShoghlBody, auth.session.userId);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }
    if (!parsed.value.id) {
      return NextResponse.json({ message: "شناسه سابقه شغلی معتبر نیست." }, { status: 400 });
    }
    const row = await saveShoghl(parsed.value);
    return NextResponse.json({ message: "سابقه شغلی با موفقیت ویرایش شد.", row });
  } catch (error) {
    console.error("Shoghl PUT failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const body = (await request.json()) as ShoghlBody;
    const id = positiveId(body.id);
    const personId = positiveId(body.personId);
    if (!id || !personId) {
      return NextResponse.json({ message: "شناسه سابقه شغلی یا شخص معتبر نیست." }, { status: 400 });
    }
    await deleteShoghl(id, personId);
    return NextResponse.json({ message: "سابقه شغلی با موفقیت حذف شد." });
  } catch (error) {
    console.error("Shoghl DELETE failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
