import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  createEvaluationAssignments, deleteEvaluationYear, deleteQuestion, evaluationBreakdown,
  finalizeEvaluation, getEvaluationBootstrap, getEvaluationIdentity,
  listAssignedEvaluations, listEvaluationQuestions, listEvaluationTree,
  listQuestionBank, saveEvaluationScore, saveEvaluationYear, saveQuestion,
  setEvaluationState,
} from "@/lib/evaluation-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function message(error: unknown) {
  return error instanceof Error && error.message.length < 400 ? error.message : "انجام عملیات ارزشیابی با خطا روبه‌رو شد.";
}
function positiveInt(value: unknown, fallback = 0) {
  const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
async function context() {
  const session = await getCurrentSession();
  if (!session) return { response: NextResponse.json({ message: "نشست منقضی شده است." }, { status: 401 }) };
  if (!session.permissions.evaluation && !session.isSystemAdmin) return { response: NextResponse.json({ message: "دسترسی به ارزشیابی برای شما فعال نیست." }, { status: 403 }) };
  const identity = await getEvaluationIdentity(session.userId);
  if (!identity) return { response: NextResponse.json({ message: "سمت یا کد ملی کاربر کامل نیست." }, { status: 403 }) };
  return { session, identity };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await context(); if ("response" in auth) return auth.response;
    const mode = request.nextUrl.searchParams.get("mode") || "bootstrap";
    const year = positiveInt(request.nextUrl.searchParams.get("year"));
    if (mode === "bootstrap") return NextResponse.json(await getEvaluationBootstrap(auth.session.userId));
    if (mode === "assigned") return NextResponse.json({ items: await listAssignedEvaluations(auth.identity.nationalCode, year, positiveInt(request.nextUrl.searchParams.get("state"), 1)) });
    if (mode === "questions") return NextResponse.json({ items: await listEvaluationQuestions(String(request.nextUrl.searchParams.get("id") || ""), positiveInt(request.nextUrl.searchParams.get("evaluatorLevel")), positiveInt(request.nextUrl.searchParams.get("evaluatedLevel"))) });
    if (mode === "question-bank") {
      if (!auth.identity.isAdmin && !auth.session.isSystemAdmin) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
      return NextResponse.json({ items: await listQuestionBank(year) });
    }
    if (mode === "tree") {
      if (!auth.identity.isAdmin && !auth.session.isSystemAdmin) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
      return NextResponse.json(await listEvaluationTree(year, positiveInt(request.nextUrl.searchParams.get("page"), 1), String(request.nextUrl.searchParams.get("search") || "").trim(), positiveInt(request.nextUrl.searchParams.get("scope"), 1)));
    }
    if (mode === "breakdown") {
      if (!auth.identity.isAdmin && !auth.session.isSystemAdmin) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
      return NextResponse.json({ items: await evaluationBreakdown(String(request.nextUrl.searchParams.get("id") || "")) });
    }
    return NextResponse.json({ message: "درخواست معتبر نیست." }, { status: 400 });
  } catch (error) { console.error("Evaluation GET failed:", error); return NextResponse.json({ message: message(error) }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await context(); if ("response" in auth) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || "");
    if (action === "score") await saveEvaluationScore({ id: String(body.id || ""), questionId: positiveInt(body.questionId), value: positiveInt(body.value), description: String(body.description || ""), userId: auth.session.userId, nationalCode: auth.identity.nationalCode });
    else if (action === "finalize") return NextResponse.json({ message: "ارزشیابی با موفقیت نهایی شد.", score: await finalizeEvaluation(String(body.id || ""), auth.session.userId, auth.identity.nationalCode) });
    else {
      if (!auth.identity.isAdmin && !auth.session.isSystemAdmin) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
      if (action === "save-question") await saveQuestion(body);
      else if (action === "save-year") await saveEvaluationYear(positiveInt(body.id), String(body.title || ""), positiveInt(body.year), auth.session.userId);
      else if (action === "assign") await createEvaluationAssignments(positiveInt(body.year), body.evaluated as Record<string, unknown>, body.evaluators as Record<string, unknown>[], auth.session.userId);
      else if (action === "unlock") await setEvaluationState(String(body.id || ""), "unlock", auth.session.userId);
      else return NextResponse.json({ message: "درخواست معتبر نیست." }, { status: 400 });
    }
    return NextResponse.json({ message: "عملیات با موفقیت انجام شد." });
  } catch (error) { console.error("Evaluation POST failed:", error); return NextResponse.json({ message: message(error) }, { status: 400 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await context(); if ("response" in auth) return auth.response;
    if (!auth.identity.isAdmin && !auth.session.isSystemAdmin) return NextResponse.json({ message: "دسترسی مدیریتی لازم است." }, { status: 403 });
    const kind = request.nextUrl.searchParams.get("kind"); const id = String(request.nextUrl.searchParams.get("id") || "");
    if (kind === "question") await deleteQuestion(positiveInt(id));
    else if (kind === "year") await deleteEvaluationYear(positiveInt(id));
    else if (kind === "evaluation") await setEvaluationState(id, "delete", auth.session.userId);
    else return NextResponse.json({ message: "درخواست معتبر نیست." }, { status: 400 });
    return NextResponse.json({ message: "حذف انجام شد." });
  } catch (error) { console.error("Evaluation DELETE failed:", error); return NextResponse.json({ message: message(error) }, { status: 400 }); }
}
