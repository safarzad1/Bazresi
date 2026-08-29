import { randomUUID } from "node:crypto";
import { getDbPool, sql } from "@/lib/db";

export type EvaluationIdentity = {
  nationalCode: string;
  level: number;
  isAdmin: boolean;
  mahalId: number | null;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value !== null && value !== undefined && typeof value !== "string") return value as T;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function jsonResult<T>(result: { recordset?: unknown[] }, key = "JsonResult", fallback: T) {
  const row = result.recordset?.[0] as Record<string, unknown> | undefined;
  return parseJson<T>(row?.[key], fallback);
}

export async function getEvaluationIdentity(userId: string): Promise<EvaluationIdentity | null> {
  const pool = await getDbPool();
  const result = await pool.request().input("UserId", userId).query(`
    SELECT TOP (1) u.NationalCode,
      ISNULL(s.TypeSemat, s.Level) AS [Level],
      CAST(ISNULL(s.IsAdminArzesh, 0) AS bit) AS IsAdmin,
      CONVERT(bigint, COALESCE(s.Mahal, u.MahalId)) AS MahalId
    FROM dbo.AspNetUsers u
    LEFT JOIN dbo.Semats s ON s.ID = u.Semat
    WHERE u.Id = @UserId AND ISNULL(u.IsDelete, 0) = 0 AND ISNULL(u.IsActive, 1) = 1;
  `);
  const row = result.recordset?.[0] as Record<string, unknown> | undefined;
  if (!row?.NationalCode) return null;
  return {
    nationalCode: String(row.NationalCode),
    level: Number(row.Level || 0),
    isAdmin: row.IsAdmin === true || row.IsAdmin === 1,
    mahalId: row.MahalId == null ? null : Number(row.MahalId),
  };
}

export async function getEvaluationBootstrap(userId: string) {
  const pool = await getDbPool();
  const identity = await getEvaluationIdentity(userId);
  const [yearsResult, departmentsResult, levelsResult, officesResult, usersResult] = await Promise.all([
    pool.request().query("SELECT ID, Onvan, Sal FROM Arzyabi.SalArzyabi ORDER BY Sal DESC"),
    pool.request().query("SELECT ID, [Value], NameFarsi FROM bz.DFN WHERE PID=115 ORDER BY NameFarsi"),
    pool.request().query("SELECT ID, Value, Name FROM bz.SematLevel ORDER BY ID"),
    pool.request().query("SELECT ID, Mahal, OnvanSemat FROM dbo.Semats ORDER BY OnvanSemat"),
    pool.request().query(`SELECT u.FullName,u.NationalCode CodeMelli,u.Semat PostId,
      s.OnvanSemat SematName,COALESCE(s.Mahal,u.MahalId) Mahal,sl.Name TypeSemat_Name,
      COALESCE(s.TypeSemat,s.Level) [Level]
      FROM dbo.AspNetUsers u
      JOIN dbo.Semats s ON s.ID=u.Semat
      LEFT JOIN bz.SematLevel sl ON sl.Value=COALESCE(s.TypeSemat,s.Level)
      WHERE ISNULL(u.IsDelete,0)=0 AND ISNULL(u.IsActive,1)=1 AND ISNULL(u.Semat,0)<>0
      ORDER BY u.FullName`),
  ]);
  return {
    identity,
    years: yearsResult.recordset,
    departments: departmentsResult.recordset,
    levels: levelsResult.recordset,
    offices: officesResult.recordset,
    users: usersResult.recordset,
  };
}

export async function listAssignedEvaluations(nationalCode: string, year: number, state: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("CodeMelli", nationalCode)
    .input("Sal", year)
    .input("RecordState", state)
    .execute("Arzyabi.SP_Arzyabi");
  return jsonResult<unknown[]>(result, "JsonResult", []);
}

export async function listEvaluationQuestions(id: string, evaluatorLevel: number, evaluatedLevel: number) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("IDArzYabi", id)
    .input("LevelArzyabiKonandeh", evaluatorLevel)
    .input("LevelArzyabiShavandeh", evaluatedLevel)
    .execute("Arzyabi.SP_GetSolArzyabi");
  return jsonResult<unknown[]>(result, "JsonResult", []);
}

