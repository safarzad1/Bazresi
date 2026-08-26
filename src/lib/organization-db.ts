import { getDbPool } from "@/lib/db";

export type OrganizationStructureRecord = {
  NodeId: string;
  ParentId: string | null;
  Title: string;
  Level: number | null;
  MahalId: number | null;
  MahalTitle: string | null;
  TypeSemat: number | null;
  CurrentPersonName: string | null;
  AssignedUserCount: number;
  AssignedUsers: string | null;
};

export async function getOrganizationStructure() {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .execute("bz.SP_OrganizationStructure_List");

  return (result.recordset ?? []) as OrganizationStructureRecord[];
}
