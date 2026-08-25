import type { Request } from "mssql";
import { getDbPool } from "@/lib/db";

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
  const request = pool
    .request()
    .input("OnlyActive", onlyActive)
    .input("PageNumber", pageNumber)
    .input("PageSize", pageSize);

  if (search) request.input("Search", search);

  const result = await request.execute("bz.SP_UserAdmin_List");

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
  request: Request,
  input: UserWriteInput,
) {
  return request
    .input("UserId", input.userId)
    .input("UserName", input.userName)
    .input("FullName", input.fullName)
    .input("TelHamrah", input.telHamrah)
    .input("NationalCode", input.nationalCode)
    .input("Semat", input.sematId)
    .input("MahalId", input.mahalId)
    .input("Email", input.email)
    .input("PasswordHash", input.passwordHash)
    .input("SecurityStamp", input.securityStamp)
    .input("ConcurrencyStamp", input.concurrencyStamp)
    .input("IsActive", input.isActive)
    .input("ChangePassword", input.changePassword)
    .input("ActorUserId", input.actorUserId)
    .input("CreateDateTime", input.createDateTime);
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
    .input("UserId", userId)
    .input("ActorUserId", actorUserId)
    .input("SecurityStamp", securityStamp)
    .execute("bz.SP_UserAdmin_Delete");
}
