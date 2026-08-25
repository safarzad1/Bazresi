import { getFilesDbPool } from "@/lib/db";

export type PersonFileRecord = {
  FileName: string;
  ContentType: string;
  FileSize: number;
  FileData: Buffer;
};

export async function savePersonFile(
  personId: number,
  fileName: string,
  contentType: string,
  fileData: Buffer,
  actorUserId: string,
) {
  const pool = await getFilesDbPool();
  await pool
    .request()
    .input("PersonId", personId)
    .input("FileName", fileName)
    .input("ContentType", contentType)
    .input("FileData", fileData)
    .input("CreateUserId", actorUserId)
    .execute("filedb.SP_PersonFile_Save");
}

export async function getPersonFile(fileName: string) {
  const pool = await getFilesDbPool();
  const result = await pool
    .request()
    .input("FileName", fileName)
    .execute("filedb.SP_PersonFile_Get");
  return (result.recordset?.[0] as PersonFileRecord | undefined) ?? null;
}

export async function softDeletePersonFile(fileName: string, actorUserId: string) {
  const pool = await getFilesDbPool();
  await pool
    .request()
    .input("FileName", fileName)
    .input("DeleteUserId", actorUserId)
    .execute("filedb.SP_PersonFile_SoftDelete");
}
