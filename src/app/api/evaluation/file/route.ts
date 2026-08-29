import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { deleteEvaluationFile, getEvaluationFile, saveEvaluationFile } from "@/lib/evaluation-files-db";
import { getEvaluationIdentity, setEvaluationFileName } from "@/lib/evaluation-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_SIZE = 5 * 1024 * 1024;
const allowed = new Map([["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["pdf", "application/pdf"], ["zip", "application/zip"], ["rar", "application/vnd.rar"]]);
const safeName = (value: string | null) => value && /^[0-9a-f-]{36}\.(jpg|jpeg|png|pdf|zip|rar)$/i.test(value) ? value : "";

async function authContext() {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!session.permissions.evaluation && !session.isSystemAdmin) return null;
  const identity = await getEvaluationIdentity(session.userId);
  return identity ? { session, identity } : null;
}
async function canAccess(id: string, nationalCode: string, admin: boolean) {
  const pool = await getDbPool(); const result = await pool.request().input("Id", id).input("Code", nationalCode).query("SELECT TOP 1 a.FileName FROM Arzyabi.Arzyabi a LEFT JOIN Arzyabi.Arzyabi p ON p.IDArzYabi=a.PID WHERE a.IDArzYabi=@Id AND (@Code=a.CodeMelli OR @Code=p.CodeMelli)");
  return admin || Boolean(result.recordset?.[0]);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authContext(); if (!auth) return NextResponse.json({ message: "نشست منقضی شده است." }, { status: 401 });
    const fileName = safeName(request.nextUrl.searchParams.get("file")); const id = String(request.nextUrl.searchParams.get("id") || "");
    if (!fileName || !id || !(await canAccess(id, auth.identity.nationalCode, auth.identity.isAdmin || auth.session.isSystemAdmin))) return NextResponse.json({ message: "فایل در دسترس نیست." }, { status: 403 });
    const file = await getEvaluationFile(fileName); if (!file) return NextResponse.json({ message: "فایل پیدا نشد." }, { status: 404 });
    return new Response(new Uint8Array(file.FileData), { headers: { "Content-Type": file.ContentType, "Content-Length": String(file.FileSize), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.OriginalName)}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch (error) { console.error("Evaluation file read failed:", error); return NextResponse.json({ message: "دریافت فایل انجام نشد." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authContext(); if (!auth) return NextResponse.json({ message: "نشست منقضی شده است." }, { status: 401 });
    const form = await request.formData(); const id = String(form.get("id") || ""); const file = form.get("file");
    if (!id || !(file instanceof File)) return NextResponse.json({ message: "فایل انتخاب نشده است." }, { status: 400 });
    if (!(await canAccess(id, auth.identity.nationalCode, auth.identity.isAdmin || auth.session.isSystemAdmin))) return NextResponse.json({ message: "دسترسی مجاز نیست." }, { status: 403 });
    if (file.size < 1 || file.size > MAX_SIZE) return NextResponse.json({ message: "حجم فایل باید حداکثر ۵ مگابایت باشد." }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase() || ""; const contentType = allowed.get(extension);
    if (!contentType) return NextResponse.json({ message: "فقط JPG، PNG، PDF، ZIP یا RAR مجاز است." }, { status: 400 });
    const generated = `${randomUUID()}.${extension}`; await saveEvaluationFile(id, generated, file.name.slice(0, 260), contentType, Buffer.from(await file.arrayBuffer()), auth.session.userId); await setEvaluationFileName(id, generated, auth.session.userId);
    return NextResponse.json({ message: "پیوست ذخیره شد.", fileName: generated });
  } catch (error) { console.error("Evaluation upload failed:", error); return NextResponse.json({ message: "ذخیره پیوست انجام نشد." }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authContext(); if (!auth || (!auth.identity.isAdmin && !auth.session.isSystemAdmin)) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
    const fileName = safeName(request.nextUrl.searchParams.get("file")); const id = String(request.nextUrl.searchParams.get("id") || ""); if (!fileName || !id) return NextResponse.json({ message: "درخواست معتبر نیست." }, { status: 400 });
    await deleteEvaluationFile(fileName, auth.session.userId); await setEvaluationFileName(id, null, auth.session.userId); return NextResponse.json({ message: "پیوست حذف شد." });
  } catch (error) { console.error("Evaluation file delete failed:", error); return NextResponse.json({ message: "حذف پیوست انجام نشد." }, { status: 500 }); }
}
