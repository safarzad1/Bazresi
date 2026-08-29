import { getDbPool, sql } from "@/lib/db";

export type CancellationProposalDraft = {
  EntesabId: number;
  PersonId: number;
  CodeMelli: string | null;
  FirstName: string | null;
  LastName: string | null;
  FullName: string | null;
  FatherName: string | null;
  TarikhTavalod: string | null;
  ShomareShenasnameh: string | null;
  PostId: number;
  PostOnvan: string | null;
  TarikhEblagh: string | null;
  ModatEblagKhedmat: number | null;
  TarikhPayan: string | null;
  DaysLeft: number | null;
  RequestingPostId: number;
  RequesterFullName: string | null;
  RequesterPostTitle: string | null;
  SignaturePath: string | null;
};

export type CancellationDocumentRecord = {
  ProposalId: number;
  FileName: string | null;
  ContentType: string;
  FileSize: number;
  FileData: Buffer;
  DocumentHash: string | null;
  FirstName: string | null;
  LastName: string | null;
};

type JsonResultRow = { JsonResult?: string | null };
type CreateResultRow = { ProposalId?: number; DocumentHash?: string | null };
type ExistingProposalRow = {
  ProposalId?: number;
  DocumentHash?: string | null;
  RecordState?: number | null;
  RecordStateNameFarsi?: string | null;
  DecisionCode?: number | null;
  DecisionNote?: string | null;
};
type ExistingReasonRow = { Dalayel?: string | null };

export type CancellationWorkflowRow = {
  ProposalId: number;
  EntesabId: number;
  PersonId: number;
  FullName: string | null;
  CodeMelli: string | null;
  PostOnvan: string | null;
  TarikhEblagh: string | null;
  RequesterFullName: string | null;
  RequesterPostTitle: string | null;
  CreateDateTime: string | null;
  RecordState: number;
  RecordStateNameFarsi: string | null;
  DecisionCode: number | null;
  DecisionNote: string | null;
  DecisionByFullName: string | null;
  DecisionAt: string | null;
  CanDecide: boolean;
  IsOwnRequest: boolean;
  ReasonsCount: number;
  HasAttachment: boolean;
};

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDraft(value: unknown): CancellationProposalDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const entesabId = Number(item.EntesabId ?? 0);
  const personId = Number(item.PersonId ?? 0);
  const postId = Number(item.PostId ?? 0);
  const requestingPostId = Number(item.RequestingPostId ?? 0);
  if (![entesabId, personId, postId, requestingPostId].every((number) => Number.isSafeInteger(number) && number > 0)) return null;

  return {
    EntesabId: entesabId,
    PersonId: personId,
    CodeMelli: optionalText(item.CodeMelli),
    FirstName: optionalText(item.FirstName),
    LastName: optionalText(item.LastName),
    FullName: optionalText(item.FullName),
    FatherName: optionalText(item.FatherName),
    TarikhTavalod: optionalText(item.TarikhTavalod),
    ShomareShenasnameh: optionalText(item.ShomareShenasnameh),
    PostId: postId,
    PostOnvan: optionalText(item.PostOnvan),
    TarikhEblagh: optionalText(item.TarikhEblagh),
    ModatEblagKhedmat: optionalNumber(item.ModatEblagKhedmat),
    TarikhPayan: optionalText(item.TarikhPayan),
    DaysLeft: optionalNumber(item.DaysLeft),
    RequestingPostId: requestingPostId,
    RequesterFullName: optionalText(item.RequesterFullName),
    RequesterPostTitle: optionalText(item.RequesterPostTitle),
    SignaturePath: optionalText(item.SignaturePath),
  };
}

export async function getCancellationProposalDraft(actorUserId: string, entesabId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("EntesabId", entesabId)
    .execute("bz.SP_Appointments_CancellationDraft_Get");

  const row = (result.recordset?.[0] ?? null) as JsonResultRow | null;
  if (!row?.JsonResult?.trim()) return null;

  try {
    return normalizeDraft(JSON.parse(row.JsonResult) as unknown);
  } catch {
    return null;
  }
}

export async function createCancellationProposal(
  actorUserId: string,
  entesabId: number,
  reasons: string[],
  formFileName: string,
  formContentType: string,
  formFileData: Buffer,
  documentHash: string,
) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("EntesabId", entesabId)
    .input("ReasonsJson", JSON.stringify(reasons))
    .input("FormFileName", sql.NVarChar(150), formFileName)
    .input("FormContentType", sql.NVarChar(100), formContentType)
    .input("FormFileData", sql.VarBinary(sql.MAX), formFileData)
    .input("DocumentHash", documentHash)
    .execute("bz.SP_Appointments_CancellationProposal_Create");

  const row = (result.recordset?.[0] ?? null) as CreateResultRow | null;
  const proposalId = Number(row?.ProposalId ?? 0);
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) {
    throw new Error("ثبت پیشنهاد انجام شد اما شناسه آن دریافت نشد.");
  }
  return { proposalId, documentHash: row?.DocumentHash ?? documentHash };
}

