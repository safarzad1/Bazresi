import { getDbPool } from "@/lib/db";

export type IsargariRow = {
  ID: number;
  PersonId: number;
  JebheSal: number | null;
  JebheMah: number | null;
  JebheRoz: number | null;
  Janbaz: boolean;
  DarsadJanbazi: number | null;
  MarjaTaeid: string | null;
  Azadeh: boolean;
  AsaratSal: number | null;
  AsaratMah: number | null;
  AsaratRoz: number | null;
  KhanevadeShahid: boolean;
  NameShahid: string | null;
  TarikhMahalShahadat: string | null;
  NesbatBaShahid: string | null;
};

export type IsargariWriteInput = Omit<IsargariRow, "ID" | "PersonId"> & {
  id: number;
  personId: number;
  actorUserId: string;
};

export async function getIsargari(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request().input("PersonId", personId).execute("bz.SP_IsargariAdmin_Get");
  return (result.recordset?.[0] ?? null) as IsargariRow | null;
}

export async function saveIsargari(input: IsargariWriteInput) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("ID", input.id)
    .input("PersonId", input.personId)
    .input("JebheSal", input.JebheSal)
    .input("JebheMah", input.JebheMah)
    .input("JebheRoz", input.JebheRoz)
    .input("Janbaz", input.Janbaz)
    .input("DarsadJanbazi", input.DarsadJanbazi)
    .input("MarjaTaeid", input.MarjaTaeid)
    .input("Azadeh", input.Azadeh)
    .input("AsaratSal", input.AsaratSal)
    .input("AsaratMah", input.AsaratMah)
    .input("AsaratRoz", input.AsaratRoz)
    .input("KhanevadeShahid", input.KhanevadeShahid)
    .input("NameShahid", input.NameShahid)
    .input("TarikhMahalShahadat", input.TarikhMahalShahadat)
    .input("NesbatBaShahid", input.NesbatBaShahid)
    .input("ActorUserId", input.actorUserId)
    .execute("bz.SP_IsargariAdmin_Save");
  return (result.recordset?.[0] ?? null) as IsargariRow | null;
}

export async function deleteIsargari(personId: number) {
  const pool = await getDbPool();
  await pool.request().input("PersonId", personId).execute("bz.SP_IsargariAdmin_Delete");
}
