USE [DBBazresi];
GO

/* تکمیل ایندکس‌ها و قیود ماژول موجود؛ اجرای مجدد این فایل بی‌خطر است. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'Arzyabi.UsersEmtiaz') AND name=N'UX_UsersEmtiaz_EvaluationQuestion')
AND NOT EXISTS (SELECT 1 FROM Arzyabi.UsersEmtiaz GROUP BY IDArzYabi,IDSoal HAVING COUNT(*)>1)
  CREATE UNIQUE INDEX UX_UsersEmtiaz_EvaluationQuestion ON Arzyabi.UsersEmtiaz(IDArzYabi,IDSoal);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'Arzyabi.Soals') AND name=N'IX_Soals_Selection')
  CREATE INDEX IX_Soals_Selection ON Arzyabi.Soals(Sal,LevelArzyabiKonandeh,LevelArzyabiShavandeh,Edare,RdfSoal);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'Arzyabi.SalArzyabi') AND name=N'UX_SalArzyabi_Sal')
AND NOT EXISTS (SELECT 1 FROM Arzyabi.SalArzyabi GROUP BY Sal HAVING COUNT(*)>1)
  CREATE UNIQUE INDEX UX_SalArzyabi_Sal ON Arzyabi.SalArzyabi(Sal);
GO

/* نسخه قبلی در نام جدول UsersEmtiaz یک ناسازگاری نگارشی داشت؛ این نسخه اصلاح شده است. */
CREATE OR ALTER PROCEDURE Arzyabi.SP_GetEmtiyazSoals @IDArzYabi nvarchar(150)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT ISNULL((SELECT ue.ID,ue.IDArzYabi,ue.IDSoal,q.OnvanSoal,ue.[Value],d.NameFarsi,
    ue.Emtiaz,ue.Tozihat,ue.CreateUserId,ue.CreateDateTime,ue.EditUserId,ue.EditDateTime
    FROM Arzyabi.UsersEmtiaz ue
    LEFT JOIN Arzyabi.Soals q ON q.ID=ue.IDSoal
    LEFT JOIN bz.DFN d ON d.PID=200 AND d.[Value]=ue.[Value]
    WHERE ue.IDArzYabi=@IDArzYabi
    FOR JSON PATH, INCLUDE_NULL_VALUES),N'[]') JsonResult;
END;
GO
