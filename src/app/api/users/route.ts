import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashAspNetIdentityPassword } from "@/lib/password";
import { getCurrentSession } from "@/lib/session";
import {
  createUser,
  deleteUser,
  getUserLookups,
  listUsers,
  updateUser,
  type UserWriteInput,
} from "@/lib/users-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserBody = {
  userId?: unknown;
  userName?: unknown;
  fullName?: unknown;
  telHamrah?: unknown;
  nationalCode?: unknown;
  sematId?: unknown;
  mahalId?: unknown;
  email?: unknown;
  password?: unknown;
  isActive?: unknown;
  changePassword?: unknown;
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function textValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function optionalId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function boolValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function formatCreateDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    timeZone: process.env.AUTH_TIME_ZONE ?? "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value.padStart(2, "0") ?? "00";

  return `${part("year")}/${part("month")}/${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*?THROW[^:]*:\s*/i, "").trim();
    if (message && message.length <= 300) return message;
  }
  return "انجام عملیات کاربران با خطا روبه‌رو شد.";
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

function validateBody(body: UserBody, editing: boolean) {
  const userId = textValue(body.userId, 450);
  const userName = textValue(body.userName, 100);
  const fullName = textValue(body.fullName, 100);
  const telHamrah = latinDigits(textValue(body.telHamrah, 50));
  const nationalCode = latinDigits(textValue(body.nationalCode, 10));
  const email = textValue(body.email, 256);
  const password = typeof body.password === "string" ? body.password : "";

  if (editing && !userId) return { error: "شناسه کاربر معتبر نیست." };
  if (userName.length < 3) return { error: "نام کاربری باید حداقل ۳ نویسه باشد." };
  if (fullName.length < 3) return { error: "نام و نام خانوادگی را کامل وارد کنید." };
  if (!/^\d{10}$/.test(nationalCode)) return { error: "کد ملی باید دقیقاً ۱۰ رقم باشد." };
  if (telHamrah && !/^09\d{9}$/.test(telHamrah)) return { error: "شماره همراه باید ۱۱ رقم و با 09 شروع شود." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "نشانی ایمیل معتبر نیست." };
  if ((!editing || password) && (password.length < 6 || password.length > 256)) {
    return { error: "رمز عبور باید حداقل ۶ نویسه باشد." };
  }

  return {
    error: null,
    value: {
      userId,
      userName,
      fullName,
      telHamrah: telHamrah || null,
      nationalCode,
      sematId: optionalId(body.sematId),
      mahalId: optionalId(body.mahalId),
      email: email || null,
      password,
      isActive: boolValue(body.isActive, true),
      changePassword: boolValue(body.changePassword),
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    if (request.nextUrl.searchParams.get("mode") === "lookups") {
      return NextResponse.json(await getUserLookups());
    }

    const search = textValue(request.nextUrl.searchParams.get("search"), 250);
    const onlyActive = request.nextUrl.searchParams.get("onlyActive") === "1";
    const page = boundedInteger(request.nextUrl.searchParams.get("page"), 1, 1, 1_000_000);
    const pageSize = boundedInteger(request.nextUrl.searchParams.get("pageSize"), 15, 5, 100);
    const result = await listUsers(search, onlyActive, page, pageSize);
    return NextResponse.json({ ...result, page, pageSize });
  } catch (error) {
    console.error("User list failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = validateBody((await request.json()) as UserBody, false);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }

    const value = parsed.value;
    const input: UserWriteInput = {
      ...value,
      userId: randomUUID(),
      passwordHash: await hashAspNetIdentityPassword(value.password),
      securityStamp: randomUUID().replaceAll("-", "").toUpperCase(),
      concurrencyStamp: randomUUID(),
      actorUserId: auth.session.userId,
      createDateTime: formatCreateDateTime(new Date()),
    };
    const user = await createUser(input);
    return NextResponse.json({ message: "کاربر با موفقیت ثبت شد.", user }, { status: 201 });
  } catch (error) {
    console.error("User create failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const parsed = validateBody((await request.json()) as UserBody, true);
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }

    const value = parsed.value;
    const hasNewPassword = Boolean(value.password);
    const input: UserWriteInput = {
      ...value,
      passwordHash: hasNewPassword
        ? await hashAspNetIdentityPassword(value.password)
        : null,
      securityStamp: hasNewPassword
        ? randomUUID().replaceAll("-", "").toUpperCase()
        : null,
      concurrencyStamp: randomUUID(),
      actorUserId: auth.session.userId,
      createDateTime: formatCreateDateTime(new Date()),
    };
    const user = await updateUser(input);
    return NextResponse.json({ message: "اطلاعات کاربر ویرایش شد.", user });
  } catch (error) {
    console.error("User update failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.session) return auth.response;

  try {
    const body = (await request.json()) as { userId?: unknown };
    const userId = textValue(body.userId, 450);
    if (!userId) {
      return NextResponse.json({ message: "شناسه کاربر معتبر نیست." }, { status: 400 });
    }
    if (userId === auth.session.userId) {
      return NextResponse.json(
        { message: "امکان حذف حساب کاربری در حال استفاده وجود ندارد." },
        { status: 409 },
      );
    }

    await deleteUser(
      userId,
      auth.session.userId,
      randomUUID().replaceAll("-", "").toUpperCase(),
    );
    return NextResponse.json({ message: "کاربر با موفقیت حذف شد." });
  } catch (error) {
    console.error("User delete failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
