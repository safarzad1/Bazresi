import { getDbPool } from "@/lib/db";

export type SabegheEntekhabatRow = {
  ID: number;
  PersonId: number;
  NoeEntekhabat: string;
  HozeEntekhabieh: string;
  Natijeh: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export type SabegheEntekhabatWriteInput = {
  id: number;
  personId: number;
  noeEntekhabat: string;
  hozeEntekhabieh: string;
  natijeh: string;
  actorUserId: string;
};

export async function listSabegheEntekhabat(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("PersonId", personId)
    .execute("bz.SP_SabegheEntekhabatAdmin_List");
  return (result.recordset ?? []) as SabegheEntekhabatRow[];
}

export async function saveSabegheEntekhabat(input: SabegheEntekhabatWriteInput) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("NoeEntekhabat", input.noeEntekhabat)
    .input("HozeEntekhabieh", input.hozeEntekhabieh)
    .input("Natijeh", input.natijeh)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_SabegheEntekhabatAdmin_Save");
  return (result.recordset?.[0] ?? null) as SabegheEntekhabatRow | null;
}

export async function deleteSabegheEntekhabat(id: number, personId: number) {
  const pool = await getDbPool();
  await pool.request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_SabegheEntekhabatAdmin_Delete");
}