export async function getCancellationProposalByEntesab(actorUserId: string, entesabId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("EntesabId", entesabId)
    .execute("bz.SP_Appointments_CancellationProposal_GetByEntesab");

  const proposal = (result.recordsets?.[0]?.[0] ?? null) as ExistingProposalRow | null;
  const proposalId = Number(proposal?.ProposalId ?? 0);
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) return null;

  const reasonRows = (result.recordsets?.[1] ?? []) as ExistingReasonRow[];
  const reasons = reasonRows
    .map((row) => optionalText(row.Dalayel))
    .filter((reason): reason is string => Boolean(reason))
    .slice(0, 10);

  return {
    proposalId,
    documentHash: optionalText(proposal?.DocumentHash),
    recordState: optionalNumber(proposal?.RecordState),
    recordStateNameFarsi: optionalText(proposal?.RecordStateNameFarsi),
    decisionCode: optionalNumber(proposal?.DecisionCode),
    decisionNote: optionalText(proposal?.DecisionNote),
    reasons,
  };
}

export async function listCancellationWorkflow(actorUserId: string) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_Appointments_CancellationWorkflow_List");

  return ((result.recordset ?? []) as Array<Record<string, unknown>>).flatMap((item) => {
    const proposalId = Number(item.ProposalId ?? 0);
    const entesabId = Number(item.EntesabId ?? 0);
    const personId = Number(item.PersonId ?? 0);
    if (![proposalId, entesabId, personId].every((value) => Number.isSafeInteger(value) && value > 0)) return [];
    return [{
      ProposalId: proposalId,
      EntesabId: entesabId,
      PersonId: personId,
      FullName: optionalText(item.FullName),
      CodeMelli: optionalText(item.CodeMelli),
      PostOnvan: optionalText(item.PostOnvan),
      TarikhEblagh: optionalText(item.TarikhEblagh),
      RequesterFullName: optionalText(item.RequesterFullName),
      RequesterPostTitle: optionalText(item.RequesterPostTitle),
      CreateDateTime: optionalText(item.CreateDateTime),
      RecordState: Number(item.RecordState ?? 2),
      RecordStateNameFarsi: optionalText(item.RecordStateNameFarsi),
      DecisionCode: optionalNumber(item.DecisionCode),
      DecisionNote: optionalText(item.DecisionNote),
      DecisionByFullName: optionalText(item.DecisionByFullName),
      DecisionAt: optionalText(item.DecisionAt),
      CanDecide: item.CanDecide === true || item.CanDecide === 1 || item.CanDecide === "1",
      IsOwnRequest: item.IsOwnRequest === true || item.IsOwnRequest === 1 || item.IsOwnRequest === "1",
      ReasonsCount: Math.max(0, Number(item.ReasonsCount ?? 0)),
      HasAttachment: item.HasAttachment === true || item.HasAttachment === 1 || item.HasAttachment === "1",
    } satisfies CancellationWorkflowRow];
  });
}

export async function decideCancellationProposal(
  actorUserId: string,
  proposalId: number,
  decisionCode: 3 | 4,
  decisionNote: string | null,
) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("ProposalId", proposalId)
    .input("DecisionCode", decisionCode)
    .input("DecisionNote", sql.NVarChar(1000), decisionNote)
    .execute("bz.SP_Appointments_CancellationWorkflow_Decide");
  const row = (result.recordset?.[0] ?? null) as Record<string, unknown> | null;
  return {
    proposalId: Number(row?.ProposalId ?? proposalId),
    recordState: Number(row?.RecordState ?? (decisionCode === 4 ? 12 : 13)),
    statusName: optionalText(row?.RecordStateNameFarsi),
  };
}

export async function getCancellationProposalDocument(actorUserId: string, proposalId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("ProposalId", proposalId)
    .execute("bz.SP_Appointments_CancellationDocument_Get");

  const row = (result.recordset?.[0] ?? null) as (Partial<CancellationDocumentRecord> & { DocumentSvg?: string | null }) | null;
  const resultProposalId = Number(row?.ProposalId ?? 0);
  if (!row || resultProposalId < 1) return null;

  const storedBytes = row.FileData ? Buffer.from(row.FileData) : null;
  const legacySvg = optionalText(row.DocumentSvg);
  const fileData = storedBytes?.length ? storedBytes : legacySvg ? Buffer.from(legacySvg, "utf8") : null;
  if (!fileData?.length) return null;

  return {
    ProposalId: resultProposalId,
    FileName: optionalText(row.FileName),
    ContentType: optionalText(row.ContentType) ?? (legacySvg ? "image/svg+xml; charset=utf-8" : "image/png"),
    FileSize: Number(row.FileSize ?? fileData.length),
    FileData: fileData,
    DocumentHash: optionalText(row.DocumentHash),
    FirstName: optionalText(row.FirstName),
    LastName: optionalText(row.LastName),
  } satisfies CancellationDocumentRecord;
}
