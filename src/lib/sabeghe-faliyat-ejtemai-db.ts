import { getDbPool } from "@/lib/db";

export type SabegheFaliyatEjtemaiRow = {
  ID: number;
  PersonId: number;
  NameNahadTashakolHezb: string;
  Mahal: number;
  MahalName: string | null;
  AzTarikh: string | null;
  TaTarikh: string | null;
  Molahazat: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export type SabegheFaliyatEjtemaiWriteInput = {
  id: number;
  personId: number;
  nameNahadTashakolHezb: string;
  mahal: number;
  azTarikh: string;
  taTarikh: string;
  molahazat: string;
  actorUserId: string;
};

export async function listSabegheFaliyatEjtemai(personId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("PersonId", personId)
    .execute("bz.SP_SabegheFaliyatEjtemaiAdmin_List");

  return (result.recordset ?? []) as SabegheFaliyatEjtemaiRow[];
}

export async function saveSabegheFaliyatEjtemai(input: SabegheFaliyatEjtemaiWriteInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("NameNahadTashakolHezb", input.nameNahadTashakolHezb)
    .input("Mahal", input.mahal)
    .input("AzTarikh", input.azTarikh)
    .input("TaTarikh", input.taTarikh)
    .input("Molahazat", input.molahazat)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_SabegheFaliyatEjtemaiAdmin_Save");

  return (result.recordset?.find((row: any) => Number(row.ID) === input.id) ?? result.recordset?.[0] ?? null) as SabegheFaliyatEjtemaiRow | null;
}

export async function deleteSabegheFaliyatEjtemai(id: number, personId: number) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("ID", id)
    .input("PersonId", personId)
    .execute("bz.SP_SabegheFaliyatEjtemaiAdmin_Delete");
}
