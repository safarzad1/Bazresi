import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import {
  deleteSabegheEntekhabat,
  listSabegheEntekhabat,
  saveSabegheEntekhabat,
  type SabegheEntekhabatWriteInput,
} from "@/lib/sabeghe-entekhabat-db";

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
  return "انجام عملیات سابقه داوطلبی در انتخابات با خطا روبه‌رو شد.";
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
function parseBody(body: Body, actorUserId: string) {
  const id = positiveId(body.id);
  const personId = positiveId(body.personId);
  const noeEntekhabat = textValue(body.noeEntekhabat, 150);
  const hozeEntekhabieh = textValue(body.hozeEntekhabieh, 250);
  const natijeh = textValue(body.natijeh, 250);

  if (!personId) return { error: "شناسه شخص معتبر نیست.", value: null };
  if (!noeEntekhabat) return { error: "نوع انتخابات را وارد کنید.", value: null };
  if (!hozeEntekhabieh) return { error: "حوزه انتخابیه را وارد کنید.", value: null };

  const value: SabegheEntekhabatWriteInput = {
    id, personId, noeEntekhabat, hozeEntekhabieh, natijeh, actorUserId,
  };
  return { error: null, value };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;
  try {
    const personId = positiveId(request.nextUrl.searchParams.get("personId"));
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    return NextResponse.json({ rows: await listSabegheEntekhabat(personId) });
  } catch (error) {
    console.error("SabegheEntekhabat GET failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;
  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    const row = await saveSabegheEntekhabat({ ...parsed.value, id: 0 });
    return NextResponse.json({ message: "سابقه داوطلبی با موفقیت ثبت شد.", row }, { status: 201 });
  } catch (error) {
    console.error("SabegheEntekhabat POST failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;
  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    if (!parsed.value.id) return NextResponse.json({ message: "شناسه سابقه معتبر نیست." }, { status: 400 });
    const row = await saveSabegheEntekhabat(parsed.value);
    return NextResponse.json({ message: "سابقه داوطلبی با موفقیت ویرایش شد.", row });
  } catch (error) {
    console.error("SabegheEntekhabat PUT failed:", error);
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
    if (!id || !personId) return NextResponse.json({ message: "شناسه سابقه یا شخص معتبر نیست." }, { status: 400 });
    await deleteSabegheEntekhabat(id, personId);
    return NextResponse.json({ message: "سابقه داوطلبی با موفقیت حذف شد." });
  } catch (error) {
    console.error("SabegheEntekhabat DELETE failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
