import { getDbPool } from "@/lib/db";

export type WorkflowPerson = { PersonId:number; CodeMelli:string; FirstName:string; LastName:string; FullName:string; FatherName:string; TarikhTavalod:string|null; ShomareShenasnameh:string|null; Shoghl:string|null; TelHamrah:string|null };
export type WorkflowPost = { PostId:number; PostOnvan:string; Mahal:number|null };
export type WorkflowContext = { RequesterPostId:number; RequesterFullName:string|null; RequesterPostTitle:string|null; DestinationPostId:number; DestinationPostTitle:string|null; DestinationFullName:string|null };
export type WorkflowRow = {
  EntesabId:number; PersonId:number; Code:string|null; CodeMelli:string|null; FullName:string|null; FatherName:string|null; PostId:number; PostOnvan:string|null;
  RecordState:number; RecordStateNameFarsi:string|null; TaeedOrAdamTaeed:number|null; TaeedOrAdamTaeedNameFarsi:string|null; CreateDateTime:string|null;
  TarikhEblagh:string|null; ModatEblagKhedmat:number|null; RequesterFullName:string|null; RequesterPostTitle:string|null; DecisionByFullName:string|null;
  DecisionAt:string|null; DecisionNote:string|null; IsOwnRequest:boolean; CanDecide:boolean; ReasonsCount:number; HasInitialInterview:boolean; HasFinalInterview:boolean; HasOrder:boolean;
  ReferralCount:number; UnreadReferrals:number; DestinationTitles:string|null;
};

export type WorkflowDetail = WorkflowRow & {
  FirstName:string|null; LastName:string|null; TarikhTavalod:string|null; ShomareShenasnameh:string|null; Shoghl:string|null; TelHamrah:string|null;
  DestinationPostTitle:string|null; DestinationFullName:string|null;
};
export type WorkflowInterview = { InterviewType:number; InterviewTypeTitle:string; FormJson:string; CreateDateTime:string|null; EditDateTime:string|null };
export type WorkflowHistory = { HistoryId:number; ActionTitle:string; FromState:number|null; ToState:number; Note:string|null; ActorFullName:string|null; CreateDateTime:string|null; ReferralId:number|null; FromPostId:number|null; FromPostTitle:string|null; ToPostId:number|null; ToPostTitle:string|null };
export type WorkflowFile = { FileId:number; FileKind:number; FileKindTitle:string; FileName:string; ContentType:string; FileSize:number; CreateDateTime:string|null };
export type WorkflowReferral = {
  ReferralId:number; ParentReferralId:number|null; ReferralKind:number; FromPostId:number; FromPostTitle:string|null; FromFullName:string|null;
  ToPostId:number; ToPostTitle:string|null; ToFullName:string|null; Note:string|null; StatusCode:number; StatusTitle:string|null; IsRead:boolean;
  ReadByFullName:string|null; ReadDateTime:string|null; IsRecalled:boolean; RecallDateTime:string|null; CreateByFullName:string|null; CreateDateTime:string|null;
  CanReply:boolean; CanRecall:boolean; CanArchive:boolean; IsArchivedForActor:boolean;
};
export type WorkflowReferralPost = { PostId:number; PostTitle:string; ParentPostId:number|null; Mahal:number|null; AssigneeFullName:string|null };
export type WorkflowReferralContext = { ActorPostId:number; ActorFullName:string|null; ActorPostTitle:string|null; CanRefer:boolean };

function bool(value:unknown){ return value===true||value===1||value==="1"; }
function text(value:unknown){ return typeof value==="string"&&value.trim()?value.trim():null; }
function num(value:unknown){ if(value===null||value===undefined||value==="") return null; const n=Number(value); return Number.isFinite(n)?n:null; }

export async function getAppointmentWorkflowLookups(actorUserId:string,search:string){
  const pool=await getDbPool();
  const result=await pool.request().input("ActorUserId",actorUserId).input("Search",search||null).execute("bz.SP_Appointments_Workflow_Lookups");
  const recordsets=(result.recordsets??[]) as unknown as Record<string,unknown>[][];
  return {
    persons:(recordsets[0]??[] as unknown as WorkflowPerson[]).slice(0,20) as unknown as WorkflowPerson[],
    posts:(recordsets[1]??[]) as unknown as WorkflowPost[],
    context:(recordsets[2]?.[0]??null) as unknown as WorkflowContext|null,
  };
}

