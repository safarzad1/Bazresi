import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import { deleteFarzand, listFarzand, saveFarzand } from "@/lib/farzand-db";

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
  return error instanceof Error && error.message ? error.message : "عملیات اطلاعات فرزندان با خطا روبه‌رو شد.";
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
    return NextResponse.json({ rows: await listFarzand(personId) });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

async function save(request: NextRequest, isEdit: boolean) {
  const a = await auth();
  if (!a.session) return a.response;
  try {
    const body = (await request.json()) as Body;
    const id = positiveId(body.id);
    const personId = positiveId(body.personId);
    const nameFarzand = textValue(body.nameFarzand, 250);
    const shoghlFarzand = textValue(body.shoghlFarzand, 250);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    if (isEdit && !id) return NextResponse.json({ message: "شناسه فرزند معتبر نیست." }, { status: 400 });
    if (!nameFarzand) return NextResponse.json({ message: "نام و نام خانوادگی فرزند را وارد کنید." }, { status: 400 });

    const row = await saveFarzand({ id: isEdit ? id : 0, personId, nameFarzand, shoghlFarzand, actorUserId: a.session.userId });
    return NextResponse.json({ message: isEdit ? "اطلاعات فرزند ویرایش شد." : "فرزند جدید ثبت شد.", row }, { status: isEdit ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) { return save(request, false); }
export async function PUT(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  const a = await auth();
  if (!a.session) return a.response;
  try {
    const body = (await request.json()) as Body;
    const id = positiveId(body.id);
    const personId = positiveId(body.personId);
    if (!id || !personId) return NextResponse.json({ message: "شناسه فرزند یا شخص معتبر نیست." }, { status: 400 });
    await deleteFarzand(id, personId);
    return NextResponse.json({ message: "اطلاعات فرزند حذف شد." });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
