import { NextRequest, NextResponse } from "next/server";
import {
  deleteAppointmentAccess,
  getAppointmentAccessSettings,
  saveAppointmentAccess,
} from "@/lib/appointment-access-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(-350)
    : "عملیات دسترسی انتصابات با خطا روبه‌رو شد.";
}

async function requireSettingsAccess() {
  const session = await getCurrentSession();
  if (!session) {
    return { response: NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 }) };
  }
  if (!sessionHasMenu(session, ACCESS_MENU.settings)) {
    return { response: NextResponse.json({ message: "دسترسی به تنظیمات سامانه برای شما فعال نیست." }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requireSettingsAccess();
  if ("response" in auth) return auth.response;

  try {
    return NextResponse.json(
      await getAppointmentAccessSettings(auth.session.userId),
    );
  } catch (error) {
    console.error("Appointment access settings load failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSettingsAccess();
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      actorPostId?: unknown;
      targetPostId?: unknown;
      targetPostIds?: unknown;
    };
    const actorPostId = positiveId(body.actorPostId);
    const requestedTargetIds = Array.isArray(body.targetPostIds)
      ? body.targetPostIds
      : [body.targetPostId];
    const targetPostIds = Array.from(
      new Set(requestedTargetIds.map(positiveId).filter((postId) => postId > 0)),
    );
    if (!actorPostId || targetPostIds.length === 0) {
      return NextResponse.json(
        { message: "پست انجام‌دهنده و حداقل یک پست مجاز را انتخاب کنید." },
        { status: 400 },
      );
    }
    if (targetPostIds.length > 200) {
      return NextResponse.json(
        { message: "در هر مرحله حداکثر ۲۰۰ پست مجاز قابل ثبت است." },
        { status: 400 },
      );
    }

    for (const targetPostId of targetPostIds) {
      await saveAppointmentAccess(actorPostId, targetPostId, auth.session.userId);
    }
    return NextResponse.json({ ok: true, savedCount: targetPostIds.length });
  } catch (error) {
    console.error("Appointment access save failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSettingsAccess();
  if ("response" in auth) return auth.response;

  try {
    const accessId = positiveId(request.nextUrl.searchParams.get("id"));
    if (!accessId) {
      return NextResponse.json({ message: "شناسه دسترسی معتبر نیست." }, { status: 400 });
    }

    await deleteAppointmentAccess(accessId, auth.session.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Appointment access delete failed:", error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