async function assertOwnedOpenEvaluation(id: string, nationalCode: string) {
  const pool = await getDbPool();
  const result = await pool.request()
    .input("Id", id)
    .input("NationalCode", nationalCode)
    .query("SELECT TOP (1) IDArzYabi, RecordState FROM Arzyabi.Arzyabi WHERE IDArzYabi=@Id AND CodeMelli=@NationalCode AND TypeArzyabi=2");
  const row = result.recordset?.[0] as { RecordState?: number } | undefined;
  if (!row) throw new Error("این ارزشیابی متعلق به کاربر جاری نیست.");
  if (Number(row.RecordState) !== 1) throw new Error("این ارزشیابی قبلاً نهایی شده است.");
}

export async function saveEvaluationScore(args: { id: string; questionId: number; value: number; description: string; userId: string; nationalCode: string }) {
  if (![2, 3, 4, 5].includes(args.value)) throw new Error("امتیاز انتخاب‌شده معتبر نیست.");
  const description = args.description.trim();
  if ([2, 5].includes(args.value) && (description.length < 10 || description.length > 1500)) {
    throw new Error("برای امتیاز قابل بهبود یا عالی، توضیح ۱۰ تا ۱۵۰۰ نویسه الزامی است.");
  }
  await assertOwnedOpenEvaluation(args.id, args.nationalCode);
  const pool = await getDbPool();
  await pool.request()
    .input("IDArzYabi", args.id)
    .input("IDSoal", args.questionId)
    .input("Value", args.value)
    .input("Tozihat", description || null)
    .input("UserName", args.userId)
    .query(`
      MERGE Arzyabi.UsersEmtiaz AS target
      USING (SELECT @IDArzYabi IDArzYabi, @IDSoal IDSoal) AS source
      ON target.IDArzYabi=source.IDArzYabi AND target.IDSoal=source.IDSoal
      WHEN MATCHED THEN UPDATE SET [Value]=@Value, Emtiaz=@Value, Tozihat=@Tozihat,
        EditUserId=@UserName, EditDateTime=dbo.FarsiDateTimeNow()
      WHEN NOT MATCHED THEN INSERT (IDArzYabi,IDSoal,[Value],Emtiaz,Tozihat,CreateUserId,CreateDateTime)
        VALUES (@IDArzYabi,@IDSoal,@Value,@Value,@Tozihat,@UserName,dbo.FarsiDateTimeNow());
    `);
}

export async function finalizeEvaluation(id: string, userId: string, nationalCode: string) {
  await assertOwnedOpenEvaluation(id, nationalCode);
  const pool = await getDbPool();
  const levels = await pool.request().input("Id", id).query("SELECT a.Level EvaluatorLevel,p.Level EvaluatedLevel FROM Arzyabi.Arzyabi a JOIN Arzyabi.Arzyabi p ON p.IDArzYabi=a.PID WHERE a.IDArzYabi=@Id");
  const levelRow = levels.recordset?.[0] as { EvaluatorLevel: number; EvaluatedLevel: number } | undefined;
  if (!levelRow) throw new Error("اطلاعات سطح ارزشیابی کامل نیست.");
  const questions = await listEvaluationQuestions(id, Number(levelRow.EvaluatorLevel), Number(levelRow.EvaluatedLevel)) as Record<string, unknown>[];
  if (!questions.length || questions.some((question) => Number(question.Value || 0) < 2)) throw new Error("ابتدا پاسخ همه سؤال‌ها را ذخیره کنید.");
  const score = questions.reduce((sum, question) => sum + Number(question.Emtiaz || 0), 0);
  await pool.request()
    .input("Id", id)
    .input("Score", score)
    .input("UserId", userId)
    .query("UPDATE Arzyabi.Arzyabi SET RecordState=2, Emtiaz=@Score, EditUserId=@UserId, EditDateTime=dbo.FarsiDateTimeNow() WHERE IDArzYabi=@Id AND RecordState=1");
  return score;
}

export async function listQuestionBank(year: number) {
  const pool = await getDbPool();
  const result = await pool.request().input("Sal", year).execute("Arzyabi.SP_GetListSoal");
  return jsonResult<unknown[]>(result, "JsonResult", []);
}

