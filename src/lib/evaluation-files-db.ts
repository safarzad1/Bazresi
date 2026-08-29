import { getFilesDbPool } from "@/lib/db";

export type EvaluationFileRecord = { FileName: string; OriginalName: string; ContentType: string; FileSize: number; FileData: Buffer };

export async function saveEvaluationFile(evaluationId: string, fileName: string, originalName: string, contentType: string, data: Buffer, userId: string) {
  const pool = await getFilesDbPool();
  await pool.request().input("EvaluationId", evaluationId).input("FileName", fileName).input("OriginalName", originalName).input("ContentType", contentType).input("FileData", data).input("CreateUserId", userId).execute("filedb.SP_EvaluationFile_Save");
}
export async function getEvaluationFile(fileName: string) {
  const pool = await getFilesDbPool(); const result = await pool.request().input("FileName", fileName).execute("filedb.SP_EvaluationFile_Get");
  return (result.recordset?.[0] as EvaluationFileRecord | undefined) ?? null;
}
export async function deleteEvaluationFile(fileName: string, userId: string) {
  const pool = await getFilesDbPool(); await pool.request().input("FileName", fileName).input("DeleteUserId", userId).execute("filedb.SP_EvaluationFile_SoftDelete");
}
