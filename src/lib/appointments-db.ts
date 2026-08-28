import { getDbPool } from "@/lib/db";

export type AppointmentDocument = {
  Id: number;
  OnvanSanad: string | null;
  CreateDateTime: string | null;
  FullFileName: string | null;
  FullName2: string | null;
};

export type CurrentAppointmentRow = {
  EntesabId: number;
  PersonId: number;
  FullName: string | null;
  PostOnvan: string | null;
  ParentPostId?: number | null;
  TreeLevel?: number | null;
  TarikhEblagh: string | null;
  TarikhLaghv: string | null;
  ModatEblagKhedmat: number | null;
  DaysLeft: number | null;
  RecordState: number | null;
  TaeedOrAdamTaeed: number | null;
  CanCancel: boolean;
  Madarek: AppointmentDocument[];
};

type DashboardAppointmentRow = {
  JsonResult?: string | null;
};

function parseDocuments(value: unknown): AppointmentDocument[] {
  if (Array.isArray(value)) return value as AppointmentDocument[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as AppointmentDocument[]) : [];
  } catch {
    return [];
  }
}

function normalizeRows(jsonText: string | null | undefined) {
  if (!jsonText?.trim()) return [] as CurrentAppointmentRow[];

  try {
    const parsed = JSON.parse(jsonText) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      EntesabId: Number(item.EntesabId ?? 0),
      PersonId: Number(item.PersonId ?? 0),
      FullName: typeof item.FullName === "string" ? item.FullName : null,
      PostOnvan: typeof item.PostOnvan === "string" ? item.PostOnvan : null,
      ParentPostId:
        item.ParentPostId === null || item.ParentPostId === undefined
          ? null
          : Number(item.ParentPostId),
      TreeLevel:
        item.TreeLevel === null || item.TreeLevel === undefined
          ? null
          : Number(item.TreeLevel),
      TarikhEblagh: typeof item.TarikhEblagh === "string" ? item.TarikhEblagh : null,
      TarikhLaghv: typeof item.TarikhLaghv === "string" ? item.TarikhLaghv : null,
      ModatEblagKhedmat:
        item.ModatEblagKhedmat === null || item.ModatEblagKhedmat === undefined
          ? null
          : Number(item.ModatEblagKhedmat),
      DaysLeft:
        item.DaysLeft === null || item.DaysLeft === undefined
          ? null
          : Number(item.DaysLeft),
      RecordState:
        item.RecordState === null || item.RecordState === undefined
          ? null
          : Number(item.RecordState),
      TaeedOrAdamTaeed:
        item.TaeedOrAdamTaeed === null || item.TaeedOrAdamTaeed === undefined
          ? null
          : Number(item.TaeedOrAdamTaeed),
      CanCancel: item.CanCancel === true || item.CanCancel === 1 || item.CanCancel === "1",
      Madarek: parseDocuments(item.Madarek),
    }));
  } catch {
    return [];
  }
}

export async function listCurrentAppointments(actorUserId: string) {
  if (!actorUserId.trim()) return [] as CurrentAppointmentRow[];

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_Appointments_CurrentByAccess");

  const row = (result.recordset?.[0] ?? null) as DashboardAppointmentRow | null;
  return normalizeRows(row?.JsonResult);
}