export async function createAppointmentWorkflow(input:{actorUserId:string;personId:number;postId:number;reasons:string[];initialInterview:unknown;fileName:string;contentType:string;fileData:Buffer}){
  const pool=await getDbPool();
  const result=await pool.request().input("ActorUserId",input.actorUserId).input("PersonId",input.personId).input("PostId",input.postId)
    .input("ReasonsJson",JSON.stringify(input.reasons)).input("InitialInterviewJson",JSON.stringify(input.initialInterview))
    .input("ProposalFileName",input.fileName).input("ProposalContentType",input.contentType).input("ProposalFileData",input.fileData)
    .execute("bz.SP_Appointments_Workflow_Create");
  return result.recordset?.[0] as {EntesabId:number;Code:string};
}

function normalizeRow(item:Record<string,unknown>):WorkflowRow{
  return {
    EntesabId:Number(item.EntesabId??0),PersonId:Number(item.PersonId??0),Code:text(item.Code),CodeMelli:text(item.CodeMelli),FullName:text(item.FullName),FatherName:text(item.FatherName),PostId:Number(item.PostId??0),PostOnvan:text(item.PostOnvan),
    RecordState:Number(item.RecordState??2),RecordStateNameFarsi:text(item.RecordStateNameFarsi),TaeedOrAdamTaeed:num(item.TaeedOrAdamTaeed),TaeedOrAdamTaeedNameFarsi:text(item.TaeedOrAdamTaeedNameFarsi),CreateDateTime:text(item.CreateDateTime),TarikhEblagh:text(item.TarikhEblagh),ModatEblagKhedmat:num(item.ModatEblagKhedmat),
    RequesterFullName:text(item.RequesterFullName),RequesterPostTitle:text(item.RequesterPostTitle),DecisionByFullName:text(item.DecisionByFullName),DecisionAt:text(item.DecisionAt),DecisionNote:text(item.DecisionNote),IsOwnRequest:bool(item.IsOwnRequest),CanDecide:bool(item.CanDecide),ReasonsCount:Number(item.ReasonsCount??0),HasInitialInterview:bool(item.HasInitialInterview),HasFinalInterview:bool(item.HasFinalInterview),HasOrder:bool(item.HasOrder),ReferralCount:Number(item.ReferralCount??0),UnreadReferrals:Number(item.UnreadReferrals??0),DestinationTitles:text(item.DestinationTitles),
  };
}

export async function listAppointmentWorkflow(actorUserId:string){
  const pool=await getDbPool(); const result=await pool.request().input("ActorUserId",actorUserId).execute("bz.SP_Appointments_Workflow_List");
  return ((result.recordset??[]) as Record<string,unknown>[]).map(normalizeRow);
}