export async function saveQuestion(input: Record<string, unknown>) {
  const pool = await getDbPool();
  const id = Number(input.id || 0);
  const request = pool.request()
    .input("Id", id)
    .input("Sal", Number(input.year))
    .input("EdareKol", Number(input.department || 0))
    .input("Edare", Number(input.office))
    .input("Evaluator", Number(input.evaluatorLevel))
    .input("Evaluated", Number(input.evaluatedLevel))
    .input("Row", Number(input.row))
    .input("Title", String(input.title || "").trim());
  if (!Number(input.year) || !Number(input.office) || !Number(input.evaluatorLevel) || !Number(input.evaluatedLevel) || !Number(input.row) || !String(input.title || "").trim()) throw new Error("همه فیلدهای سؤال الزامی است.");
  if (id) await request.query("UPDATE Arzyabi.Soals SET Sal=@Sal,EdareKol=@EdareKol,Edare=@Edare,LevelArzyabiKonandeh=@Evaluator,LevelArzyabiShavandeh=@Evaluated,RdfSoal=@Row,OnvanSoal=@Title WHERE ID=@Id");
  else await request.query("INSERT Arzyabi.Soals(Sal,EdareKol,Edare,LevelArzyabiKonandeh,LevelArzyabiShavandeh,RdfSoal,OnvanSoal) VALUES(@Sal,@EdareKol,@Edare,@Evaluator,@Evaluated,@Row,@Title)");
}

export async function deleteQuestion(id: number) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    await new sql.Request(transaction).input("Id", id).query("DELETE FROM Arzyabi.UsersEmtiaz WHERE IDSoal=@Id; DELETE FROM Arzyabi.Soals WHERE ID=@Id;");
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function saveEvaluationYear(id: number, title: string, year: number, userId: string) {
  if (!title.trim() || year < 1300 || year > 1500) throw new Error("عنوان و سال معتبر وارد کنید.");
  const pool = await getDbPool();
  const request = pool.request().input("Id", id).input("Title", title.trim()).input("Year", year).input("UserId", userId);
  if (id) await request.query("UPDATE Arzyabi.SalArzyabi SET Onvan=@Title,Sal=@Year,EditUserId=@UserId,EditDateTime=dbo.FarsiDateTimeNow() WHERE ID=@Id");
  else await request.query("IF NOT EXISTS(SELECT 1 FROM Arzyabi.SalArzyabi WHERE Sal=@Year) INSERT Arzyabi.SalArzyabi(Onvan,Sal,CreateUserId,CreateDateTime) VALUES(@Title,@Year,@UserId,dbo.FarsiDateTimeNow())");
}

