import { getFilesDbPool, sql } from "@/lib/db";

export type EvaluationFileRecord = { FileName: string; OriginalName: string; ContentType: string; FileSize: number; FileData: Buffer };

export async function saveEvaluationFile(evaluationId: string, fileName: string, originalName: string, contentType: string, data: Buffer, userId: string) {
  const pool = await getFilesDbPool();
  await pool.request().input("EvaluationId", sql.NVarChar(150), evaluationId).input("FileName", sql.NVarChar(150), fileName).input("OriginalName", sql.NVarChar(260), originalName).input("ContentType", sql.NVarChar(100), contentType).input("FileData", sql.VarBinary(sql.MAX), data).input("CreateUserId", sql.NVarChar(450), userId).execute("filedb.SP_EvaluationFile_Save");
}
export async function getEvaluationFile(fileName: string) {
  const pool = await getFilesDbPool(); const result = await pool.request().input("FileName", sql.NVarChar(150), fileName).execute("filedb.SP_EvaluationFile_Get");
  return (result.recordset?.[0] as EvaluationFileRecord | undefined) ?? null;
}
export async function deleteEvaluationFile(fileName: string, userId: string) {
  const pool = await getFilesDbPool(); await pool.request().input("FileName", sql.NVarChar(150), fileName).input("DeleteUserId", sql.NVarChar(450), userId).execute("filedb.SP_EvaluationFile_SoftDelete");
}
