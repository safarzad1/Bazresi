import { getDbPool } from "@/lib/db";

export type HamsarRow = {
  ID: number;
  PersonId: number;
  NameHamsar: string;
  ShoghlHamsar: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export async function getHamsar(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("PersonId", personId)
    .execute("bz.SP_HamsarAdmin_Get");
  return (result.recordset?.[0] ?? null) as HamsarRow | null;
}

export async function saveHamsar(input: {
  personId: number;
  nameHamsar: string;
  shoghlHamsar: string;
  actorUserId: string;
}) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("PersonId", input.personId)
    .input("NameHamsar", input.nameHamsar)
    .input("ShoghlHamsar", input.shoghlHamsar)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_HamsarAdmin_Save");
  return (result.recordset?.[0] ?? null) as HamsarRow | null;
}

export async function deleteHamsar(personId: number) {
  const pool = await getDbPool();
  await pool.request()
    .input("PersonId", personId)
    .execute("bz.SP_HamsarAdmin_Delete");
}
