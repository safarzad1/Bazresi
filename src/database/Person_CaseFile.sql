/* ============================================================================
   پرونده الکترونیکی اشخاص / فهرست پرونده - نسخه اصلاحی 2
   - اطلاعات فهرست و صفحات: DBBazresi
   - باینری فایل‌ها: DBBazresiFiles
   - هر فایل = یک شماره صفحه
   - شماره صفحه به صورت Append-only است و حتی در حذف منطقی دوباره استفاده نمی‌شود.
   ============================================================================ */

USE [DBBazresi];
GO

IF SCHEMA_ID(N'bz') IS NULL EXEC(N'CREATE SCHEMA [bz] AUTHORIZATION [dbo]');
GO

/* Preflight: اگر نسخه قدیمی جدول هنوز وجود دارد، قبل از ادامه متوقف شو تا خطاهای زنجیره‌ای ایجاد نشود. */
IF OBJECT_ID(N'[bz].[FehrestParvandeh]', N'U') IS NOT NULL
   AND COL_LENGTH(N'bz.FehrestParvandeh', N'PersonId') IS NULL
    THROW 51390, N'جدول قدیمی bz.FehrestParvandeh هنوز وجود دارد. ابتدا آن را حذف کنید و سپس اسکریپت را دوباره اجرا کنید.', 1;
GO
IF OBJECT_ID(N'[bz].[FehrestParvandehFiles]', N'U') IS NOT NULL
   AND COL_LENGTH(N'bz.FehrestParvandehFiles', N'FehrestParvandehID') IS NULL
    THROW 51391, N'جدول قدیمی bz.FehrestParvandehFiles هنوز وجود دارد. ابتدا آن را حذف کنید و سپس اسکریپت را دوباره اجرا کنید.', 1;
GO

