import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  deleteSabegheFaliyatEjtemai,
  listSabegheFaliyatEjtemai,
  saveSabegheFaliyatEjtemai,
  type SabegheFaliyatEjtemaiWriteInput,
} from "@/lib/sabeghe-faliyat-ejtemai-db";

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
  return "انجام عملیات سوابق فعالیت‌های اجتماعی با خطا روبه‌رو شد.";
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
  const nameNahadTashakolHezb = textValue(body.nameNahadTashakolHezb, 250);
  const mahal = positiveId(body.mahal);
  const azTarikh = textValue(body.azTarikh, 25);
  const taTarikh = textValue(body.taTarikh, 25);
  const molahazat = textValue(body.molahazat, 1000);

  if (!personId) return { error: "شناسه شخص معتبر نیست.", value: null };
  if (!nameNahadTashakolHezb) return { error: "نام نهاد، تشکل یا حزب را وارد کنید.", value: null };
  if (!mahal) return { error: "محل فعالیت را انتخاب کنید.", value: null };

  const value: SabegheFaliyatEjtemaiWriteInput = {
    id,
    personId,
    nameNahadTashakolHezb,
    mahal,
    azTarikh,
    taTarikh,
    molahazat,
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

    return NextResponse.json({ rows: await listSabegheFaliyatEjtemai(personId) });
  } catch (error) {
    console.error("SabegheFaliyatEjtemai GET failed:", error);
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
    const row = await saveSabegheFaliyatEjtemai({ ...parsed.value, id: 0 });
    return NextResponse.json({ message: "سابقه فعالیت اجتماعی با موفقیت ثبت شد.", row }, { status: 201 });
  } catch (error) {
    console.error("SabegheFaliyatEjtemai POST failed:", error);
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
    const row = await saveSabegheFaliyatEjtemai(parsed.value);
    return NextResponse.json({ message: "سابقه فعالیت اجتماعی با موفقیت ویرایش شد.", row });
  } catch (error) {
    console.error("SabegheFaliyatEjtemai PUT failed:", error);
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
    await deleteSabegheFaliyatEjtemai(id, personId);
    return NextResponse.json({ message: "سابقه فعالیت اجتماعی با موفقیت حذف شد." });
  } catch (error) {
    console.error("SabegheFaliyatEjtemai DELETE failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
