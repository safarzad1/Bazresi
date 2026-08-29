import { getDbPool, sql } from "@/lib/db";

export type PersonCaseSummary = {
  PersonId: number;
  CodeMelli: string;
  FirstName: string;
  LastName: string;
  FatherName: string;
  ImagePath: string | null;
  FullName: string;
  LastPage: number;
  DocumentCount: number;
};

export type PersonCaseDocument = {
  ID: number;
  PersonId: number;
  AzSafheh: number;
  TaSafheh: number;
  TedadSafheh: number;
  TarikhNameh: string | null;
  ShomareNameh: string | null;
  OnvanMatlab: string;
  Kholaseh: string | null;
  NoeSanad: number;
  NoeSanadTitle: string | null;
  MarjaNameh: string | null;
  ReferenceType: string | null;
  ReferenceId: number | null;
  IsSystemGenerated: boolean;
  CreateUserId: string;
  CreateDateTime: string;
  FileCount: number;
};

export type PersonCaseFile = {
  ID: number;
  FehrestParvandehID: number;
  PersonId: number;
  Safheh: number;
  FileName: string;
  OriginalFileName: string | null;
  SortOrder: number;
  CreateDateTime: string;
  ContentType: string | null;
  FileSize: number | null;
};

export type PersonCaseUpload = {
  fileName: string;
  originalFileName: string;
  contentType: string;
  data: Buffer;
};

export async function getPersonCaseFile(personId: number) {
  const pool = await getDbPool();
  const result = await pool.request().input("PersonId", personId).execute("bz.SP_FehrestParvandeh_List");
  const sets = (result.recordsets ?? []) as unknown as Record<string, unknown>[][];
  return {
    person: (sets[0]?.[0] ?? null) as unknown as PersonCaseSummary | null,
    documents: (sets[1] ?? []) as unknown as PersonCaseDocument[],
    files: (sets[2] ?? []) as unknown as PersonCaseFile[],
  };
}

export async function createPersonCaseDocument(input: {
  actorUserId: string;
  personId: number;
  tarikhNameh: string | null;
  shomareNameh: string | null;
  onvanMatlab: string;
  kholaseh: string | null;
  noeSanad: number;
  noeSanadTitle: string | null;
  marjaNameh: string | null;
  files: PersonCaseUpload[];
}) {
  const table = new sql.Table("bz.FehrestParvandehFileInput");
  table.columns.add("FileOrder", sql.Int, { nullable: false });
  table.columns.add("FileName", sql.NVarChar(150), { nullable: false });
  table.columns.add("OriginalFileName", sql.NVarChar(260), { nullable: true });
  table.columns.add("ContentType", sql.NVarChar(100), { nullable: false });
  table.columns.add("FileData", sql.VarBinary(sql.MAX), { nullable: false });
  input.files.forEach((file, index) => {
    table.rows.add(index + 1, file.fileName, file.originalFileName, file.contentType, file.data);
  });

  const pool = await getDbPool();
  const result = await pool.request()
    .input("ActorUserId", sql.NVarChar(450), input.actorUserId)
    .input("PersonId", sql.BigInt, input.personId)
    .input("TarikhNameh", sql.NVarChar(10), input.tarikhNameh)
    .input("ShomareNameh", sql.NVarChar(100), input.shomareNameh)
    .input("OnvanMatlab", sql.NVarChar(500), input.onvanMatlab)
    .input("Kholaseh", sql.NVarChar(2000), input.kholaseh)
    .input("NoeSanad", sql.TinyInt, input.noeSanad)
    .input("NoeSanadTitle", sql.NVarChar(150), input.noeSanadTitle)
    .input("MarjaNameh", sql.NVarChar(250), input.marjaNameh)
    .input("Files", table)
    .execute("bz.SP_FehrestParvandeh_Create");
  return result.recordset?.[0] as { ID: number; PersonId: number; AzSafheh: number; TaSafheh: number; TedadSafheh: number };
}

export async function getPersonCaseFileContent(fileName: string) {
  const pool = await getDbPool();
  const result = await pool.request().input("FileName", sql.NVarChar(150), fileName).execute("bz.SP_FehrestParvandeh_File_Get");
  const row = result.recordset?.[0] as { OriginalFileName: string | null; ContentType: string; FileSize: number; FileData: Buffer } | undefined;
  return row ? { ...row, FileData: Buffer.from(row.FileData) } : null;
}
