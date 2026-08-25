import { getDbPool } from "@/lib/db";

export type LoginUserRecord = {
  UserId: string;
  UserName: string;
  FullName: string;
  MahalId: number | null;
  Semat: number | null;
  OnvanSemat: string | null;
  PasswordHash: string | null;
  IsDelete: boolean | number | null;
  IsActive: boolean | number | null;
  ChangePassword: boolean | number | null;
  LockoutEnd: Date | string | null;
  AccessFailedCount: number | null;
  TabDashboard: boolean | number | null;
  TabArzeshyabi: boolean | number | null;
  TabEntesabat: boolean | number | null;
  TabPersonnel: boolean | number | null;
  TabEstelam: boolean | number | null;
};

export async function getLoginUser(userName: string) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("UserName", userName)
    .execute("bz.SP_Login_GetUser");

  return (result.recordset?.[0] as LoginUserRecord | undefined) ?? null;
}

export async function registerLoginResult(
  userId: string,
  isSuccess: boolean,
  loginDateTime: string,
) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("UserId", userId)
    .input("IsSuccess", isSuccess)
    .input("LoginDateTime", loginDateTime)
    .execute("bz.SP_Login_RegisterResult");
}

export function dbBit(value: boolean | number | null | undefined) {
  return value === true || value === 1;
}
