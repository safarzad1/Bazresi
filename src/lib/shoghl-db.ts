import { getDbPool } from "@/lib/db";

export type ShoghlRow = {
  ID: number;
  PersonId: number;
  Vazeyat: number | null;
  Vazeyat_NameFarsi: string | null;
  VazeyatShoghl: number | null;
  VazeyatShoghl_NameFarsi: string | null;
  NoeSazman: number | null;
  NoeSazman_NameFarsi: string | null;
  SathSazmani: number | null;
  SathSazmani_NameFarsi: string | null;
  PostSazmani: number | null;
  PostSazmani_NameFarsi: string | null;
  NameShoghl: string | null;
  OnvanMasoliat: string | null;
  Semat: number | null;
  Semat_NameFarsi: string | null;
  AzTarikh: string | null;
  TaTarikh: string | null;
  Mahal: number | null;
  Mahal_NameFarsi: string | null;
  Neshani: string | null;
  Tel: string | null;
  Tozihat: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

export type ShoghlLookup = {
  GroupCode: number;
  Id: number;
  Title: string;
};

export type ShoghlCity = {
  Id: number;
  Title: string;
};

export type ShoghlWriteInput = {
  id: number;
  personId: number;
  vazeyat: number | null;
  vazeyatShoghl: number | null;
  noeSazman: number | null;
  sathSazmani: number | null;
  postSazmani: number | null;
  nameShoghl: string;
  onvanMasoliat: string | null;
  semat: number | null;
  azTarikh: string | null;
  taTarikh: string | null;
  mahal: number | null;
  neshani: string | null;
  tel: string | null;
  tozihat: string | null;
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

export async function getShoghlLookups() {
  const pool = await getDbPool();
  const result = await pool.request().execute("bz.SP_ShoghlAdmin_Lookups");

  return {
    definitions: (result.recordsets?.[0] ?? []) as ShoghlLookup[],
    cities: (result.recordsets?.[1] ?? []) as ShoghlCity[],
  };
}

export async function saveShoghl(input: ShoghlWriteInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("Vazeyat", input.vazeyat)
    .input("VazeyatShoghl", input.vazeyatShoghl)
    .input("NoeSazman", input.noeSazman)
    .input("SathSazmani", input.sathSazmani)
    .input("PostSazmani", input.postSazmani)
    .input("NameShoghl", input.nameShoghl)
    .input("OnvanMasoliat", input.onvanMasoliat)
    .input("Semat", input.semat)
    .input("AzTarikh", input.azTarikh)
    .input("TaTarikh", input.taTarikh)
    .input("Mahal", input.mahal)
    .input("Neshani", input.neshani)
    .input("Tel", input.tel)
    .input("Tozihat", input.tozihat)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_ShoghlAdmin_Save");

  return (result.recordset?.[0] as ShoghlRow | undefined) ?? null;
}

export async function deleteShoghl(
  id: number,
  personId: number,
  actorUserId: string,
) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("ID", id)
    .input("PersonId", personId)
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_ShoghlAdmin_Delete");
}