export async function getAppointmentWorkflow(actorUserId:string,entesabId:number){
  const pool=await getDbPool();
  await pool.request().input("ActorUserId",actorUserId).input("EntesabId",entesabId).execute("bz.SP_Appointments_Workflow_Referral_MarkRead");
  const result=await pool.request().input("ActorUserId",actorUserId).input("EntesabId",entesabId).execute("bz.SP_Appointments_Workflow_Get");
  const recordsets=(result.recordsets??[]) as unknown as Record<string,unknown>[][];
  const raw=(recordsets[0]?.[0]??null) as Record<string,unknown>|null; if(!raw)return null;
  const row=normalizeRow(raw) as WorkflowDetail;
  row.FirstName=text(raw.FirstName); row.LastName=text(raw.LastName); row.TarikhTavalod=text(raw.TarikhTavalod); row.ShomareShenasnameh=text(raw.ShomareShenasnameh); row.Shoghl=text(raw.Shoghl); row.TelHamrah=text(raw.TelHamrah); row.DestinationPostTitle=text(raw.DestinationPostTitle); row.DestinationFullName=text(raw.DestinationFullName);
  const referrals=(recordsets[5]??[]).map((item):WorkflowReferral=>({
    ReferralId:Number(item.ReferralId??0),ParentReferralId:num(item.ParentReferralId),ReferralKind:Number(item.ReferralKind??1),FromPostId:Number(item.FromPostId??0),FromPostTitle:text(item.FromPostTitle),FromFullName:text(item.FromFullName),ToPostId:Number(item.ToPostId??0),ToPostTitle:text(item.ToPostTitle),ToFullName:text(item.ToFullName),Note:text(item.Note),StatusCode:Number(item.StatusCode??1),StatusTitle:text(item.StatusTitle),IsRead:bool(item.IsRead),ReadByFullName:text(item.ReadByFullName),ReadDateTime:text(item.ReadDateTime),IsRecalled:bool(item.IsRecalled),RecallDateTime:text(item.RecallDateTime),CreateByFullName:text(item.CreateByFullName),CreateDateTime:text(item.CreateDateTime),CanReply:bool(item.CanReply),CanRecall:bool(item.CanRecall),CanArchive:bool(item.CanArchive),IsArchivedForActor:bool(item.IsArchivedForActor),
  }));
  const referralPosts=(recordsets[6]??[]).map((item):WorkflowReferralPost=>({PostId:Number(item.PostId??0),PostTitle:text(item.PostTitle)??"—",ParentPostId:num(item.ParentPostId),Mahal:num(item.Mahal),AssigneeFullName:text(item.AssigneeFullName)}));
  const rawContext=(recordsets[7]?.[0]??null) as Record<string,unknown>|null;
  const referralContext:WorkflowReferralContext|null=rawContext?{ActorPostId:Number(rawContext.ActorPostId??0),ActorFullName:text(rawContext.ActorFullName),ActorPostTitle:text(rawContext.ActorPostTitle),CanRefer:bool(rawContext.CanRefer)}:null;
  return {row,reasons:(recordsets[1]??[]).map(x=>typeof x.ReasonText==="string"?x.ReasonText.trim():undefined).filter((x):x is string=>Boolean(x)),interviews:(recordsets[2]??[]) as unknown as WorkflowInterview[],history:(recordsets[3]??[]) as unknown as WorkflowHistory[],files:(recordsets[4]??[]) as unknown as WorkflowFile[],referrals,referralPosts,referralContext};
}

export async function appointmentReferralAction(input:{actorUserId:string;entesabId:number;action:"forward"|"reply"|"recall"|"archive"|"restore";referralId:number|null;destinationPostIds:number[];note:string|null}){
  const pool=await getDbPool();
  const result=await pool.request().input("ActorUserId",input.actorUserId).input("EntesabId",input.entesabId).input("Action",input.action)
    .input("ReferralId",input.referralId).input("DestinationPostIdsJson",JSON.stringify(input.destinationPostIds)).input("Note",input.note)
    .execute("bz.SP_Appointments_Workflow_Referral_Action");
  return result.recordset?.[0] as {EntesabId:number;Action:string};
}

export async function decideAppointmentWorkflow(input:{actorUserId:string;entesabId:number;action:"save-interview"|"approve"|"reject";finalInterview:unknown|null;note:string|null;tarikhEblagh:string|null;durationMonths:number|null;fileName:string|null;contentType:string|null;fileData:Buffer|null}){
  const pool=await getDbPool(); const result=await pool.request().input("ActorUserId",input.actorUserId).input("EntesabId",input.entesabId).input("Action",input.action)
    .input("FinalInterviewJson",input.finalInterview?JSON.stringify(input.finalInterview):null).input("DecisionNote",input.note)
    .input("TarikhEblagh",input.tarikhEblagh).input("DurationMonths",input.durationMonths)
    .input("OrderFileName",input.fileName).input("OrderContentType",input.contentType).input("OrderFileData",input.fileData)
    .execute("bz.SP_Appointments_Workflow_Decide");
  return result.recordset?.[0] as {EntesabId:number;RecordState:number};
}

export async function getAppointmentWorkflowFile(actorUserId:string,fileId:number){
  const pool=await getDbPool(); const result=await pool.request().input("ActorUserId",actorUserId).input("FileId",fileId).execute("bz.SP_Appointments_Workflow_File_Get");
  const row=result.recordset?.[0] as {FileId:number;FileName:string;ContentType:string;FileSize:number;FileData:Buffer}|undefined;
  return row?{...row,FileData:Buffer.from(row.FileData)}:null;
}
