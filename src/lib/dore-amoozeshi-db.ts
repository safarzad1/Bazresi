import { getDbPool } from "@/lib/db";

export type DoreAmozeshiRow = {
  ID: number;
  PersonId: number;
  NameDore: string;
  ModatSaat: number;
  NameMarkazMahalAmozesh: string;
  NoeMadrak: number;
  NoeMadrakName: string | null;
  TarikhAkhzMadrak: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export type DoreAmozeshiWriteInput = {
  id: number;
  personId: number;
  nameDore: string;
  modatSaat: number;
  nameMarkazMahalAmozesh: string;
  noeMadrak: number;
  tarikhAkhzMadrak: string;
  actorUserId: string;
};

export async function listDoreAmozeshi(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("PersonId", personId)
    .execute("bz.SP_DoreAmozeshiAdmin_List");
  return (result.recordset ?? []) as DoreAmozeshiRow[];
}

export async function saveDoreAmozeshi(input: DoreAmozeshiWriteInput) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("NameDore", input.nameDore)
    .input("ModatSaat", input.modatSaat)
    .input("NameMarkazMahalAmozesh", input.nameMarkazMahalAmozesh)
    .input("NoeMadrak", input.noeMadrak)
    .input("TarikhAkhzMadrak", input.tarikhAkhzMadrak)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_DoreAmozeshiAdmin_Save");
  return (result.recordset?.[0] ?? null) as DoreAmozeshiRow | null;
}

export async function deleteDoreAmozeshi(id: number, personId: number) {
  const pool = await getDbPool();
  await pool.request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_DoreAmozeshiAdmin_Delete");
}
