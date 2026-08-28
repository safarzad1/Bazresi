import { getDbPool } from "@/lib/db";

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
  DocumentSvg: string;
  DocumentHash: string | null;
  FirstName: string | null;
  LastName: string | null;
};

type JsonResultRow = { JsonResult?: string | null };
type CreateResultRow = { ProposalId?: number; DocumentHash?: string | null };

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
  documentSvg: string,
  documentHash: string,
) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("EntesabId", entesabId)
    .input("ReasonsJson", JSON.stringify(reasons))
    .input("DocumentSvg", documentSvg)
    .input("DocumentHash", documentHash)
    .execute("bz.SP_Appointments_CancellationProposal_Create");

  const row = (result.recordset?.[0] ?? null) as CreateResultRow | null;
  const proposalId = Number(row?.ProposalId ?? 0);
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) {
    throw new Error("ثبت پیشنهاد انجام شد اما شناسه آن دریافت نشد.");
  }
  return { proposalId, documentHash: row?.DocumentHash ?? documentHash };
}

export async function getCancellationProposalDocument(actorUserId: string, proposalId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("ProposalId", proposalId)
    .execute("bz.SP_Appointments_CancellationDocument_Get");

  const row = (result.recordset?.[0] ?? null) as Partial<CancellationDocumentRecord> | null;
  if (!row?.DocumentSvg || Number(row.ProposalId ?? 0) < 1) return null;
  return {
    ProposalId: Number(row.ProposalId),
    DocumentSvg: String(row.DocumentSvg),
    DocumentHash: optionalText(row.DocumentHash),
    FirstName: optionalText(row.FirstName),
    LastName: optionalText(row.LastName),
  } satisfies CancellationDocumentRecord;
}
