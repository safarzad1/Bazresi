import { NextRequest, NextResponse } from "next/server";
import {
  dbBit,
  getLoginUser,
  registerLoginResult,
} from "@/lib/auth-db";
import { verifyAspNetIdentityPassword } from "@/lib/password";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  useSecureCookie,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_LOGIN_ERROR = "نام کاربری یا رمز عبور صحیح نیست.";
const FAKE_IDENTITY_HASH =
  "AQAAAAIAACcQAAAAEK2v3tgg31ZC+YhIrmh1viVb+MiXeIFvh4zjAx8k5lZVd5HjuYy8D7xGq2YgjB6J5g==";

function normalizeUserName(value: unknown) {
  if (typeof value !== "string") return "";

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .trim()
    .replace(/[۰-۹]/g, (char) => String(persianDigits.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(arabicDigits.indexOf(char)));
}

function formatLoginDate(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    timeZone: process.env.AUTH_TIME_ZONE ?? "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.padStart(2, "0") ?? "00";

  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

function isLocked(lockoutEnd: Date | string | null) {
  if (!lockoutEnd) return false;
  const timestamp = new Date(lockoutEnd).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userName?: unknown;
      password?: unknown;
    };
    const userName = normalizeUserName(body.userName);
    const password = typeof body.password === "string" ? body.password : "";

    if (!userName || userName.length > 100 || !password || password.length > 256) {
      return NextResponse.json({ message: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const user = await getLoginUser(userName);

    if (!user) {
      await verifyAspNetIdentityPassword(password, FAKE_IDENTITY_HASH);
      return NextResponse.json({ message: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    if (isLocked(user.LockoutEnd)) {
      return NextResponse.json(
        { message: "حساب کاربری موقتاً قفل است؛ ۱۵ دقیقه دیگر تلاش کنید." },
        { status: 423 },
      );
    }

    const passwordIsValid = user.PasswordHash
      ? await verifyAspNetIdentityPassword(password, user.PasswordHash)
      : false;

    if (!passwordIsValid) {
      await registerLoginResult(user.UserId, false, formatLoginDate(new Date()));
      return NextResponse.json({ message: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    if (!dbBit(user.IsActive) || dbBit(user.IsDelete)) {
      return NextResponse.json(
        { message: "حساب کاربری شما غیرفعال است." },
        { status: 403 },
      );
    }

    await registerLoginResult(user.UserId, true, formatLoginDate(new Date()));

    const token = createSessionToken({
      userId: user.UserId,
      userName: user.UserName,
      fullName: user.FullName,
      mahalId: user.MahalId === null ? null : Number(user.MahalId),
      semat: user.Semat === null ? null : Number(user.Semat),
      sematTitle: user.OnvanSemat || null,
      mustChangePassword: dbBit(user.ChangePassword),
      permissions: {
        dashboard: dbBit(user.TabDashboard),
        evaluation: dbBit(user.TabArzeshyabi),
        appointments: dbBit(user.TabEntesabat),
        personnel: dbBit(user.TabPersonnel),
        inquiries: dbBit(user.TabEstelam),
      },
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/Admin/Dashboard",
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: useSecureCookie(),
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { message: "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
