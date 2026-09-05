import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { assertMenuAccess } from "@/lib/access-db";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "دسترسی به مدیریت دسترسی مجاز نیست.") {
  return NextResponse.json({ message }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function positiveInt(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function userIdValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 450) : "";
}

async function getActor() {
  const session = await getCurrentSession();
  if (!session) return null;
  try {
    await assertMenuAccess(session.userId, "ACCESS_MANAGEMENT");
    return session;
  } catch {
    return null;
  }
}

function apiError(error: unknown, fallback: string) {
  console.error("Access management API:", error);
  return NextResponse.json(
    { message: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return forbidden();

  const view = String(request.nextUrl.searchParams.get("view") || "groups");

  try {
    const pool = await getDbPool();

    if (view === "groups") {
      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .execute("bz.SP_AccessGroup_List");
      return NextResponse.json({ items: result.recordset ?? [] });
    }

    if (view === "users") {
      const search = String(request.nextUrl.searchParams.get("search") || "").trim();
      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .input("Search", sql.NVarChar(250), search || null)
        .execute("bz.SP_UserAccessGroup_List");
      return NextResponse.json({ items: result.recordset ?? [] });
    }

    if (view === "permissions") {
      const groupId = positiveInt(request.nextUrl.searchParams.get("groupId"));
      if (!groupId) return badRequest("گروه دسترسی معتبر نیست.");

      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .input("GroupId", sql.Int, groupId)
        .execute("bz.SP_GroupMenuAccess_Get");

      const recordsets = (result.recordsets ?? []) as Array<Array<Record<string, unknown>>>;
      return NextResponse.json({
        group: recordsets[0]?.[0] ?? null,
        items: recordsets[1] ?? [],
      });
    }

    return badRequest("نوع اطلاعات درخواستی معتبر نیست.");
  } catch (error) {
    return apiError(error, "دریافت اطلاعات مدیریت دسترسی انجام نشد.");
  }
}

export async function POST(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return forbidden();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    const pool = await getDbPool();

    if (action === "save_group") {
      const groupId = body.groupId == null ? null : positiveInt(body.groupId);
      const groupTitle = String(body.groupTitle || "").trim().slice(0, 150);
      if (!groupTitle) return badRequest("عنوان گروه الزامی است.");

      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .input("GroupId", sql.Int, groupId)
        .input("GroupTitle", sql.NVarChar(150), groupTitle)
        .execute("bz.SP_AccessGroup_Save");
      return NextResponse.json({ ok: true, item: result.recordset?.[0] ?? null });
    }

    if (action === "set_user_group") {
      const userId = userIdValue(body.userId);
      const groupId = positiveInt(body.groupId);
      if (!userId || !groupId) return badRequest("کاربر و گروه باید انتخاب شوند.");

      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .input("UserId", sql.NVarChar(450), userId)
        .input("GroupId", sql.Int, groupId)
        .execute("bz.SP_UserAccessGroup_Set");
      return NextResponse.json({ ok: true, item: result.recordset?.[0] ?? null });
    }

    if (action === "save_group_access") {
      const groupId = positiveInt(body.groupId);
      const accesses = Array.isArray(body.accesses) ? body.accesses : [];
      if (!groupId) return badRequest("گروه دسترسی معتبر نیست.");

      const result = await pool
        .request()
        .input("ActorUserId", sql.NVarChar(450), actor.userId)
        .input("GroupId", sql.Int, groupId)
        .input("AccessJson", sql.NVarChar(sql.MAX), JSON.stringify(accesses))
        .execute("bz.SP_GroupMenuAccess_Save");
      const recordsets = (result.recordsets ?? []) as Array<Array<Record<string, unknown>>>;
      return NextResponse.json({
        ok: true,
        group: recordsets[0]?.[0] ?? null,
        items: recordsets[1] ?? [],
      });
    }

    return badRequest("عملیات درخواستی معتبر نیست.");
  } catch (error) {
    return apiError(error, "ذخیره مدیریت دسترسی انجام نشد.");
  }
}

export async function DELETE(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return forbidden();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const groupId = positiveInt(body.groupId);
    if (!groupId) return badRequest("گروه دسترسی معتبر نیست.");

    const pool = await getDbPool();
    await pool
      .request()
      .input("ActorUserId", sql.NVarChar(450), actor.userId)
      .input("GroupId", sql.Int, groupId)
      .execute("bz.SP_AccessGroup_Delete");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "حذف گروه انجام نشد.");
  }
}
