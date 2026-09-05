import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import { createPersonCaseDocument, getPersonCaseFile } from "@/lib/person-casefile-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 30;
const allowed = new Map<string, string>([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["pdf", "application/pdf"],
]);

function personId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}
function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function dbMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    const match = error.message.match(/(?:Msg \d+[^\n]*\n)?[\s\S]*?([\u0600-\u06ff][^\n]{2,350})/);
    return (match?.[1] || error.message).trim().slice(0, 350);
  }
  return "عملیات پرونده شخص انجام نشد.";
}
async function auth() {
  const session = await getCurrentSession();
  if (!session) return { session: null, response: NextResponse.json({ message: "نشست شما منقضی شده است." }, { status: 401 }) };
  if (!sessionHasMenu(session, ACCESS_MENU.persons)) return { session: null, response: NextResponse.json({ message: "دسترسی به بخش اشخاص برای شما فعال نیست." }, { status: 403 }) };
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const a = await auth(); if (!a.session) return a.response;
  const id = personId(request.nextUrl.searchParams.get("personId"));
  if (!id) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
  try {
    const result = await getPersonCaseFile(id);
    if (!result.person) return NextResponse.json({ message: "شخص موردنظر پیدا نشد." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Person case list failed:", error);
    return NextResponse.json({ message: dbMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const a = await auth(); if (!a.session) return a.response;
  try {
    const form = await request.formData();
    const id = personId(form.get("personId"));
    const onvanMatlab = text(form.get("onvanMatlab"), 500);
    const tarikhNameh = text(form.get("tarikhNameh"), 10);
    const shomareNameh = text(form.get("shomareNameh"), 100);
    const kholaseh = text(form.get("kholaseh"), 2000);
    const noeSanadTitle = text(form.get("noeSanadTitle"), 150);
    const marjaNameh = text(form.get("marjaNameh"), 250);
    const noeSanadRaw = Number(form.get("noeSanad") || 1);
    const noeSanad = Number.isInteger(noeSanadRaw) && noeSanadRaw >= 1 && noeSanadRaw <= 255 ? noeSanadRaw : 1;

    if (!id) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    if (!onvanMatlab) return NextResponse.json({ message: "عنوان مطلب را وارد کنید." }, { status: 400 });
    if (tarikhNameh && !/^\d{4}\/\d{2}\/\d{2}$/.test(tarikhNameh)) return NextResponse.json({ message: "تاریخ نامه باید به شکل 1405/01/01 باشد." }, { status: 400 });

    const rawFiles = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (!rawFiles.length) return NextResponse.json({ message: "حداقل یک فایل انتخاب کنید." }, { status: 400 });
    if (rawFiles.length > MAX_FILES) return NextResponse.json({ message: `در هر بار حداکثر ${MAX_FILES.toLocaleString("fa-IR")} فایل قابل ثبت است.` }, { status: 400 });

    const files = [];
    for (const file of rawFiles) {
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: `حجم فایل «${file.name}» بیش از ۲۰ مگابایت است.` }, { status: 400 });
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const canonicalType = allowed.get(extension);
      if (!canonicalType) return NextResponse.json({ message: "فقط فایل‌های JPG، PNG، WEBP و PDF مجاز هستند." }, { status: 400 });
      const generated = `${randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
      files.push({
        fileName: generated,
        originalFileName: file.name.slice(0, 260),
        contentType: canonicalType,
        data: Buffer.from(await file.arrayBuffer()),
      });
    }

    const created = await createPersonCaseDocument({
      actorUserId: a.session.userId,
      personId: id,
      tarikhNameh: tarikhNameh || null,
      shomareNameh: shomareNameh || null,
      onvanMatlab,
      kholaseh: kholaseh || null,
      noeSanad,
      noeSanadTitle: noeSanadTitle || null,
      marjaNameh: marjaNameh || null,
      files,
    });
    return NextResponse.json({ message: `سند در صفحات ${created.AzSafheh.toLocaleString("fa-IR")} تا ${created.TaSafheh.toLocaleString("fa-IR")} ثبت شد.`, document: created }, { status: 201 });
  } catch (error) {
    console.error("Person case create failed:", error);
    return NextResponse.json({ message: dbMessage(error) }, { status: 500 });
  }
}
