import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { deleteIsargari, getIsargari, saveIsargari } from "@/lib/isargari-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;
const id = (v: unknown) => { const n = Number(v); return Number.isSafeInteger(n) && n > 0 ? n : 0; };
const intOrNull = (v: unknown) => { if (v === "" || v === null || v === undefined) return null; const n = Number(v); return Number.isInteger(n) ? n : null; };
const txt = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const flag = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";
function message(error: unknown) { return error instanceof Error ? error.message.slice(-350) : "عملیات اطلاعات ایثارگری با خطا روبه‌رو شد."; }

async function sessionOrResponse() {
  const session = await getCurrentSession();
  return session ? { session, response: null } : { session: null, response: NextResponse.json({ message: "نشست شما منقضی شده است؛ دوباره وارد شوید." }, { status: 401 }) };
}

export async function GET(request: NextRequest) {
  const auth = await sessionOrResponse(); if (!auth.session) return auth.response;
  try {
    const personId = id(request.nextUrl.searchParams.get("personId"));
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    return NextResponse.json({ row: await getIsargari(personId) });
  } catch (e) { return NextResponse.json({ message: message(e) }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await sessionOrResponse(); if (!auth.session) return auth.response;
  try {
    const b = (await request.json()) as Body;
    const personId = id(b.personId);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    const row = await saveIsargari({
      id: id(b.id), personId,
      JebheSal: intOrNull(b.jebheSal), JebheMah: intOrNull(b.jebheMah), JebheRoz: intOrNull(b.jebheRoz),
      Janbaz: flag(b.janbaz), DarsadJanbazi: intOrNull(b.darsadJanbazi), MarjaTaeid: txt(b.marjaTaeid, 250) || null,
      Azadeh: flag(b.azadeh), AsaratSal: intOrNull(b.asaratSal), AsaratMah: intOrNull(b.asaratMah), AsaratRoz: intOrNull(b.asaratRoz),
      KhanevadeShahid: flag(b.khanevadeShahid), NameShahid: txt(b.nameShahid, 500) || null,
      TarikhMahalShahadat: txt(b.tarikhMahalShahadat, 500) || null, NesbatBaShahid: txt(b.nesbatBaShahid, 150) || null,
      actorUserId: auth.session.userId,
    });
    return NextResponse.json({ message: "اطلاعات ایثارگری با موفقیت ذخیره شد.", row }, { status: 201 });
  } catch (e) { return NextResponse.json({ message: message(e) }, { status: 500 }); }
}

export async function PUT(request: NextRequest) { return POST(request); }

export async function DELETE(request: NextRequest) {
  const auth = await sessionOrResponse(); if (!auth.session) return auth.response;
  try {
    const b = (await request.json()) as Body; const personId = id(b.personId);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    await deleteIsargari(personId);
    return NextResponse.json({ message: "اطلاعات ایثارگری حذف شد." });
  } catch (e) { return NextResponse.json({ message: message(e) }, { status: 500 }); }
}
