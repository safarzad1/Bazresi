import { NextRequest, NextResponse } from "next/server";
import { normalizeCancellationFormSettings } from "@/lib/cancellation-form-settings";
import {
  getCancellationFormSettings,
  saveCancellationFormSettings,
} from "@/lib/cancellation-form-settings-db";
import { getCurrentSession } from "@/lib/session";

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
    return NextResponse.json({ settings, canEdit: session.isSystemAdmin });
  } catch (error) {
    console.error("Cancellation form settings read failed:", error);
    return NextResponse.json({ message: message(error, "دریافت تنظیمات قالب انجام نشد.") }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });
  if (!session.isSystemAdmin) return NextResponse.json({ message: "فقط مدیر سامانه مجاز به تغییر تنظیمات فرم است." }, { status: 403 });
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
