import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  getPersonFile,
  savePersonFile,
  softDeletePersonFile,
} from "@/lib/person-files-db";
import { setPersonImage } from "@/lib/persons-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFileSize = 4 * 1024 * 1024;

function validPersonId(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function detectedImageType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

function safeFileName(value: string | null) {
  if (!value || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(value)) return "";
  return value;
}

function uploadError(error: unknown) {
  if (error instanceof Error && error.message && error.message.length <= 300) return error.message;
  return "ذخیره تصویر پرسنلی انجام نشد.";
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست منقضی شده است." }, { status: 401 });

  try {
    const fileName = safeFileName(request.nextUrl.searchParams.get("file"));
    if (!fileName) return NextResponse.json({ message: "نام فایل معتبر نیست." }, { status: 400 });
    const file = await getPersonFile(fileName);
    if (!file) return NextResponse.json({ message: "تصویر پیدا نشد." }, { status: 404 });

    const body = new Uint8Array(file.FileData);
    return new Response(body, {
      headers: {
        "Content-Type": file.ContentType,
        "Content-Length": String(file.FileSize),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Person image read failed:", error);
    return NextResponse.json({ message: "دریافت تصویر انجام نشد." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "نشست منقضی شده است." }, { status: 401 });

  let savedFileName = "";
  try {
    const formData = await request.formData();
    const personId = validPersonId(formData.get("personId"));
    const file = formData.get("file");
    if (!personId) return NextResponse.json({ message: "ابتدا پیش‌نویس شخص را ذخیره کنید." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ message: "تصویر پرسنلی انتخاب نشده است." }, { status: 400 });
    if (file.size < 1 || file.size > maxFileSize) {
      return NextResponse.json({ message: "حجم تصویر باید حداکثر ۴ مگابایت باشد." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectedImageType(buffer);
    if (!detected) {
      return NextResponse.json({ message: "فقط تصویر JPG، PNG یا WEBP مجاز است." }, { status: 400 });
    }

    savedFileName = `${randomUUID()}.${detected.extension}`;
    await savePersonFile(personId, savedFileName, detected.contentType, buffer, session.userId);
    const changed = await setPersonImage(personId, savedFileName, session.userId);

    if (changed?.OldFileName && changed.OldFileName !== savedFileName) {
      await softDeletePersonFile(changed.OldFileName, session.userId).catch((error) => {
        console.error("Old person image cleanup failed:", error);
      });
    }

    return NextResponse.json({
      message: "تصویر پرسنلی ذخیره شد.",
      fileName: savedFileName,
      imageUrl: `/api/persons/image?file=${encodeURIComponent(savedFileName)}`,
    });
  } catch (error) {
    if (savedFileName) {
      await softDeletePersonFile(savedFileName, session.userId).catch(() => undefined);
    }
    console.error("Person image upload failed:", error);
    return NextResponse.json({ message: uploadError(error) }, { status: 500 });
  }
}
