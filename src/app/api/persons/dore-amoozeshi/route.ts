import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  deleteDoreAmozeshi,
  listDoreAmozeshi,
  saveDoreAmozeshi,
  type DoreAmozeshiWriteInput,
} from "@/lib/dore-amoozeshi-db";

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
function positiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*?THROW[^:]*:\s*/i, "").trim();
    if (message && message.length <= 350) return message;
  }
  return "انجام عملیات دوره‌های آموزشی با خطا روبه‌رو شد.";
}
async function requireSession() {
  const session = await getCurrentSession();
  if (!session) return { session: null, response: NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 }) };
  return { session, response: null };
}
function parseBody(body: Body, actorUserId: string) {
  const id = positiveId(body.id);
  const personId = positiveId(body.personId);
  const nameDore = textValue(body.nameDore, 250);
  const modatSaat = positiveNumber(body.modatSaat);
  const nameMarkazMahalAmozesh = textValue(body.nameMarkazMahalAmozesh, 300);
  const noeMadrak = positiveId(body.noeMadrak);
  const tarikhAkhzMadrak = textValue(body.tarikhAkhzMadrak, 25);
  if (!personId) return { error: "شناسه شخص معتبر نیست.", value: null };
  if (!nameDore) return { error: "نام دوره را وارد کنید.", value: null };
  if (!modatSaat) return { error: "مدت دوره به ساعت را صحیح وارد کنید.", value: null };
  if (!nameMarkazMahalAmozesh) return { error: "نام مرکز و محل آموزش را وارد کنید.", value: null };
  if (!noeMadrak) return { error: "نوع مدرک را انتخاب کنید.", value: null };
  const value: DoreAmozeshiWriteInput = { id, personId, nameDore, modatSaat, nameMarkazMahalAmozesh, noeMadrak, tarikhAkhzMadrak, actorUserId };
  return { error: null, value };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(); if (!auth.session) return auth.response;
  try {
    const personId = positiveId(request.nextUrl.searchParams.get("personId"));
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    return NextResponse.json({ rows: await listDoreAmozeshi(personId) });
  } catch (error) {
    console.error("DoreAmozeshi GET failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  const auth = await requireSession(); if (!auth.session) return auth.response;
  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    const row = await saveDoreAmozeshi({ ...parsed.value, id: 0 });
    return NextResponse.json({ message: "دوره آموزشی با موفقیت ثبت شد.", row }, { status: 201 });
  } catch (error) {
    console.error("DoreAmozeshi POST failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const auth = await requireSession(); if (!auth.session) return auth.response;
  try {
    const parsed = parseBody((await request.json()) as Body, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    if (!parsed.value.id) return NextResponse.json({ message: "شناسه دوره معتبر نیست." }, { status: 400 });
    const row = await saveDoreAmozeshi(parsed.value);
    return NextResponse.json({ message: "دوره آموزشی با موفقیت ویرایش شد.", row });
  } catch (error) {
    console.error("DoreAmozeshi PUT failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const auth = await requireSession(); if (!auth.session) return auth.response;
  try {
    const body = (await request.json()) as Body;
    const id = positiveId(body.id), personId = positiveId(body.personId);
    if (!id || !personId) return NextResponse.json({ message: "شناسه دوره یا شخص معتبر نیست." }, { status: 400 });
    await deleteDoreAmozeshi(id, personId);
    return NextResponse.json({ message: "دوره آموزشی با موفقیت حذف شد." });
  } catch (error) {
    console.error("DoreAmozeshi DELETE failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