IF OBJECT_ID(N'[bz].[FehrestParvandeh]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[FehrestParvandeh]
    (
        [ID]                    BIGINT IDENTITY(1,1) NOT NULL,
        [PersonId]              BIGINT NOT NULL,
        [AzSafheh]              INT NOT NULL,
        [TaSafheh]              INT NOT NULL,
        [TedadSafheh]           AS ([TaSafheh]-[AzSafheh]+(1)) PERSISTED,
        [TarikhNameh]           NVARCHAR(10) NULL,
        [ShomareNameh]          NVARCHAR(100) NULL,
        [OnvanMatlab]           NVARCHAR(500) NOT NULL,
        [Kholaseh]              NVARCHAR(2000) NULL,
        [NoeSanad]              TINYINT NOT NULL CONSTRAINT [DF_FehrestParvandeh_NoeSanad] DEFAULT(1),
        [NoeSanadTitle]         NVARCHAR(150) NULL,
        [MarjaNameh]            NVARCHAR(250) NULL,
        [ReferenceType]         NVARCHAR(50) NULL,
        [ReferenceId]           BIGINT NULL,
        [IsSystemGenerated]     BIT NOT NULL CONSTRAINT [DF_FehrestParvandeh_IsSystemGenerated] DEFAULT(0),
        [IsDelete]              BIT NOT NULL CONSTRAINT [DF_FehrestParvandeh_IsDelete] DEFAULT(0),
        [CreateUserId]          NVARCHAR(450) NOT NULL,
        [CreateDateTime]        DATETIME2(0) NOT NULL CONSTRAINT [DF_FehrestParvandeh_CreateDateTime] DEFAULT(SYSDATETIME()),
        [EditUserId]            NVARCHAR(450) NULL,
        [EditDateTime]          DATETIME2(0) NULL,
        [DeleteUserId]          NVARCHAR(450) NULL,
        [DeleteDateTime]        DATETIME2(0) NULL,
        [RowVersion]            ROWVERSION NOT NULL,
        CONSTRAINT [PK_FehrestParvandeh] PRIMARY KEY CLUSTERED ([ID]),
        CONSTRAINT [CK_FehrestParvandeh_Pages] CHECK ([AzSafheh] > 0 AND [TaSafheh] >= [AzSafheh])
    );
END;
GO

IF OBJECT_ID(N'[bz].[FehrestParvandehFiles]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[FehrestParvandehFiles]
    (
        [ID]                    BIGINT IDENTITY(1,1) NOT NULL,
        [FehrestParvandehID]    BIGINT NOT NULL,
        [PersonId]              BIGINT NOT NULL,
        [Safheh]                INT NOT NULL,
        [FileName]              NVARCHAR(150) NOT NULL,
        [OriginalFileName]      NVARCHAR(260) NULL,
        [SortOrder]             INT NOT NULL,
        [IsDelete]              BIT NOT NULL CONSTRAINT [DF_FehrestParvandehFiles_IsDelete] DEFAULT(0),
        [CreateUserId]          NVARCHAR(450) NOT NULL,
        [CreateDateTime]        DATETIME2(0) NOT NULL CONSTRAINT [DF_FehrestParvandehFiles_CreateDateTime] DEFAULT(SYSDATETIME()),
        [DeleteUserId]          NVARCHAR(450) NULL,
        [DeleteDateTime]        DATETIME2(0) NULL,
        [RowVersion]            ROWVERSION NOT NULL,
        CONSTRAINT [PK_FehrestParvandehFiles] PRIMARY KEY CLUSTERED ([ID]),
        CONSTRAINT [FK_FehrestParvandehFiles_FehrestParvandeh]
            FOREIGN KEY ([FehrestParvandehID]) REFERENCES [bz].[FehrestParvandeh]([ID]),
        CONSTRAINT [CK_FehrestParvandehFiles_Safheh] CHECK ([Safheh] > 0),
        CONSTRAINT [CK_FehrestParvandehFiles_SortOrder] CHECK ([SortOrder] > 0)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_FehrestParvandeh_Person_Pages' AND object_id=OBJECT_ID(N'[bz].[FehrestParvandeh]'))
    CREATE INDEX [IX_FehrestParvandeh_Person_Pages] ON [bz].[FehrestParvandeh]([PersonId],[AzSafheh],[TaSafheh]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_FehrestParvandeh_SystemReference' AND object_id=OBJECT_ID(N'[bz].[FehrestParvandeh]'))
    CREATE UNIQUE INDEX [UX_FehrestParvandeh_SystemReference]
    ON [bz].[FehrestParvandeh]([PersonId],[ReferenceType],[ReferenceId],[NoeSanad])
    WHERE [IsDelete]=0 AND [ReferenceType] IS NOT NULL AND [ReferenceId] IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_FehrestParvandehFiles_FileName' AND object_id=OBJECT_ID(N'[bz].[FehrestParvandehFiles]'))
    CREATE UNIQUE INDEX [UX_FehrestParvandehFiles_FileName] ON [bz].[FehrestParvandehFiles]([FileName]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_FehrestParvandehFiles_Person_Page' AND object_id=OBJECT_ID(N'[bz].[FehrestParvandehFiles]'))
    CREATE UNIQUE INDEX [UX_FehrestParvandehFiles_Person_Page]
    ON [bz].[FehrestParvandehFiles]([PersonId],[Safheh]);
GO

/* نوع جدولی برای ثبت همزمان چند صفحه/فایل */
IF TYPE_ID(N'[bz].[FehrestParvandehFileInput]') IS NULL
BEGIN
    EXEC(N'
      CREATE TYPE [bz].[FehrestParvandehFileInput] AS TABLE
      (
        [FileOrder]        INT NOT NULL,
        [FileName]         NVARCHAR(150) NOT NULL,
        [OriginalFileName] NVARCHAR(260) NULL,
        [ContentType]      NVARCHAR(100) NOT NULL,
        [FileData]         VARBINARY(MAX) NOT NULL
      );
    ');
END;
GO

/* دیتابیس فایل */
IF DB_ID(N'DBBazresiFiles') IS NULL
    THROW 51300, N'دیتابیس DBBazresiFiles پیدا نشد.', 1;
GO
USE [DBBazresiFiles];
GO
IF SCHEMA_ID(N'filedb') IS NULL EXEC(N'CREATE SCHEMA [filedb] AUTHORIZATION [dbo]');
GO

IF OBJECT_ID(N'[filedb].[FehrestParvandehFiles]', N'U') IS NOT NULL
   AND (COL_LENGTH(N'filedb.FehrestParvandehFiles', N'FileData') IS NULL
        OR COL_LENGTH(N'filedb.FehrestParvandehFiles', N'PersonId') IS NULL)
    THROW 51392, N'جدول قدیمی filedb.FehrestParvandehFiles هنوز وجود دارد. ابتدا آن را حذف کنید و سپس اسکریپت را دوباره اجرا کنید.', 1;
GO

IF OBJECT_ID(N'[filedb].[FehrestParvandehFiles]', N'U') IS NULL
BEGIN
    CREATE TABLE [filedb].[FehrestParvandehFiles]
    (
        [ID]                    BIGINT IDENTITY(1,1) NOT NULL,
        [FehrestParvandehID]    BIGINT NOT NULL,
        [PersonId]              BIGINT NOT NULL,
        [Safheh]                INT NOT NULL,
        [FileName]              NVARCHAR(150) NOT NULL,
        [OriginalFileName]      NVARCHAR(260) NULL,
        [ContentType]           NVARCHAR(100) NOT NULL,
        [FileSize]              BIGINT NOT NULL,
        [FileData]              VARBINARY(MAX) NOT NULL,
        [IsDelete]              BIT NOT NULL CONSTRAINT [DF_FileDB_Fehrest_IsDelete] DEFAULT(0),
        [CreateUserId]          NVARCHAR(450) NOT NULL,
        [CreateDateTime]        DATETIME2(0) NOT NULL CONSTRAINT [DF_FileDB_Fehrest_CreateDateTime] DEFAULT(SYSDATETIME()),
        [DeleteUserId]          NVARCHAR(450) NULL,
        [DeleteDateTime]        DATETIME2(0) NULL,
        CONSTRAINT [PK_FileDB_FehrestParvandehFiles] PRIMARY KEY CLUSTERED ([ID]),
        CONSTRAINT [CK_FileDB_Fehrest_Safheh] CHECK ([Safheh] > 0),
        CONSTRAINT [CK_FileDB_Fehrest_FileSize] CHECK ([FileSize] > 0)
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_FileDB_Fehrest_FileName' AND object_id=OBJECT_ID(N'[filedb].[FehrestParvandehFiles]'))
    CREATE UNIQUE INDEX [UX_FileDB_Fehrest_FileName] ON [filedb].[FehrestParvandehFiles]([FileName]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_FileDB_Fehrest_Person_Page' AND object_id=OBJECT_ID(N'[filedb].[FehrestParvandehFiles]'))
    CREATE INDEX [IX_FileDB_Fehrest_Person_Page] ON [filedb].[FehrestParvandehFiles]([PersonId],[Safheh],[IsDelete]);
GO

USE [DBBazresi];
GO

/* ============================================================================
   فهرست پرونده یک شخص
   Recordset 1: شخص + آخرین صفحه
   Recordset 2: اسناد
   Recordset 3: صفحات/فایل‌ها
   ============================================================================ */
CREATE OR ALTER PROCEDURE [bz].[SP_FehrestParvandeh_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF @PersonId IS NULL OR @PersonId < 1 THROW 51301,N'شناسه شخص معتبر نیست.',1;
    IF NOT EXISTS (SELECT 1 FROM [bz].[Person] WHERE [PersonId]=@PersonId AND ISNULL([IsDelete],0)=0)
        THROW 51302,N'شخص موردنظر پیدا نشد.',1;

    SELECT TOP(1)
        P.[PersonId], P.[CodeMelli], P.[FirstName], P.[LastName], P.[FatherName], P.[ImagePath],
        LTRIM(RTRIM(CONCAT(P.[FirstName],N' ',P.[LastName]))) AS [FullName],
        ISNULL((SELECT MAX(F.[TaSafheh]) FROM [bz].[FehrestParvandeh] F WHERE F.[PersonId]=P.[PersonId]),0) AS [LastPage],
        (SELECT COUNT(1) FROM [bz].[FehrestParvandeh] F WHERE F.[PersonId]=P.[PersonId] AND F.[IsDelete]=0) AS [DocumentCount]
    FROM [bz].[Person] P
    WHERE P.[PersonId]=@PersonId AND ISNULL(P.[IsDelete],0)=0;

    SELECT
        F.[ID],F.[PersonId],F.[AzSafheh],F.[TaSafheh],F.[TedadSafheh],F.[TarikhNameh],F.[ShomareNameh],
        F.[OnvanMatlab],F.[Kholaseh],F.[NoeSanad],F.[NoeSanadTitle],F.[MarjaNameh],
        F.[ReferenceType],F.[ReferenceId],F.[IsSystemGenerated],F.[CreateUserId],F.[CreateDateTime],
        (SELECT COUNT(1) FROM [bz].[FehrestParvandehFiles] FF WHERE FF.[FehrestParvandehID]=F.[ID] AND FF.[IsDelete]=0) AS [FileCount]
    FROM [bz].[FehrestParvandeh] F
    WHERE F.[PersonId]=@PersonId AND F.[IsDelete]=0
    ORDER BY F.[AzSafheh] ASC,F.[ID] ASC;

    SELECT
        FF.[ID],FF.[FehrestParvandehID],FF.[PersonId],FF.[Safheh],FF.[FileName],FF.[OriginalFileName],FF.[SortOrder],FF.[CreateDateTime],
        FD.[ContentType],FD.[FileSize]
    FROM [bz].[FehrestParvandehFiles] FF
    LEFT JOIN [DBBazresiFiles].[filedb].[FehrestParvandehFiles] FD
      ON FD.[FileName]=FF.[FileName] AND FD.[IsDelete]=0
    WHERE FF.[PersonId]=@PersonId AND FF.[IsDelete]=0
    ORDER BY FF.[Safheh] ASC,FF.[ID] ASC;
END;
GO

/* ============================================================================
   ثبت دستی یک ردیف فهرست با یک یا چند فایل؛ شماره صفحه خودکار است.
   ============================================================================ */
CREATE OR ALTER PROCEDURE [bz].[SP_FehrestParvandeh_Create]
    @ActorUserId      NVARCHAR(450),
    @PersonId         BIGINT,
    @TarikhNameh      NVARCHAR(10)=NULL,
    @ShomareNameh     NVARCHAR(100)=NULL,
    @OnvanMatlab      NVARCHAR(500),
    @Kholaseh         NVARCHAR(2000)=NULL,
    @NoeSanad         TINYINT=1,
    @NoeSanadTitle    NVARCHAR(150)=NULL,
    @MarjaNameh       NVARCHAR(250)=NULL,
    @Files            [bz].[FehrestParvandehFileInput] READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @OnvanMatlab=NULLIF(LTRIM(RTRIM(@OnvanMatlab)),N'');
    SET @TarikhNameh=NULLIF(LTRIM(RTRIM(@TarikhNameh)),N'');
    SET @ShomareNameh=NULLIF(LTRIM(RTRIM(@ShomareNameh)),N'');
    SET @Kholaseh=NULLIF(LTRIM(RTRIM(@Kholaseh)),N'');
    SET @NoeSanadTitle=NULLIF(LTRIM(RTRIM(@NoeSanadTitle)),N'');
    SET @MarjaNameh=NULLIF(LTRIM(RTRIM(@MarjaNameh)),N'');

    IF NULLIF(LTRIM(RTRIM(@ActorUserId)),N'') IS NULL THROW 51303,N'کاربر ثبت‌کننده معتبر نیست.',1;
    IF @PersonId IS NULL OR @PersonId<1 THROW 51301,N'شناسه شخص معتبر نیست.',1;
    IF @OnvanMatlab IS NULL THROW 51304,N'عنوان مطلب را وارد کنید.',1;
    IF @TarikhNameh IS NOT NULL AND @TarikhNameh NOT LIKE N'[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]'
        THROW 51305,N'تاریخ نامه باید به شکل 1405/01/01 باشد.',1;
    IF NOT EXISTS (SELECT 1 FROM [bz].[Person] WHERE [PersonId]=@PersonId AND ISNULL([IsDelete],0)=0)
        THROW 51302,N'شخص موردنظر پیدا نشد.',1;

    DECLARE @Count INT=(SELECT COUNT(1) FROM @Files);
    IF @Count<1 THROW 51306,N'حداقل یک فایل برای سند انتخاب کنید.',1;
    IF @Count>30 THROW 51307,N'در هر بار حداکثر ۳۰ صفحه قابل ثبت است.',1;
    IF EXISTS(SELECT 1 FROM @Files WHERE [FileOrder]<1 OR NULLIF(LTRIM(RTRIM([FileName])),N'') IS NULL OR DATALENGTH([FileData])<1)
        THROW 51308,N'اطلاعات یکی از فایل‌ها معتبر نیست.',1;
    IF EXISTS(SELECT 1 FROM @Files WHERE DATALENGTH([FileData])>20971520)
        THROW 51309,N'حجم هر فایل باید حداکثر ۲۰ مگابایت باشد.',1;
    IF EXISTS(SELECT [FileName] FROM @Files GROUP BY [FileName] HAVING COUNT(1)>1)
        THROW 51310,N'نام فایل تکراری در پیوست‌ها وجود دارد.',1;

    DECLARE @AzSafheh INT,@TaSafheh INT,@ID BIGINT,@LockResult INT;
    DECLARE @LockResource NVARCHAR(255)=CONCAT(N'FehrestParvandeh:Person:',CONVERT(NVARCHAR(30),@PersonId));
    BEGIN TRY
        BEGIN TRANSACTION;

        EXEC @LockResult=sys.sp_getapplock
          @Resource=@LockResource,
          @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=15000;
        IF @LockResult<0 THROW 51311,N'رزرو شماره صفحه پرونده انجام نشد؛ دوباره تلاش کنید.',1;

        IF EXISTS(SELECT 1 FROM [bz].[FehrestParvandehFiles] M WITH(UPDLOCK,HOLDLOCK) JOIN @Files I ON I.[FileName]=M.[FileName])
           OR EXISTS(SELECT 1 FROM [DBBazresiFiles].[filedb].[FehrestParvandehFiles] D JOIN @Files I ON I.[FileName]=D.[FileName])
            THROW 51312,N'یکی از نام‌های فایل قبلاً استفاده شده است.',1;

        SELECT @AzSafheh=ISNULL(MAX([TaSafheh]),0)+1
        FROM [bz].[FehrestParvandeh] WITH(UPDLOCK,HOLDLOCK)
        WHERE [PersonId]=@PersonId; -- حذف‌شده‌ها هم لحاظ می‌شوند تا صفحه دوباره استفاده نشود.
        SET @TaSafheh=@AzSafheh+@Count-1;

        INSERT [bz].[FehrestParvandeh]
          ([PersonId],[AzSafheh],[TaSafheh],[TarikhNameh],[ShomareNameh],[OnvanMatlab],[Kholaseh],[NoeSanad],[NoeSanadTitle],[MarjaNameh],[IsSystemGenerated],[CreateUserId])
        VALUES
          (@PersonId,@AzSafheh,@TaSafheh,@TarikhNameh,@ShomareNameh,@OnvanMatlab,@Kholaseh,@NoeSanad,@NoeSanadTitle,@MarjaNameh,0,@ActorUserId);
        SET @ID=SCOPE_IDENTITY();

        ;WITH Ordered AS
        (
          SELECT *,ROW_NUMBER() OVER(ORDER BY [FileOrder],[FileName]) AS RN FROM @Files
        )
        INSERT [bz].[FehrestParvandehFiles]
          ([FehrestParvandehID],[PersonId],[Safheh],[FileName],[OriginalFileName],[SortOrder],[CreateUserId])
        SELECT @ID,@PersonId,@AzSafheh+CONVERT(INT,RN)-1,[FileName],NULLIF(LTRIM(RTRIM([OriginalFileName])),N''),CONVERT(INT,RN),@ActorUserId
        FROM Ordered;

        ;WITH Ordered AS
        (
          SELECT *,ROW_NUMBER() OVER(ORDER BY [FileOrder],[FileName]) AS RN FROM @Files
        )
        INSERT [DBBazresiFiles].[filedb].[FehrestParvandehFiles]
          ([FehrestParvandehID],[PersonId],[Safheh],[FileName],[OriginalFileName],[ContentType],[FileSize],[FileData],[CreateUserId])
        SELECT @ID,@PersonId,@AzSafheh+CONVERT(INT,RN)-1,[FileName],NULLIF(LTRIM(RTRIM([OriginalFileName])),N''),[ContentType],DATALENGTH([FileData]),[FileData],@ActorUserId
        FROM Ordered;

        COMMIT;
        SELECT @ID AS [ID],@PersonId AS [PersonId],@AzSafheh AS [AzSafheh],@TaSafheh AS [TaSafheh],@Count AS [TedadSafheh];
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK;
        THROW;
    END CATCH;
END;
GO

/* ثبت سند یک‌صفحه‌ای سیستمی؛ برای پیشنهاد/حکم انتصاب و سایر ماژول‌ها */
CREATE OR ALTER PROCEDURE [bz].[SP_FehrestParvandeh_AddSystemFile]
    @PersonId         BIGINT,
    @TarikhNameh      NVARCHAR(10)=NULL,
    @ShomareNameh     NVARCHAR(100)=NULL,
    @OnvanMatlab      NVARCHAR(500),
    @Kholaseh         NVARCHAR(2000)=NULL,
    @NoeSanad         TINYINT,
    @NoeSanadTitle    NVARCHAR(150),
    @MarjaNameh       NVARCHAR(250)=NULL,
    @ReferenceType    NVARCHAR(50),
    @ReferenceId      BIGINT,
    @OriginalFileName NVARCHAR(260)=NULL,
    @ContentType      NVARCHAR(100),
    @FileData         VARBINARY(MAX),
    @CreateUserId     NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @PersonId<1 OR @ReferenceId IS NULL OR @ReferenceId<1 OR NULLIF(@ReferenceType,N'') IS NULL RETURN;
    IF @FileData IS NULL OR DATALENGTH(@FileData)<1 RETURN;
    SET @CreateUserId=ISNULL(NULLIF(LTRIM(RTRIM(@CreateUserId)),N''),N'system');

    /* idempotent: یک سند سیستمی دوبار وارد پرونده نمی‌شود */
    IF EXISTS(SELECT 1 FROM [bz].[FehrestParvandeh] WHERE [PersonId]=@PersonId AND [ReferenceType]=@ReferenceType AND [ReferenceId]=@ReferenceId AND [NoeSanad]=@NoeSanad AND [IsDelete]=0)
        RETURN;

    DECLARE @Ext NVARCHAR(12)=
      CASE LOWER(ISNULL(@ContentType,N''))
        WHEN N'image/png' THEN N'.png'
        WHEN N'image/jpeg' THEN N'.jpg'
        WHEN N'image/webp' THEN N'.webp'
        WHEN N'application/pdf' THEN N'.pdf'
        ELSE N'.bin' END;
    DECLARE @FileName NVARCHAR(150)=CONCAT(CONVERT(NVARCHAR(36),NEWID()),@Ext);
    DECLARE @AzSafheh INT,@ID BIGINT,@LockResult INT,@StartedTran BIT=0,@OuterTranCount INT=@@TRANCOUNT;
    DECLARE @LockResource NVARCHAR(255)=CONCAT(N'FehrestParvandeh:Person:',CONVERT(NVARCHAR(30),@PersonId));

    BEGIN TRY
      IF @OuterTranCount=0 BEGIN TRANSACTION ELSE SAVE TRANSACTION FehrestSystemSave;
      IF @OuterTranCount=0 SET @StartedTran=1;

      EXEC @LockResult=sys.sp_getapplock
        @Resource=@LockResource,
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=15000;
      IF @LockResult<0 THROW 51311,N'رزرو شماره صفحه پرونده انجام نشد.',1;

      /* دوباره داخل قفل بررسی می‌شود */
      IF NOT EXISTS(SELECT 1 FROM [bz].[FehrestParvandeh] WITH(UPDLOCK,HOLDLOCK) WHERE [PersonId]=@PersonId AND [ReferenceType]=@ReferenceType AND [ReferenceId]=@ReferenceId AND [NoeSanad]=@NoeSanad AND [IsDelete]=0)
      BEGIN
        SELECT @AzSafheh=ISNULL(MAX([TaSafheh]),0)+1 FROM [bz].[FehrestParvandeh] WITH(UPDLOCK,HOLDLOCK) WHERE [PersonId]=@PersonId;
        INSERT [bz].[FehrestParvandeh]
          ([PersonId],[AzSafheh],[TaSafheh],[TarikhNameh],[ShomareNameh],[OnvanMatlab],[Kholaseh],[NoeSanad],[NoeSanadTitle],[MarjaNameh],[ReferenceType],[ReferenceId],[IsSystemGenerated],[CreateUserId])
        VALUES
          (@PersonId,@AzSafheh,@AzSafheh,NULLIF(@TarikhNameh,N''),NULLIF(@ShomareNameh,N''),@OnvanMatlab,NULLIF(@Kholaseh,N''),@NoeSanad,@NoeSanadTitle,NULLIF(@MarjaNameh,N''),@ReferenceType,@ReferenceId,1,@CreateUserId);
        SET @ID=SCOPE_IDENTITY();

        INSERT [bz].[FehrestParvandehFiles]([FehrestParvandehID],[PersonId],[Safheh],[FileName],[OriginalFileName],[SortOrder],[CreateUserId])
        VALUES(@ID,@PersonId,@AzSafheh,@FileName,@OriginalFileName,1,@CreateUserId);
        INSERT [DBBazresiFiles].[filedb].[FehrestParvandehFiles]([FehrestParvandehID],[PersonId],[Safheh],[FileName],[OriginalFileName],[ContentType],[FileSize],[FileData],[CreateUserId])
        VALUES(@ID,@PersonId,@AzSafheh,@FileName,@OriginalFileName,@ContentType,DATALENGTH(@FileData),@FileData,@CreateUserId);
      END;

      IF @StartedTran=1 COMMIT;
    END TRY
    BEGIN CATCH
      IF XACT_STATE()=-1 AND @@TRANCOUNT>0 ROLLBACK;
      ELSE IF XACT_STATE()=1 AND @@TRANCOUNT>0
      BEGIN
        IF @StartedTran=1 ROLLBACK;
        ELSE ROLLBACK TRANSACTION FehrestSystemSave;
      END;
      THROW;
    END CATCH;
END;
GO

/* دریافت فایل فقط از DBBazresiFiles؛ جدول اصلی صرفاً FileName را نگه می‌دارد. */
CREATE OR ALTER PROCEDURE [bz].[SP_FehrestParvandeh_File_Get]
    @FileName NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP(1)
      M.[ID],M.[FehrestParvandehID],M.[PersonId],M.[Safheh],M.[FileName],
      D.[OriginalFileName],D.[ContentType],D.[FileSize],D.[FileData]
    FROM [bz].[FehrestParvandehFiles] M
    INNER JOIN [bz].[FehrestParvandeh] H ON H.[ID]=M.[FehrestParvandehID] AND H.[IsDelete]=0
    INNER JOIN [DBBazresiFiles].[filedb].[FehrestParvandehFiles] D ON D.[FileName]=M.[FileName] AND D.[IsDelete]=0
    WHERE M.[FileName]=@FileName AND M.[IsDelete]=0;
END;
GO

/* حذف منطقی؛ صفحات آزاد/شماره‌گذاری مجدد نمی‌شوند. UI فعلی این عملیات را نمایش نمی‌دهد. */
CREATE OR ALTER PROCEDURE [bz].[SP_FehrestParvandeh_SoftDelete]
    @ID BIGINT,
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
      BEGIN TRANSACTION;
      UPDATE [bz].[FehrestParvandeh]
        SET [IsDelete]=1,[DeleteUserId]=@ActorUserId,[DeleteDateTime]=SYSDATETIME()
      WHERE [ID]=@ID AND [IsDelete]=0;
      UPDATE [bz].[FehrestParvandehFiles]
        SET [IsDelete]=1,[DeleteUserId]=@ActorUserId,[DeleteDateTime]=SYSDATETIME()
      WHERE [FehrestParvandehID]=@ID AND [IsDelete]=0;
      UPDATE D SET D.[IsDelete]=1,D.[DeleteUserId]=@ActorUserId,D.[DeleteDateTime]=SYSDATETIME()
      FROM [DBBazresiFiles].[filedb].[FehrestParvandehFiles] D
      INNER JOIN [bz].[FehrestParvandehFiles] M ON M.[FileName]=D.[FileName]
      WHERE M.[FehrestParvandehID]=@ID AND D.[IsDelete]=0;
      COMMIT;
    END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH;
END;
GO

/* ============================================================================
   اتصال خودکار اسناد انتصابات به پرونده شخص
   FileKind=1 پیشنهاد انتصاب، FileKind=2 حکم انتصاب
   این Trigger داخل همان Transaction انتصابات اجرا می‌شود.
   ============================================================================ */
USE [DBBazresiFiles];
GO
IF OBJECT_ID(N'[filedb].[AppointmentWorkflowFiles]',N'U') IS NOT NULL
BEGIN
  EXEC(N'
  CREATE OR ALTER TRIGGER [filedb].[TR_AppointmentWorkflowFiles_AddToPersonCase]
  ON [filedb].[AppointmentWorkflowFiles]
  AFTER INSERT
  AS
  BEGIN
    SET NOCOUNT ON;
    DECLARE
      @PersonId BIGINT,@EntesabId BIGINT,@FileKind INT,@OriginalFileName NVARCHAR(260),
      @ContentType NVARCHAR(100),@FileData VARBINARY(MAX),@CreateUserId NVARCHAR(450),
      @Code NVARCHAR(50),@FullName NVARCHAR(250),@PostOnvan NVARCHAR(500),@TarikhEblagh NVARCHAR(20),
      @TarikhDoc NVARCHAR(10),@OnvanDoc NVARCHAR(500),@KholasehDoc NVARCHAR(2000),
      @NoeSanadDoc TINYINT,@NoeSanadTitleDoc NVARCHAR(150);

    DECLARE C CURSOR LOCAL FAST_FORWARD FOR
      SELECT I.[PersonId],I.[EntesabId],I.[FileKind],I.[FileName],I.[ContentType],I.[FileData],CONVERT(NVARCHAR(450),I.[CreateUserId])
      FROM inserted I
      WHERE I.[FileKind] IN (1,2) AND ISNULL(I.[IsDelete],0)=0;
    OPEN C;
    FETCH NEXT FROM C INTO @PersonId,@EntesabId,@FileKind,@OriginalFileName,@ContentType,@FileData,@CreateUserId;
    WHILE @@FETCH_STATUS=0
    BEGIN
      SELECT @Code=E.[Code],@FullName=E.[FullName],@PostOnvan=E.[PostOnvan],@TarikhEblagh=E.[TarikhEblagh]
      FROM [DBBazresi].[bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId;

      SET @TarikhDoc=CASE WHEN @FileKind=2 AND NULLIF(@TarikhEblagh,N'''') IS NOT NULL THEN LEFT(@TarikhEblagh,10) ELSE [DBBazresi].[dbo].[MiladiToShamsi](CONVERT(DATE,GETDATE())) END;
      SET @OnvanDoc=CASE WHEN @FileKind=1 THEN CONCAT(N''پیشنهاد انتصاب - '',ISNULL(@PostOnvan,N'''')) ELSE CONCAT(N''حکم انتصاب مسئولیت - '',ISNULL(@PostOnvan,N'''')) END;
      SET @KholasehDoc=CONCAT(ISNULL(@FullName,N''''),CASE WHEN NULLIF(@PostOnvan,N'''') IS NULL THEN N'''' ELSE CONCAT(N'' / '',@PostOnvan) END);
      SET @NoeSanadDoc=CASE WHEN @FileKind=1 THEN 10 ELSE 11 END;
      SET @NoeSanadTitleDoc=CASE WHEN @FileKind=1 THEN N''پیشنهاد انتصاب'' ELSE N''حکم انتصاب مسئولیت'' END;
      SET @CreateUserId=ISNULL(NULLIF(@CreateUserId,N''''),N''system'');

      EXEC [DBBazresi].[bz].[SP_FehrestParvandeh_AddSystemFile]
        @PersonId=@PersonId,@TarikhNameh=@TarikhDoc,@ShomareNameh=@Code,@OnvanMatlab=@OnvanDoc,@Kholaseh=@KholasehDoc,
        @NoeSanad=@NoeSanadDoc,@NoeSanadTitle=@NoeSanadTitleDoc,@MarjaNameh=N''سامانه انتصابات'',
        @ReferenceType=N''Appointment'',@ReferenceId=@EntesabId,@OriginalFileName=@OriginalFileName,
        @ContentType=@ContentType,@FileData=@FileData,@CreateUserId=@CreateUserId;

      FETCH NEXT FROM C INTO @PersonId,@EntesabId,@FileKind,@OriginalFileName,@ContentType,@FileData,@CreateUserId;
    END;
    CLOSE C; DEALLOCATE C;
  END;');
END;
GO

/* ============================================================================
   Backfill اسناد قدیمی انتصابات (فقط مواردی که هنوز وارد پرونده نشده‌اند)
   ترتیب بر اساس زمان ایجاد فایل است.
   ============================================================================ */
DECLARE
  @PersonId BIGINT,@EntesabId BIGINT,@FileKind INT,@OriginalFileName NVARCHAR(260),
  @ContentType NVARCHAR(100),@FileData VARBINARY(MAX),@CreateUserId NVARCHAR(450),
  @Code NVARCHAR(50),@FullName NVARCHAR(250),@PostOnvan NVARCHAR(500),@TarikhEblagh NVARCHAR(20),
  @TarikhDoc NVARCHAR(10),@OnvanDoc NVARCHAR(500),@KholasehDoc NVARCHAR(2000),@NoeSanadDoc TINYINT,@NoeSanadTitleDoc NVARCHAR(150),@FileCreated DATETIME2(0);

IF OBJECT_ID(N'[filedb].[AppointmentWorkflowFiles]',N'U') IS NOT NULL
BEGIN
  DECLARE Backfill CURSOR LOCAL FAST_FORWARD FOR
    SELECT A.[PersonId],A.[EntesabId],A.[FileKind],A.[FileName],A.[ContentType],A.[FileData],CONVERT(NVARCHAR(450),A.[CreateUserId]),A.[CreateDateTime]
    FROM [filedb].[AppointmentWorkflowFiles] A
    WHERE A.[FileKind] IN(1,2) AND ISNULL(A.[IsDelete],0)=0
      AND NOT EXISTS
      (
        SELECT 1 FROM [DBBazresi].[bz].[FehrestParvandeh] F
        WHERE F.[PersonId]=A.[PersonId] AND F.[ReferenceType]=N'Appointment' AND F.[ReferenceId]=A.[EntesabId]
          AND F.[NoeSanad]=CASE WHEN A.[FileKind]=1 THEN 10 ELSE 11 END AND F.[IsDelete]=0
      )
    ORDER BY A.[CreateDateTime],A.[FileId];
  OPEN Backfill;
  FETCH NEXT FROM Backfill INTO @PersonId,@EntesabId,@FileKind,@OriginalFileName,@ContentType,@FileData,@CreateUserId,@FileCreated;
  WHILE @@FETCH_STATUS=0
  BEGIN
    SELECT @Code=E.[Code],@FullName=E.[FullName],@PostOnvan=E.[PostOnvan],@TarikhEblagh=E.[TarikhEblagh]
    FROM [DBBazresi].[bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId;
    SET @TarikhDoc=CASE WHEN @FileKind=2 AND NULLIF(@TarikhEblagh,N'') IS NOT NULL THEN LEFT(@TarikhEblagh,10) ELSE [DBBazresi].[dbo].[MiladiToShamsi](CONVERT(DATE,ISNULL(@FileCreated,SYSDATETIME()))) END;
    SET @OnvanDoc=CASE WHEN @FileKind=1 THEN CONCAT(N'پیشنهاد انتصاب - ',ISNULL(@PostOnvan,N'')) ELSE CONCAT(N'حکم انتصاب مسئولیت - ',ISNULL(@PostOnvan,N'')) END;
    SET @KholasehDoc=CONCAT(ISNULL(@FullName,N''),CASE WHEN NULLIF(@PostOnvan,N'') IS NULL THEN N'' ELSE CONCAT(N' / ',@PostOnvan) END);
    SET @NoeSanadDoc=CASE WHEN @FileKind=1 THEN 10 ELSE 11 END;
    SET @NoeSanadTitleDoc=CASE WHEN @FileKind=1 THEN N'پیشنهاد انتصاب' ELSE N'حکم انتصاب مسئولیت' END;
    SET @CreateUserId=ISNULL(NULLIF(@CreateUserId,N''),N'system');
    EXEC [DBBazresi].[bz].[SP_FehrestParvandeh_AddSystemFile]
      @PersonId=@PersonId,@TarikhNameh=@TarikhDoc,@ShomareNameh=@Code,@OnvanMatlab=@OnvanDoc,@Kholaseh=@KholasehDoc,
      @NoeSanad=@NoeSanadDoc,@NoeSanadTitle=@NoeSanadTitleDoc,@MarjaNameh=N'سامانه انتصابات',
      @ReferenceType=N'Appointment',@ReferenceId=@EntesabId,@OriginalFileName=@OriginalFileName,
      @ContentType=@ContentType,@FileData=@FileData,@CreateUserId=@CreateUserId;
    FETCH NEXT FROM Backfill INTO @PersonId,@EntesabId,@FileKind,@OriginalFileName,@ContentType,@FileData,@CreateUserId,@FileCreated;
  END;
  CLOSE Backfill; DEALLOCATE Backfill;
END;
GO

USE [DBBazresi];
GO
