import { NextRequest, NextResponse } from "next/server";
import { normalizeCancellationFormSettings } from "@/lib/cancellation-form-settings";
import {
  getCancellationFormSettings,
  saveCancellationFormSettings,
} from "@/lib/cancellation-form-settings-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message && error.message.length <= 500 ? error.message : fallback;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });

  try {
    const settings = await getCancellationFormSettings();
    const canEdit = sessionHasMenu(session, ACCESS_MENU.settings);
    if (!canEdit) return NextResponse.json({ message: "دسترسی به تنظیمات سامانه برای شما فعال نیست." }, { status: 403 });
    return NextResponse.json({ settings, canEdit });
  } catch (error) {
    console.error("Cancellation form settings read failed:", error);
    return NextResponse.json({ message: message(error, "دریافت تنظیمات قالب انجام نشد.") }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });
  if (!sessionHasMenu(session, ACCESS_MENU.settings)) return NextResponse.json({ message: "دسترسی به تنظیمات سامانه برای شما فعال نیست." }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const settings = normalizeCancellationFormSettings(body);
    const saved = await saveCancellationFormSettings(session.userId, settings);
    return NextResponse.json({ message: "تنظیمات ظاهر فرم ذخیره شد.", settings: saved, canEdit: true });
  } catch (error) {
    console.error("Cancellation form settings save failed:", error);
    return NextResponse.json({ message: message(error, "ذخیره تنظیمات قالب انجام نشد.") }, { status: 500 });
  }
}
