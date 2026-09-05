import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import { deleteHamsar, getHamsar, saveHamsar } from "@/lib/hamsar-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

function positiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}
function textValue(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "عملیات اطلاعات همسر با خطا روبه‌رو شد.";
}
async function auth() {
  const session = await getCurrentSession();
  if (!session) return { session: null, response: NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 }) };
  if (!sessionHasMenu(session, ACCESS_MENU.persons)) return { session: null, response: NextResponse.json({ message: "دسترسی به بخش اشخاص برای شما فعال نیست." }, { status: 403 }) };
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const a = await auth();
  if (!a.session) return a.response;
  try {
    const personId = positiveId(request.nextUrl.searchParams.get("personId"));
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    return NextResponse.json({ row: await getHamsar(personId) });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const a = await auth();
  if (!a.session) return a.response;
  try {
    const body = (await request.json()) as Body;
    const personId = positiveId(body.personId);
    const nameHamsar = textValue(body.nameHamsar, 250);
    const shoghlHamsar = textValue(body.shoghlHamsar, 250);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    if (!nameHamsar) return NextResponse.json({ message: "نام و نام خانوادگی همسر را وارد کنید." }, { status: 400 });

    const row = await saveHamsar({ personId, nameHamsar, shoghlHamsar, actorUserId: a.session.userId });
    return NextResponse.json({ message: "اطلاعات همسر با موفقیت ذخیره شد.", row });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const a = await auth();
  if (!a.session) return a.response;
  try {
    const body = (await request.json()) as Body;
    const personId = positiveId(body.personId);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    await deleteHamsar(personId);
    return NextResponse.json({ message: "اطلاعات همسر با موفقیت حذف شد." });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
