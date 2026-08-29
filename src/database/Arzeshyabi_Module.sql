USE [DBBazresi];
GO

/* تکمیل ایندکس‌ها و قیود ماژول موجود؛ اجرای مجدد این فایل بی‌خطر است. */
IF OBJECT_ID(N'Arzyabi.Arzyabi',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.Arzyabi',N'CreateUserId')<>400
  ALTER TABLE Arzyabi.Arzyabi ALTER COLUMN CreateUserId nvarchar(200) NOT NULL;
GO
IF OBJECT_ID(N'Arzyabi.Arzyabi',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.Arzyabi',N'EditUserId')<>400
  ALTER TABLE Arzyabi.Arzyabi ALTER COLUMN EditUserId nvarchar(200) NULL;
GO
IF OBJECT_ID(N'Arzyabi.SalArzyabi',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.SalArzyabi',N'CreateUserId')<>400
  ALTER TABLE Arzyabi.SalArzyabi ALTER COLUMN CreateUserId nvarchar(200) NOT NULL;
GO
IF OBJECT_ID(N'Arzyabi.SalArzyabi',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.SalArzyabi',N'EditUserId')<>400
  ALTER TABLE Arzyabi.SalArzyabi ALTER COLUMN EditUserId nvarchar(200) NULL;
GO
IF OBJECT_ID(N'Arzyabi.UsersEmtiaz',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.UsersEmtiaz',N'CreateUserId')<>400
  ALTER TABLE Arzyabi.UsersEmtiaz ALTER COLUMN CreateUserId nvarchar(200) NOT NULL;
GO
IF OBJECT_ID(N'Arzyabi.UsersEmtiaz',N'U') IS NOT NULL AND COL_LENGTH(N'Arzyabi.UsersEmtiaz',N'EditUserId')<>400
  ALTER TABLE Arzyabi.UsersEmtiaz ALTER COLUMN EditUserId nvarchar(200) NULL;
GO

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

/* سازگاری عملیات ثبت نسخه قدیمی با شناسه کاربر ۲۰۰ کاراکتری */
CREATE OR ALTER PROCEDURE Arzyabi.SP_InsertEmtiyazSoal
  @IDArzYabi nvarchar(150), @IDSoal bigint, @Value int,
  @Tozihat nvarchar(2000), @UserName nvarchar(200)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM Arzyabi.UsersEmtiaz WHERE IDArzYabi=@IDArzYabi AND IDSoal=@IDSoal)
    INSERT Arzyabi.UsersEmtiaz(IDArzYabi,IDSoal,[Value],Tozihat,Emtiaz,CreateUserId,CreateDateTime)
    VALUES(@IDArzYabi,@IDSoal,@Value,@Tozihat,@Value,@UserName,dbo.FarsiDateTimeNow());
  ELSE
    UPDATE Arzyabi.UsersEmtiaz
       SET [Value]=@Value,Emtiaz=@Value,Tozihat=@Tozihat,
           EditUserId=@UserName,EditDateTime=dbo.FarsiDateTimeNow()
     WHERE IDArzYabi=@IDArzYabi AND IDSoal=@IDSoal;
END;
GO

CREATE OR ALTER PROCEDURE Arzyabi.SP_UpdateEmtiyaz
  @IDArzYabi nvarchar(150), @Emtiyaz int, @RecordState int, @UserId nvarchar(200)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE Arzyabi.Arzyabi
     SET RecordState=@RecordState,Emtiaz=@Emtiyaz,
         EditDateTime=dbo.FarsiDateTimeNow(),EditUserId=@UserId
   WHERE IDArzYabi=@IDArzYabi AND RecordState=1;
END;
GO
