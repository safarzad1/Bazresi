import { getDbPool } from "@/lib/db";

export type SabegeNezaratRow = {
  ID: number;
  PersonId: number;
  DoreEntekhabat: string;
  SematEntekhabat: string;
  Mahal: number;
  MahalName: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export type SabegeNezaratWriteInput = {
  id: number;
  personId: number;
  doreEntekhabat: string;
  sematEntekhabat: string;
  mahal: number;
  actorUserId: string;
};

export async function listSabegeNezarat(personId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("PersonId", personId)
    .execute("bz.SP_SabegeNezaratAdmin_List");

  return (result.recordset ?? []) as SabegeNezaratRow[];
}

export async function saveSabegeNezarat(input: SabegeNezaratWriteInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("DoreEntekhabat", input.doreEntekhabat)
    .input("SematEntekhabat", input.sematEntekhabat)
    .input("Mahal", input.mahal)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_SabegeNezaratAdmin_Save");

  return (result.recordset?.find((row: any) => Number(row.ID) === input.id) ?? result.recordset?.[0] ?? null) as SabegeNezaratRow | null;
}

export async function deleteSabegeNezarat(id: number, personId: number) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_SabegeNezaratAdmin_Delete");
}
