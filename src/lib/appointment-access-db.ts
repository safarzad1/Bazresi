import type { IRecordSet } from "mssql";
import { getDbPool } from "@/lib/db";

export type AppointmentAccessRow = {
  AccessId: number;
  ActorPostId: number;
  ActorPostTitle: string;
  ActorMahalId: number | null;
  ActorMahalTitle: string | null;
  TargetPostId: number;
  TargetPostTitle: string;
  TargetMahalId: number | null;
  TargetMahalTitle: string | null;
};

export type AppointmentPostLookup = {
  Id: number;
  Title: string;
  MahalId: number | null;
  MahalTitle: string | null;
};

export async function getAppointmentAccessSettings(actorUserId: string) {
  const pool = await getDbPool();
  const [accessResult, lookupResult] = await Promise.all([
    pool
      .request()
      .input("ActorUserId", actorUserId)
      .execute("bz.SP_AppointmentAccess_List"),
    pool
      .request()
      .input("ActorUserId", actorUserId)
      .execute("bz.SP_AppointmentAccess_Lookups"),
  ]);

  return {
    rows: (accessResult.recordset ?? []) as AppointmentAccessRow[],
    posts: ((lookupResult.recordsets as unknown as IRecordSet<any>[])?.[0] ??
      lookupResult.recordset ?? []) as AppointmentPostLookup[],
  };
}

export async function saveAppointmentAccess(
  actorPostId: number,
  targetPostId: number,
  actorUserId: string,
) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("ActorPostId", actorPostId)
    .input("TargetPostId", targetPostId)
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_AppointmentAccess_Save");
}

export async function deleteAppointmentAccess(
  accessId: number,
  actorUserId: string,
) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("AccessId", accessId)
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_AppointmentAccess_Delete");
}
