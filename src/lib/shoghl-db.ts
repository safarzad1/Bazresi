import { getDbPool } from "@/lib/db";

export type ShoghlRow = {
  ID: number;
  PersonId: number;
  Mahal: number | null;
  MahalName: string | null;
  SematPostSazmani: string | null;
  AzTarikh: string | null;
  TaTarikh: string | null;
};

export type ShoghlWriteInput = {
  id: number;
  personId: number;
  mahal: number;
  sematPostSazmani: string;
  azTarikh: string | null;
  taTarikh: string | null;
  actorUserId: string;
};

export async function listShoghl(personId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("PersonId", personId)
    .execute("bz.SP_ShoghlAdmin_List");

  return (result.recordset ?? []) as ShoghlRow[];
}

export async function saveShoghl(input: ShoghlWriteInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("Mahal", input.mahal)
    .input("SematPostSazmani", input.sematPostSazmani)
    .input("AzTarikh", input.azTarikh)
    .input("TaTarikh", input.taTarikh)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_ShoghlAdmin_Save");

  return (result.recordset?.[0] as ShoghlRow | undefined) ?? null;
}

export async function deleteShoghl(id: number, personId: number) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_ShoghlAdmin_Delete");
}
