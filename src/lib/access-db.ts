import type { IRecordSet } from "mssql";
import { getDbPool, sql } from "@/lib/db";

export type AccessMenuRow = {
  MenuId: number;
  MenuCode: string;
  MenuTitle: string;
  MenuRoute: string;
  MenuSection: string;
  SortOrder: number;
};

export type UserMenuAccessContext = {
  isSystemAdmin: boolean;
  groupId: number | null;
  groupTitle: string | null;
  menus: AccessMenuRow[];
  menuCodes: string[];
};

export async function getUserMenuAccessContext(userId: string): Promise<UserMenuAccessContext> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("UserId", sql.NVarChar(450), userId)
    .execute("bz.SP_Access_UserMenuContext");

  const recordsets = result.recordsets as unknown as IRecordSet<Record<string, unknown>>[];
  const summary = recordsets?.[0]?.[0] ?? {};
  const menus = (recordsets?.[1] ?? []).map((row) => ({
    MenuId: Number(row.MenuId),
    MenuCode: String(row.MenuCode ?? ""),
    MenuTitle: String(row.MenuTitle ?? ""),
    MenuRoute: String(row.MenuRoute ?? ""),
    MenuSection: String(row.MenuSection ?? ""),
    SortOrder: Number(row.SortOrder ?? 0),
  }));

  return {
    isSystemAdmin: summary.IsSystemAdmin === true || summary.IsSystemAdmin === 1,
    groupId: summary.GroupId == null ? null : Number(summary.GroupId),
    groupTitle: summary.GroupTitle ? String(summary.GroupTitle) : null,
    menus,
    menuCodes: menus.map((row) => row.MenuCode),
  };
}

export async function assertMenuAccess(userId: string, menuCode: string) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("UserId", sql.NVarChar(450), userId)
    .input("MenuCode", sql.NVarChar(80), menuCode)
    .execute("bz.SP_Access_AssertMenu");
}

export async function hasMenuAccess(userId: string, menuCode: string) {
  try {
    await assertMenuAccess(userId, menuCode);
    return true;
  } catch {
    return false;
  }
}
