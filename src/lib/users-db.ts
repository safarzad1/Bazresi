import { getDbPool, sql } from "@/lib/db";

export type UserListRecord = {
  UserId: string;
  UserName: string;
  FullName: string;
  TelHamrah: string | null;
  NationalCode: string;
  Email: string | null;
  SematId: number | null;
  SematTitle: string | null;
  MahalId: number | null;
  MahalTitle: string | null;
  IsActive: boolean | number | null;
  ChangePassword: boolean | number | null;
  LastDateLogin: string | null;
};

export type LookupRecord = {
  Id: number;
  Title: string;
};

export type UserWriteInput = {
  userId: string;
  userName: string;
  fullName: string;
  telHamrah: string | null;
  nationalCode: string;
  sematId: number | null;
  mahalId: number | null;
  email: string | null;
  passwordHash: string | null;
  securityStamp: string | null;
  concurrencyStamp: string;
  isActive: boolean;
  changePassword: boolean;
  actorUserId: string;
  createDateTime: string;
};

export async function listUsers(
  search: string,
  onlyActive: boolean,
  pageNumber: number,
  pageSize: number,
) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("Search", sql.NVarChar, search || null)
    .input("OnlyActive", sql.Bit, onlyActive)
    .input("PageNumber", sql.Int, pageNumber)
    .input("PageSize", sql.Int, pageSize)
    .execute("bz.SP_UserAdmin_List");

  const summary = (result.recordsets?.[1]?.[0] ?? {}) as {
    TotalCount?: number;
  };

  return {
    users: (result.recordsets?.[0] ?? []) as UserListRecord[],
    totalCount: Number(summary.TotalCount ?? 0),
  };
}

export async function getUserLookups() {
  const pool = await getDbPool();
  const result = await pool.request().execute("bz.SP_UserAdmin_Lookups");

  return {
    semats: (result.recordsets?.[0] ?? []) as LookupRecord[],
    mahals: (result.recordsets?.[1] ?? []) as LookupRecord[],
  };
}

function bindUserWriteRequest(
  request: sql.Request,
  input: UserWriteInput,
) {
  return request
    .input("UserId", sql.NVarChar, input.userId)
    .input("UserName", sql.NVarChar, input.userName)
    .input("FullName", sql.NVarChar, input.fullName)
    .input("TelHamrah", sql.NVarChar, input.telHamrah)
    .input("NationalCode", sql.NVarChar, input.nationalCode)
    .input("Semat", sql.BigInt, input.sematId)
    .input("MahalId", sql.BigInt, input.mahalId)
    .input("Email", sql.NVarChar, input.email)
    .input("PasswordHash", sql.NVarChar, input.passwordHash)
    .input("SecurityStamp", sql.NVarChar, input.securityStamp)
    .input("ConcurrencyStamp", sql.NVarChar, input.concurrencyStamp)
    .input("IsActive", sql.Bit, input.isActive)
    .input("ChangePassword", sql.Bit, input.changePassword)
    .input("ActorUserId", sql.NVarChar, input.actorUserId)
    .input("CreateDateTime", sql.NVarChar, input.createDateTime);
}

export async function createUser(input: UserWriteInput) {
  const pool = await getDbPool();
  const result = await bindUserWriteRequest(pool.request(), input).execute(
    "bz.SP_UserAdmin_Create",
  );
  return (result.recordset?.[0] as UserListRecord | undefined) ?? null;
}

export async function updateUser(input: UserWriteInput) {
  const pool = await getDbPool();
  const result = await bindUserWriteRequest(pool.request(), input).execute(
    "bz.SP_UserAdmin_Update",
  );
  return (result.recordset?.[0] as UserListRecord | undefined) ?? null;
}

export async function deleteUser(
  userId: string,
  actorUserId: string,
  securityStamp: string,
) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("UserId", sql.NVarChar, userId)
    .input("ActorUserId", sql.NVarChar, actorUserId)
    .input("SecurityStamp", sql.NVarChar, securityStamp)
    .execute("bz.SP_UserAdmin_Delete");
}
