import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  deletePerson,
  getPerson,
  getPersonLookups,
  listPersons,
  savePerson,
  searchMainPersons,
  validatePersonMobileNumber,
  validatePersonNationalCode,
  type PersonWriteInput,
} from "@/lib/persons-db";
import { toLatinDigits } from "@/Utils/nationalCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersonBody = Record<string, unknown>;

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalText(value: unknown, maxLength: number) {
  return textValue(value, maxLength) || null;
}

function latinDigits(value: string) {
  return toLatinDigits(value);
}

function optionalInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function personIdValue(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*?THROW[^:]*:\s*/i, "").trim();
    if (message && message.length <= 350) return message;
  }
  return "انجام عملیات اشخاص با خطا روبه‌رو شد.";
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

function parseBody(body: PersonBody, isFinal: boolean, actorUserId: string) {
  const codeMelli = latinDigits(textValue(body.codeMelli, 50));
  const codeMelliSarparast = latinDigits(textValue(body.codeMelliSarparast, 50));
  const telHamrah = latinDigits(textValue(body.telHamrah, 15));
  const telZaruri = latinDigits(textValue(body.telZaruri, 15));
  const email = textValue(body.email, 1500);
  const tarikhTavalod = latinDigits(textValue(body.tarikhTavalod, 10));

  if (isFinal) {
    if (!/^\d{10}$/.test(codeMelli)) return { error: "کد ملی باید دقیقاً ۱۰ رقم باشد." };
    if (textValue(body.firstName, 150).length < 2 || textValue(body.lastName, 150).length < 2) {
      return { error: "نام و نام خانوادگی را کامل وارد کنید." };
    }
    if (textValue(body.fatherName, 150).length < 2) return { error: "نام پدر را وارد کنید." };
    if (!textValue(body.shomareShenasnameh, 20)) return { error: "شماره شناسنامه را وارد کنید." };
  }

  if (codeMelli && !/^\d{1,10}$/.test(codeMelli)) return { error: "کد ملی فقط باید شامل رقم باشد." };
  if (codeMelliSarparast && !/^\d{10}$/.test(codeMelliSarparast)) return { error: "کد ملی سرپرست باید ۱۰ رقم باشد." };
  if (telHamrah && !/^09\d{9}$/.test(telHamrah)) return { error: "شماره همراه باید ۱۱ رقم و با 09 شروع شود." };
  if (telZaruri && !/^0\d{9,10}$/.test(telZaruri)) return { error: "شماره تماس ضروری معتبر نیست." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "نشانی ایمیل معتبر نیست." };
  if (tarikhTavalod && !/^\d{4}\/\d{2}\/\d{2}$/.test(tarikhTavalod)) return { error: "تاریخ تولد باید به شکل 1400/01/01 باشد." };

  const value: PersonWriteInput = {
    personId: personIdValue(body.personId),
    isFinal,
    codeMelli,
    codeMelliSarparast: codeMelliSarparast || null,
    nesbat: optionalInteger(body.nesbat),
    firstName: textValue(body.firstName, 150),
    lastName: textValue(body.lastName, 150),
    fatherName: textValue(body.fatherName, 150),
    tarikhTavalod: tarikhTavalod || null,
    shomareShenasnameh: latinDigits(textValue(body.shomareShenasnameh, 20)),
    life: optionalInteger(body.life),
    tarikhFoat: optionalText(body.tarikhFoat, 50),
    mahalTavalod: optionalInteger(body.mahalTavalod),
    mahalSodor: optionalInteger(body.mahalSodor),
    serialHarf: optionalText(body.serialHarf, 3),
    serialSeri: optionalText(body.serialSeri, 50),
    serialCode: optionalText(body.serialCode, 50),
    almosana: optionalInteger(body.almosana),
    firstNameOld: optionalText(body.firstNameOld, 250),
    lastNameOld: optionalText(body.lastNameOld, 150),
    taghyiratShenasnamehSet: optionalInteger(body.taghyiratShenasnamehSet),
    taghyiratShenasnameh: optionalText(body.taghyiratShenasnameh, 1500),
    jensiat: optionalInteger(body.jensiat),
    shoghl: textValue(body.shoghl, 50),
    taahol: optionalInteger(body.taahol),
    dinMazhab: optionalInteger(body.dinMazhab),
    rohani: optionalInteger(body.rohani),
    nezamVazifeh: optionalInteger(body.nezamVazifeh),
    tarikhShoro: optionalText(body.tarikhShoro, 10),
    tarikhPayan: optionalText(body.tarikhPayan, 10),
    noeMoaafiat: optionalInteger(body.noeMoaafiat),
    tarikhMoaafiat: optionalText(body.tarikhMoaafiat, 50),
    sharhMoaafiat: optionalText(body.sharhMoaafiat, 1500),
    email: email || null,
    telHamrah: telHamrah || null,
    telZaruri: telZaruri || null,
    actorUserId,
  };

  return { error: null, value };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const mode = request.nextUrl.searchParams.get("mode");
    if (mode === "lookups") return NextResponse.json(await getPersonLookups());
    if (mode === "head-lookup") {
      const search = textValue(request.nextUrl.searchParams.get("search"), 150);
      return NextResponse.json({ mainPersons: await searchMainPersons(search) });
    }
    if (mode === "validate-national-code") {
      const nationalCode = latinDigits(textValue(request.nextUrl.searchParams.get("nationalCode"), 10));
      if (!/^\d{10}$/.test(nationalCode)) return NextResponse.json({ isValid: false });
      return NextResponse.json({ isValid: await validatePersonNationalCode(nationalCode) });
    }

    const personId = personIdValue(request.nextUrl.searchParams.get("personId"));
    if (personId) {
      const person = await getPerson(personId);
      if (!person) return NextResponse.json({ message: "شخص موردنظر پیدا نشد." }, { status: 404 });
      return NextResponse.json({ person });
    }

    const search = textValue(request.nextUrl.searchParams.get("search"), 200);
    const stateText = request.nextUrl.searchParams.get("state");
    const state = stateText === "0" || stateText === "1" ? Number(stateText) : null;
    const page = boundedInteger(request.nextUrl.searchParams.get("page"), 1, 1, 1_000_000);
    const pageSize = boundedInteger(request.nextUrl.searchParams.get("pageSize"), 10, 5, 100);
    const result = await listPersons(search, state, page, pageSize);
    return NextResponse.json({ ...result, page, pageSize });
  } catch (error) {
    console.error("Person request failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as PersonBody, false, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    if (parsed.value.codeMelli.length === 10 && !(await validatePersonNationalCode(parsed.value.codeMelli))) {
      return NextResponse.json({ message: "کد ملی واردشده معتبر نیست." }, { status: 400 });
    }
    if (parsed.value.telHamrah && !(await validatePersonMobileNumber(parsed.value.telHamrah))) {
      return NextResponse.json({ message: "شماره تلفن همراه معتبر نیست." }, { status: 400 });
    }
    const person = await savePerson(parsed.value);
    return NextResponse.json({ message: "پیش‌نویس با موفقیت ذخیره شد.", person }, { status: 201 });
  } catch (error) {
    console.error("Person draft save failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = parseBody((await request.json()) as PersonBody, true, auth.session.userId);
    if (parsed.error || !parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
    if (!(await validatePersonNationalCode(parsed.value.codeMelli))) {
      return NextResponse.json({ message: "کد ملی واردشده معتبر نیست." }, { status: 400 });
    }
    if (parsed.value.telHamrah && !(await validatePersonMobileNumber(parsed.value.telHamrah))) {
      return NextResponse.json({ message: "شماره تلفن همراه معتبر نیست." }, { status: 400 });
    }
    const person = await savePerson(parsed.value);
    return NextResponse.json({ message: "اطلاعات شخص تأیید و ثبت نهایی شد.", person });
  } catch (error) {
    console.error("Person final save failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const body = (await request.json()) as PersonBody;
    const personId = personIdValue(body.personId);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    await deletePerson(personId, auth.session.userId);
    return NextResponse.json({ message: "شخص با موفقیت حذف شد." });
  } catch (error) {
    console.error("Person delete failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
