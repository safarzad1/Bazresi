import { getDbPool } from "@/lib/db";

export type FarzandRow = {
  ID: number;
  PersonId: number;
  NameFarzand: string;
  ShoghlFarzand: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export async function listFarzand(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("PersonId", personId)
    .execute("bz.SP_FarzandAdmin_List");
  return (result.recordset ?? []) as FarzandRow[];
}

export async function saveFarzand(input: {
  id: number;
  personId: number;
  nameFarzand: string;
  shoghlFarzand: string;
  actorUserId: string;
}) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("NameFarzand", input.nameFarzand)
    .input("ShoghlFarzand", input.shoghlFarzand)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_FarzandAdmin_Save");
  return (result.recordset?.[0] ?? null) as FarzandRow | null;
}

export async function deleteFarzand(id: number, personId: number) {
  const pool = await getDbPool();
  await pool.request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_FarzandAdmin_Delete");
}
