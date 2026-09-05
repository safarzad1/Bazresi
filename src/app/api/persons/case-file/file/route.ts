import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import { getPersonCaseFileContent } from "@/lib/person-casefile-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const safeName = (value: string | null) => value && /^[0-9a-f-]{36}\.(png|jpg|webp|pdf|bin)$/i.test(value) ? value : "";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 });
  if (!sessionHasMenu(session, ACCESS_MENU.persons)) return NextResponse.json({ message: "دسترسی به بخش اشخاص برای شما فعال نیست." }, { status: 403 });
  const fileName = safeName(request.nextUrl.searchParams.get("file"));
  if (!fileName) return NextResponse.json({ message: "نام فایل معتبر نیست." }, { status: 400 });
  try {
    const file = await getPersonCaseFileContent(fileName);
    if (!file) return NextResponse.json({ message: "فایل پیدا نشد." }, { status: 404 });
    const original = (file.OriginalFileName || fileName).replace(/[\r\n"]/g, "_");
    return new NextResponse(new Uint8Array(file.FileData), {
      headers: {
        "Content-Type": file.ContentType || "application/octet-stream",
        "Content-Length": String(file.FileSize || file.FileData.length),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(original)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Person case file read failed:", error);
    return NextResponse.json({ message: "دریافت فایل انجام نشد." }, { status: 500 });
  }
}