export async function deleteEvaluationYear(id: number) {
  const pool = await getDbPool(); const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    const request = new sql.Request(transaction).input("Id", id);
    await request.query(`
      DECLARE @Year int=(SELECT Sal FROM Arzyabi.SalArzyabi WHERE ID=@Id);
      DELETE ue FROM Arzyabi.UsersEmtiaz ue JOIN Arzyabi.Arzyabi a ON a.IDArzYabi=ue.IDArzYabi WHERE a.Sal=@Year;
      DELETE FROM Arzyabi.Arzyabi WHERE Sal=@Year;
      DELETE FROM Arzyabi.Soals WHERE Sal=@Year;
      DELETE FROM Arzyabi.SalArzyabi WHERE ID=@Id;
    `);
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function listEvaluationTree(year: number, page: number, search: string, scope: number) {
  const pool = await getDbPool();
  const result = await pool.request().input("Sal", year).input("PageNumber", page).input("Search", search || null).input("SetadOstan", scope).execute("Arzyabi.SP_GetDerakhtvarehArzeshyabi");
  const outer = jsonResult<Record<string, unknown>>(result, "Data", {});
  return { ...outer, Derakht: parseJson(outer.Derakht, []), TaeedNahaeeNashodeList: parseJson(outer.TaeedNahaeeNashodeList, []) };
}

export async function createEvaluationAssignments(year: number, evaluated: Record<string, unknown>, evaluators: Record<string, unknown>[], userId: string) {
  if (!year || !evaluated.CodeMelli || !evaluated.PostId || !evaluators.length) throw new Error("فرد ارزیابی‌شونده و ارزیابی‌کنندگان را انتخاب کنید.");
  const pool = await getDbPool(); const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    const parentResult = await new sql.Request(transaction).input("Year", year).input("Code", String(evaluated.CodeMelli)).input("Post", Number(evaluated.PostId)).query("SELECT TOP 1 IDArzYabi FROM Arzyabi.Arzyabi WHERE Sal=@Year AND CodeMelli=@Code AND PostId=@Post AND TypeArzyabi=1 AND PID IS NULL");
    let parentId = String((parentResult.recordset?.[0] as { IDArzYabi?: string } | undefined)?.IDArzYabi || "");
    if (!parentId) {
      parentId = randomUUID();
      await new sql.Request(transaction).input("Id", parentId).input("Year", year).input("Code", String(evaluated.CodeMelli)).input("Mahal", Number(evaluated.Mahal || 0) || null).input("Post", Number(evaluated.PostId)).input("Level", Number(evaluated.Level)).input("UserId", userId).query("INSERT Arzyabi.Arzyabi(IDArzYabi,Sal,CodeMelli,Mahal,PostId,[Level],TypeArzyabi,PID,Emtiaz,RecordState,CreateUserId,CreateDateTime) VALUES(@Id,@Year,@Code,@Mahal,@Post,@Level,1,NULL,0,1,@UserId,dbo.FarsiDateTimeNow())");
    }
    for (const evaluator of evaluators) {
      await new sql.Request(transaction).input("Id", randomUUID()).input("Parent", parentId).input("Year", year).input("Code", String(evaluator.CodeMelli)).input("Mahal", Number(evaluator.Mahal || 0) || null).input("Post", Number(evaluator.PostId)).input("Level", Number(evaluator.Level)).input("UserId", userId).query("IF NOT EXISTS(SELECT 1 FROM Arzyabi.Arzyabi WHERE PID=@Parent AND CodeMelli=@Code AND PostId=@Post) INSERT Arzyabi.Arzyabi(IDArzYabi,Sal,CodeMelli,Mahal,PostId,[Level],TypeArzyabi,PID,Emtiaz,RecordState,CreateUserId,CreateDateTime) VALUES(@Id,@Year,@Code,@Mahal,@Post,@Level,2,@Parent,0,1,@UserId,dbo.FarsiDateTimeNow())");
    }
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function setEvaluationState(id: string, action: "unlock" | "delete", userId: string) {
  const pool = await getDbPool();
  if (action === "unlock") {
    await pool.request().input("Id", id).input("UserId", userId).query("UPDATE Arzyabi.Arzyabi SET RecordState=1,Emtiaz=0,EditUserId=@UserId,EditDateTime=dbo.FarsiDateTimeNow() WHERE IDArzYabi=@Id AND PID IS NOT NULL"); return;
  }
  const transaction = new sql.Transaction(pool); await transaction.begin();
  try {
    const request = new sql.Request(transaction).input("Id", id);
    await request.query("DELETE FROM Arzyabi.UsersEmtiaz WHERE IDArzYabi IN (SELECT IDArzYabi FROM Arzyabi.Arzyabi WHERE IDArzYabi=@Id OR PID=@Id); DELETE FROM Arzyabi.Arzyabi WHERE IDArzYabi=@Id OR PID=@Id;");
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function evaluationBreakdown(parentId: string) {
  const pool = await getDbPool(); const result = await pool.request().input("PID", parentId).execute("Arzyabi.SP_TafkikArzeshyabi");
  return jsonResult<unknown[]>(result, "JsonResult", []);
}

export async function setEvaluationFileName(id: string, fileName: string | null, userId: string) {
  const pool = await getDbPool(); await pool.request().input("Id", id).input("File", fileName).input("UserId", userId).query("UPDATE Arzyabi.Arzyabi SET FileName=@File,EditUserId=@UserId,EditDateTime=dbo.FarsiDateTimeNow() WHERE IDArzYabi=@Id");
}
