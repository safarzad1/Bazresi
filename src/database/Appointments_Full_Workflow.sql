USE [DBBazresi];
GO

/*
  گردش کامل انتصابات - نسخه جدید
  پیش‌نیاز: اجرای AppointmentAccess_Settings.sql
  وضعیت‌ها: 2 در انتظار بررسی، 3 عدم تأیید، 10 ابلاغ‌شده
  کد تصمیم: 3 عدم تأیید، 4 تأیید
  فایل‌ها در DBBazresiFiles و اطلاعات نمایشی سند در Entesabat_Madarek نگهداری می‌شود.
  برای ارجاع چندمرحله‌ای، پس از این فایل Appointments_Workflow_Referrals.sql نیز اجرا شود.
*/

IF COL_LENGTH(N'bz.Entesabat', N'WorkflowDestinationPostId') IS NULL
    ALTER TABLE [bz].[Entesabat] ADD [WorkflowDestinationPostId] BIGINT NULL;
GO
IF COL_LENGTH(N'bz.Entesabat', N'DecisionNote') IS NULL
    ALTER TABLE [bz].[Entesabat] ADD [DecisionNote] NVARCHAR(1000) NULL;
GO
IF COL_LENGTH(N'bz.Entesabat', N'DecisionUserId') IS NULL
    ALTER TABLE [bz].[Entesabat] ADD [DecisionUserId] NVARCHAR(450) NULL;
GO
IF COL_LENGTH(N'bz.Entesabat', N'DecisionAt') IS NULL
    ALTER TABLE [bz].[Entesabat] ADD [DecisionAt] DATETIME2(0) NULL;
GO

IF OBJECT_ID(N'bz.AppointmentRequestReasons', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AppointmentRequestReasons]
    (
        [ReasonId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AppointmentRequestReasons] PRIMARY KEY,
        [EntesabId] BIGINT NOT NULL,
        [ReasonText] NVARCHAR(1000) NOT NULL,
        [SortOrder] TINYINT NOT NULL,
        [CreateUserId] NVARCHAR(450) NOT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AppointmentRequestReasons_CreateDateTime] DEFAULT (SYSDATETIME())
    );
    CREATE INDEX [IX_AppointmentRequestReasons_Entesab] ON [bz].[AppointmentRequestReasons]([EntesabId], [SortOrder]);
END;
GO

IF OBJECT_ID(N'bz.AppointmentInterviewForms', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AppointmentInterviewForms]
    (
        [InterviewId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AppointmentInterviewForms] PRIMARY KEY,
        [EntesabId] BIGINT NOT NULL,
        [InterviewType] TINYINT NOT NULL,
        [InterviewTypeTitle] NVARCHAR(100) NOT NULL,
        [FormJson] NVARCHAR(MAX) NOT NULL,
        [CreateUserId] NVARCHAR(450) NOT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AppointmentInterviewForms_CreateDateTime] DEFAULT (SYSDATETIME()),
        [EditUserId] NVARCHAR(450) NULL,
        [EditDateTime] DATETIME2(0) NULL,
        CONSTRAINT [UQ_AppointmentInterviewForms_Request_Type] UNIQUE ([EntesabId], [InterviewType]),
        CONSTRAINT [CK_AppointmentInterviewForms_Type] CHECK ([InterviewType] IN (1,2))
    );
END;
GO

IF OBJECT_ID(N'bz.AppointmentWorkflowHistory', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AppointmentWorkflowHistory]
    (
        [HistoryId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AppointmentWorkflowHistory] PRIMARY KEY,
        [EntesabId] BIGINT NOT NULL,
        [ActionCode] TINYINT NOT NULL,
        [ActionTitle] NVARCHAR(150) NOT NULL,
        [FromState] INT NULL,
        [ToState] INT NOT NULL,
        [Note] NVARCHAR(1000) NULL,
        [ActorUserId] NVARCHAR(450) NOT NULL,
        [ActorPostId] BIGINT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AppointmentWorkflowHistory_CreateDateTime] DEFAULT (SYSDATETIME())
    );
    CREATE INDEX [IX_AppointmentWorkflowHistory_Entesab] ON [bz].[AppointmentWorkflowHistory]([EntesabId], [HistoryId]);
END;
GO

IF DB_ID(N'DBBazresiFiles') IS NULL
    THROW 51200, N'دیتابیس DBBazresiFiles پیدا نشد.', 1;
GO

USE [DBBazresiFiles];
GO
IF SCHEMA_ID(N'filedb') IS NULL EXEC(N'CREATE SCHEMA [filedb] AUTHORIZATION [dbo]');
GO
IF OBJECT_ID(N'filedb.AppointmentWorkflowFiles', N'U') IS NULL
BEGIN
    CREATE TABLE [filedb].[AppointmentWorkflowFiles]
    (
        [FileId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AppointmentWorkflowFiles] PRIMARY KEY,
        [EntesabId] BIGINT NOT NULL,
        [PersonId] BIGINT NOT NULL,
        [FileKind] TINYINT NOT NULL,
        [FileKindTitle] NVARCHAR(100) NOT NULL,
        [FileName] NVARCHAR(150) NOT NULL,
        [ContentType] NVARCHAR(100) NOT NULL,
        [FileSize] BIGINT NOT NULL,
        [FileData] VARBINARY(MAX) NOT NULL,
        [IsDelete] BIT NOT NULL CONSTRAINT [DF_AppointmentWorkflowFiles_IsDelete] DEFAULT (0),
        [CreateUserId] NVARCHAR(450) NOT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AppointmentWorkflowFiles_CreateDateTime] DEFAULT (SYSDATETIME()),
        CONSTRAINT [CK_AppointmentWorkflowFiles_Kind] CHECK ([FileKind] IN (1,2,3))
    );
    CREATE UNIQUE INDEX [UX_AppointmentWorkflowFiles_Request_Kind]
        ON [filedb].[AppointmentWorkflowFiles]([EntesabId], [FileKind]) WHERE [IsDelete] = 0 AND [FileKind] IN (1,2);
END;
GO

USE [DBBazresi];
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Lookups]
    @ActorUserId NVARCHAR(450),
    @Search NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActorPostId BIGINT, @RequesterName NVARCHAR(150), @RequesterPostTitle NVARCHAR(250), @DestinationPostId BIGINT;
    SELECT TOP (1) @ActorPostId = TRY_CONVERT(BIGINT,U.[Semat]), @RequesterName = U.[FullName], @RequesterPostTitle = S.[OnvanSemat]
    FROM [dbo].[AspNetUsers] U LEFT JOIN [dbo].[Semats] S ON S.[ID] = TRY_CONVERT(BIGINT,U.[Semat])
    WHERE U.[Id] = @ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51201, N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.', 1;

    SELECT @DestinationPostId = NULLIF(S.[PID],0) FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId;
    SET @DestinationPostId = ISNULL(@DestinationPostId,@ActorPostId);

    SELECT TOP (20) P.[PersonId], P.[CodeMelli], P.[FirstName], P.[LastName],
           LTRIM(RTRIM(CONCAT(P.[FirstName],N' ',P.[LastName]))) AS [FullName], P.[FatherName], P.[TarikhTavalod],
           P.[ShomareShenasnameh], P.[Shoghl], P.[TelHamrah]
    FROM [bz].[Person] P
    WHERE ISNULL(P.[IsDelete],0)=0 AND
      (@Search IS NULL OR @Search=N'' OR P.[CodeMelli] LIKE N'%'+@Search+N'%' OR P.[FirstName] LIKE N'%'+@Search+N'%' OR P.[LastName] LIKE N'%'+@Search+N'%'
       OR LTRIM(RTRIM(CONCAT(P.[FirstName],N' ',P.[LastName]))) LIKE N'%'+@Search+N'%')
    ORDER BY P.[FirstName],P.[LastName];

    SELECT A.[TargetPostId] AS [PostId], S.[OnvanSemat] AS [PostOnvan], S.[Mahal]
    FROM [bz].[AppointmentPostAccess] A
    INNER JOIN [dbo].[Semats] S ON S.[ID]=A.[TargetPostId]
    WHERE A.[ActorPostId]=@ActorPostId AND A.[IsActive]=1
      AND NOT EXISTS (SELECT 1 FROM [bz].[Entesabat] E WHERE E.[PostId]=A.[TargetPostId] AND E.[RecordState]=10 AND E.[TaeedOrAdamTaeed]=4 AND ISNULL(E.[IsDelete],0)=0 AND ISNULL(E.[IsEblagh],0)=1)
      AND NOT EXISTS (SELECT 1 FROM [bz].[Entesabat] E WHERE E.[PostId]=A.[TargetPostId] AND E.[RecordState]=2 AND ISNULL(E.[IsDelete],0)=0)
    ORDER BY S.[OnvanSemat];

    SELECT @ActorPostId AS [RequesterPostId], @RequesterName AS [RequesterFullName], @RequesterPostTitle AS [RequesterPostTitle],
           @DestinationPostId AS [DestinationPostId], DS.[OnvanSemat] AS [DestinationPostTitle], DU.[FullName] AS [DestinationFullName]
    FROM [dbo].[Semats] DS
    OUTER APPLY (SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=@DestinationPostId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1) DU
    WHERE DS.[ID]=@DestinationPostId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Create]
    @ActorUserId NVARCHAR(450), @PersonId BIGINT, @PostId BIGINT,
    @ReasonsJson NVARCHAR(MAX), @InitialInterviewJson NVARCHAR(MAX),
    @ProposalFileName NVARCHAR(150), @ProposalContentType NVARCHAR(100), @ProposalFileData VARBINARY(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF ISJSON(@ReasonsJson)<>1 OR ISJSON(@InitialInterviewJson)<>1 THROW 51202,N'اطلاعات دلایل یا مصاحبه اولیه معتبر نیست.',1;
    IF (SELECT COUNT(1) FROM OPENJSON(@ReasonsJson) WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(1000),[value]))),N'') IS NOT NULL) NOT BETWEEN 1 AND 10
        THROW 51203,N'حداقل یک و حداکثر ده دلیل وارد کنید.',1;
    IF @ProposalFileData IS NULL OR @ProposalContentType<>N'image/png' OR DATALENGTH(@ProposalFileData)<100 OR DATALENGTH(@ProposalFileData)>12582912 OR SUBSTRING(@ProposalFileData,1,8)<>0x89504E470D0A1A0A
        THROW 51204,N'تصویر PNG پیشنهاد انتصاب معتبر نیست یا بیش از ۱۲ مگابایت حجم دارد.',1;

    DECLARE @ActorPostId BIGINT,@DestinationPostId BIGINT,@PersonCode NVARCHAR(10),@FirstName NVARCHAR(150),@LastName NVARCHAR(150),@FatherName NVARCHAR(150),@BirthDate NVARCHAR(10),@LastJob NVARCHAR(150),@PostTitle NVARCHAR(500),@Code NVARCHAR(50);
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51205,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;
    IF NOT EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=@PostId AND A.[IsActive]=1) THROW 51206,N'مجوز پیشنهاد انتصاب برای این پست را ندارید.',1;
    SELECT @DestinationPostId=ISNULL(NULLIF(S.[PID],0),@ActorPostId),@PostTitle=S.[OnvanSemat] FROM [dbo].[Semats] S WHERE S.[ID]=@PostId;
    SELECT @PersonCode=LEFT(P.[CodeMelli],10),@FirstName=P.[FirstName],@LastName=P.[LastName],@FatherName=P.[FatherName],@BirthDate=LEFT(P.[TarikhTavalod],10),@LastJob=P.[Shoghl] FROM [bz].[Person] P WHERE P.[PersonId]=@PersonId AND ISNULL(P.[IsDelete],0)=0;
    IF @PersonCode IS NULL OR @PostTitle IS NULL THROW 51207,N'شخص یا پست انتخاب‌شده پیدا نشد.',1;
    SET @Code=LEFT(REPLACE(CONVERT(NVARCHAR(36),NEWID()),N'-',N''),10);

    BEGIN TRY
      BEGIN TRANSACTION;
      IF EXISTS(SELECT 1 FROM [bz].[Entesabat] WITH(UPDLOCK,HOLDLOCK) WHERE [PostId]=@PostId AND [RecordState] IN(2,10) AND ISNULL([IsDelete],0)=0)
        THROW 51208,N'این پست دارای انتصاب جاری یا درخواست در حال بررسی است.',1;

      INSERT [bz].[Entesabat]([PersonId],[CodeMelli],[FirstName],[LastName],[FullName],[FatherName],[TarikhTavalod],[PostId],[PostOnvan],[LastShoghlOnvan],[RecordState],[RecordState_NameFarsi],[PostSender],[PostDelivered],[WorkflowDestinationPostId],[IsRead],[Code],[IsDelete],[CreateUserId],[CreateDateTime],[IsEblagh],[KartablOthePost],[Archive])
      VALUES(@PersonId,@PersonCode,@FirstName,@LastName,LTRIM(RTRIM(CONCAT(@FirstName,N' ',@LastName))),@FatherName,@BirthDate,@PostId,@PostTitle,@LastJob,2,N'پیشنهاد انتصاب',CONVERT(NVARCHAR(50),@ActorPostId),CONVERT(NVARCHAR(50),@DestinationPostId),@DestinationPostId,0,@Code,0,@ActorUserId,CONVERT(NVARCHAR(19),GETDATE(),120),1,0,0);
      DECLARE @EntesabId BIGINT=SCOPE_IDENTITY();

      /* پس از اجرای Appointments_Workflow_Referrals.sql، ارجاع اولیه نیز همزمان ساخته می‌شود. */
      IF OBJECT_ID(N'[bz].[AppointmentWorkflowReferrals]',N'U') IS NOT NULL AND @DestinationPostId<>@ActorPostId
      BEGIN
        INSERT [bz].[AppointmentWorkflowReferrals]
          ([EntesabId],[ParentReferralId],[ReferralKind],[FromPostId],[ToPostId],[Note],[StatusCode],[CreateUserId])
        VALUES(@EntesabId,NULL,1,@ActorPostId,@DestinationPostId,N'ارجاع اولیه پیشنهاد انتصاب',1,@ActorUserId);
      END;

      INSERT [bz].[AppointmentRequestReasons]([EntesabId],[ReasonText],[SortOrder],[CreateUserId])
      SELECT @EntesabId,LTRIM(RTRIM(CONVERT(NVARCHAR(1000),[value]))),CONVERT(TINYINT,CONVERT(INT,[key])+1),@ActorUserId FROM OPENJSON(@ReasonsJson)
      WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(1000),[value]))),N'') IS NOT NULL AND TRY_CONVERT(INT,[key]) BETWEEN 0 AND 9;
      INSERT [bz].[Entesabat_Ellat]([EntesabId],[Dalayel],[CreateUserId],[CreateDateTime])
      SELECT @EntesabId,LEFT(STRING_AGG(CONVERT(NVARCHAR(MAX),[ReasonText]),NCHAR(13)+NCHAR(10)) WITHIN GROUP(ORDER BY [SortOrder]),4000),@ActorUserId,CONVERT(NVARCHAR(19),GETDATE(),120) FROM [bz].[AppointmentRequestReasons] WHERE [EntesabId]=@EntesabId;
      INSERT [bz].[AppointmentInterviewForms]([EntesabId],[InterviewType],[InterviewTypeTitle],[FormJson],[CreateUserId]) VALUES(@EntesabId,1,N'مصاحبه اولیه',@InitialInterviewJson,@ActorUserId);
      INSERT [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles]([EntesabId],[PersonId],[FileKind],[FileKindTitle],[FileName],[ContentType],[FileSize],[FileData],[CreateUserId])
      VALUES(@EntesabId,@PersonId,1,N'پیشنهاد انتصاب',@ProposalFileName,@ProposalContentType,DATALENGTH(@ProposalFileData),@ProposalFileData,@ActorUserId);
      INSERT [bz].[Entesabat_Madarek]([PersonId],[EntesabId],[FileName],[SanadId],[OnvanSanad],[OrderId],[CreateUserId],[CreateDateTime])
      VALUES(@PersonId,@EntesabId,@ProposalFileName,5,N'درخواست انتصاب',@EntesabId,@ActorUserId,CONVERT(NVARCHAR(19),GETDATE(),120));
      INSERT [bz].[AppointmentWorkflowHistory]([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[ActorUserId],[ActorPostId]) VALUES(@EntesabId,1,N'ثبت و ارسال پیشنهاد انتصاب',NULL,2,@ActorUserId,@ActorPostId);
      COMMIT;
      SELECT @EntesabId AS [EntesabId],@Code AS [Code];
    END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_List]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @ActorPostId BIGINT;
  SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
  IF @ActorPostId IS NULL THROW 51209,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;
  SELECT E.[EntesabId],E.[PersonId],E.[Code],E.[CodeMelli],E.[FullName],E.[FatherName],E.[PostId],COALESCE(S.[OnvanSemat],E.[PostOnvan]) AS [PostOnvan],
    E.[RecordState],E.[RecordState_NameFarsi] AS [RecordStateNameFarsi],E.[TaeedOrAdamTaeed],E.[TaeedOrAdamTaeedNameFarsi],E.[CreateDateTime],E.[TarikhEblagh],E.[ModatEblagKhedmat],
    CU.[FullName] AS [RequesterFullName],CS.[OnvanSemat] AS [RequesterPostTitle],DU.[FullName] AS [DecisionByFullName],E.[DecisionAt],E.[DecisionNote],
    CONVERT(BIT,CASE WHEN E.[CreateUserId]=@ActorUserId OR TRY_CONVERT(BIGINT,E.[PostSender])=@ActorPostId THEN 1 ELSE 0 END) AS [IsOwnRequest],
    CONVERT(BIT,CASE WHEN E.[RecordState]=2 AND E.[CreateUserId]<>@ActorUserId AND (E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1)) THEN 1 ELSE 0 END) AS [CanDecide],
    (SELECT COUNT(1) FROM [bz].[AppointmentRequestReasons] R WHERE R.[EntesabId]=E.[EntesabId]) AS [ReasonsCount],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=1) THEN 1 ELSE 0 END) AS [HasInitialInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=2) THEN 1 ELSE 0 END) AS [HasFinalInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F WHERE F.[EntesabId]=E.[EntesabId] AND F.[FileKind]=2 AND F.[IsDelete]=0) THEN 1 ELSE 0 END) AS [HasOrder]
  FROM [bz].[Entesabat] E
  LEFT JOIN [dbo].[Semats] S ON S.[ID]=E.[PostId]
  LEFT JOIN [dbo].[AspNetUsers] CU ON CU.[Id]=E.[CreateUserId]
  LEFT JOIN [dbo].[Semats] CS ON CS.[ID]=TRY_CONVERT(BIGINT,E.[PostSender])
  LEFT JOIN [dbo].[AspNetUsers] DU ON DU.[Id]=E.[DecisionUserId]
  WHERE ISNULL(E.[IsDelete],0)=0 AND E.[IsEblagh]=1 AND E.[Code] IS NOT NULL
    AND (E.[CreateUserId]=@ActorUserId OR TRY_CONVERT(BIGINT,E.[PostSender])=@ActorPostId OR E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1))
  ORDER BY E.[EntesabId] DESC;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Get]
    @ActorUserId NVARCHAR(450), @EntesabId BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @ActorPostId BIGINT;
  SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
  IF NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND ISNULL(E.[IsDelete],0)=0 AND (E.[CreateUserId]=@ActorUserId OR E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1))) THROW 51210,N'درخواست پیدا نشد یا مجوز مشاهده آن را ندارید.',1;
  SELECT E.[EntesabId],E.[PersonId],E.[Code],E.[CodeMelli],E.[FirstName],E.[LastName],E.[FullName],E.[FatherName],E.[TarikhTavalod],P.[ShomareShenasnameh],P.[Shoghl],P.[TelHamrah],
    E.[PostId],COALESCE(S.[OnvanSemat],E.[PostOnvan]) AS [PostOnvan],E.[RecordState],E.[RecordState_NameFarsi] AS [RecordStateNameFarsi],E.[TaeedOrAdamTaeed],E.[TaeedOrAdamTaeedNameFarsi],E.[CreateDateTime],E.[TarikhEblagh],E.[ModatEblagKhedmat],E.[DecisionNote],E.[DecisionAt],
    CU.[FullName] AS [RequesterFullName],CS.[OnvanSemat] AS [RequesterPostTitle],DS.[OnvanSemat] AS [DestinationPostTitle],DA.[FullName] AS [DestinationFullName],DU.[FullName] AS [DecisionByFullName],
    CONVERT(BIT,CASE WHEN E.[RecordState]=2 AND E.[CreateUserId]<>@ActorUserId AND (E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1)) THEN 1 ELSE 0 END) AS [CanDecide]
  FROM [bz].[Entesabat] E LEFT JOIN [bz].[Person] P ON P.[PersonId]=E.[PersonId] LEFT JOIN [dbo].[Semats] S ON S.[ID]=E.[PostId]
  LEFT JOIN [dbo].[AspNetUsers] CU ON CU.[Id]=E.[CreateUserId] LEFT JOIN [dbo].[Semats] CS ON CS.[ID]=TRY_CONVERT(BIGINT,E.[PostSender])
  LEFT JOIN [dbo].[Semats] DS ON DS.[ID]=E.[WorkflowDestinationPostId] OUTER APPLY(SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=E.[WorkflowDestinationPostId] AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1) DA
  LEFT JOIN [dbo].[AspNetUsers] DU ON DU.[Id]=E.[DecisionUserId] WHERE E.[EntesabId]=@EntesabId;
  SELECT [ReasonText] FROM [bz].[AppointmentRequestReasons] WHERE [EntesabId]=@EntesabId ORDER BY [SortOrder];
  SELECT [InterviewType],[InterviewTypeTitle],[FormJson],[CreateDateTime],[EditDateTime] FROM [bz].[AppointmentInterviewForms] WHERE [EntesabId]=@EntesabId ORDER BY [InterviewType];
  SELECT H.[HistoryId],H.[ActionTitle],H.[FromState],H.[ToState],H.[Note],U.[FullName] AS [ActorFullName],H.[CreateDateTime] FROM [bz].[AppointmentWorkflowHistory] H LEFT JOIN [dbo].[AspNetUsers] U ON U.[Id]=H.[ActorUserId] WHERE H.[EntesabId]=@EntesabId ORDER BY H.[HistoryId];
  SELECT F.[FileId],F.[FileKind],F.[FileKindTitle],F.[FileName],F.[ContentType],F.[FileSize],F.[CreateDateTime] FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F WHERE F.[EntesabId]=@EntesabId AND F.[IsDelete]=0 ORDER BY F.[FileKind],F.[FileId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Decide]
 @ActorUserId NVARCHAR(450),@EntesabId BIGINT,@Action NVARCHAR(30),@FinalInterviewJson NVARCHAR(MAX)=NULL,@DecisionNote NVARCHAR(1000)=NULL,
 @TarikhEblagh NVARCHAR(20)=NULL,@DurationMonths INT=NULL,@OrderFileName NVARCHAR(150)=NULL,@OrderContentType NVARCHAR(100)=NULL,@OrderFileData VARBINARY(MAX)=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; SET @DecisionNote=NULLIF(LTRIM(RTRIM(ISNULL(@DecisionNote,N''))),N'');
 IF @Action NOT IN(N'save-interview',N'approve',N'reject') THROW 51211,N'عملیات انتخاب‌شده معتبر نیست.',1;
 IF @Action IN(N'save-interview',N'approve') AND ISJSON(@FinalInterviewJson)<>1 THROW 51212,N'فرم مصاحبه نهایی را تکمیل کنید.',1;
 IF @Action=N'reject' AND @DecisionNote IS NULL THROW 51213,N'درج علت عدم تأیید الزامی است.',1;
 IF @Action=N'approve' AND (@TarikhEblagh IS NULL OR @TarikhEblagh NOT LIKE N'[12][0-9][0-9][0-9]/[01][0-9]/[0-3][0-9]' OR @DurationMonths IS NULL OR @DurationMonths NOT BETWEEN 1 AND 120) THROW 51214,N'تاریخ و مدت ابلاغ معتبر نیست.',1;
 IF @Action=N'approve' AND (@OrderFileData IS NULL OR @OrderContentType<>N'image/png' OR DATALENGTH(@OrderFileData)<100 OR DATALENGTH(@OrderFileData)>12582912 OR SUBSTRING(@OrderFileData,1,8)<>0x89504E470D0A1A0A) THROW 51215,N'تصویر PNG حکم انتصاب معتبر نیست.',1;
 DECLARE @ActorPostId BIGINT,@TargetPostId BIGINT,@Creator NVARCHAR(450),@State INT,@PersonId BIGINT;
 SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
 BEGIN TRY BEGIN TRANSACTION;
 SELECT @TargetPostId=E.[PostId],@Creator=E.[CreateUserId],@State=E.[RecordState],@PersonId=E.[PersonId] FROM [bz].[Entesabat] E WITH(UPDLOCK,HOLDLOCK) WHERE E.[EntesabId]=@EntesabId AND ISNULL(E.[IsDelete],0)=0;
 IF @TargetPostId IS NULL THROW 51216,N'درخواست انتصاب پیدا نشد.',1;
 IF @State<>2 THROW 51217,N'این درخواست قبلاً تعیین تکلیف شده است.',1;
 IF @Creator=@ActorUserId THROW 51218,N'ثبت‌کننده درخواست نمی‌تواند درخواست خود را بررسی کند.',1;
 IF NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND (E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1))) THROW 51219,N'مجوز بررسی این درخواست را ندارید.',1;

 IF @Action IN(N'save-interview',N'approve')
 BEGIN
   IF EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] WHERE [EntesabId]=@EntesabId AND [InterviewType]=2)
     UPDATE [bz].[AppointmentInterviewForms] SET [FormJson]=@FinalInterviewJson,[EditUserId]=@ActorUserId,[EditDateTime]=SYSDATETIME() WHERE [EntesabId]=@EntesabId AND [InterviewType]=2;
   ELSE INSERT [bz].[AppointmentInterviewForms]([EntesabId],[InterviewType],[InterviewTypeTitle],[FormJson],[CreateUserId]) VALUES(@EntesabId,2,N'مصاحبه نهایی',@FinalInterviewJson,@ActorUserId);
   INSERT [bz].[AppointmentWorkflowHistory]([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId]) VALUES(@EntesabId,2,N'ثبت مصاحبه نهایی',2,2,@DecisionNote,@ActorUserId,@ActorPostId);
 END;

 IF @Action=N'reject'
 BEGIN
   UPDATE [bz].[Entesabat] SET [RecordState]=3,[RecordState_NameFarsi]=N'عدم تأیید پیشنهاد انتصاب',[TaeedOrAdamTaeed]=3,[TaeedOrAdamTaeedNameFarsi]=N'عدم تأیید انتصاب مسئولیت',[DecisionNote]=@DecisionNote,[DecisionUserId]=@ActorUserId,[DecisionAt]=SYSDATETIME(),[EditUserId]=@ActorUserId,[EditDateTime]=CONVERT(NVARCHAR(19),GETDATE(),120) WHERE [EntesabId]=@EntesabId;
   INSERT [bz].[AppointmentWorkflowHistory]([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId]) VALUES(@EntesabId,3,N'عدم تأیید پیشنهاد انتصاب',2,3,@DecisionNote,@ActorUserId,@ActorPostId);
 END;

 IF @Action=N'approve'
 BEGIN
   IF EXISTS(SELECT 1 FROM [bz].[Entesabat] WHERE [PostId]=@TargetPostId AND [EntesabId]<>@EntesabId AND [RecordState]=10 AND [TaeedOrAdamTaeed]=4 AND ISNULL([IsDelete],0)=0 AND ISNULL([IsEblagh],0)=1) THROW 51220,N'برای این پست قبلاً ابلاغ فعال صادر شده است.',1;
   UPDATE [bz].[Entesabat] SET [RecordState]=10,[RecordState_NameFarsi]=N'انتصاب مسئولیت',[TaeedOrAdamTaeed]=4,[TaeedOrAdamTaeedNameFarsi]=N'تأیید انتصاب مسئولیت',[TarikhEblagh]=@TarikhEblagh,[ModatEblagKhedmat]=@DurationMonths,[DecisionNote]=@DecisionNote,[DecisionUserId]=@ActorUserId,[DecisionAt]=SYSDATETIME(),[IsEblagh]=1,[EditUserId]=@ActorUserId,[EditDateTime]=CONVERT(NVARCHAR(19),GETDATE(),120) WHERE [EntesabId]=@EntesabId;
   INSERT [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles]([EntesabId],[PersonId],[FileKind],[FileKindTitle],[FileName],[ContentType],[FileSize],[FileData],[CreateUserId]) VALUES(@EntesabId,@PersonId,2,N'حکم انتصاب مسئولیت',@OrderFileName,@OrderContentType,DATALENGTH(@OrderFileData),@OrderFileData,@ActorUserId);
   INSERT [bz].[Entesabat_Madarek]([PersonId],[EntesabId],[FileName],[SanadId],[OnvanSanad],[OrderId],[CreateUserId],[CreateDateTime]) VALUES(@PersonId,@EntesabId,@OrderFileName,10,N'حکم انتصاب مسئولیت',@EntesabId,@ActorUserId,CONVERT(NVARCHAR(19),GETDATE(),120));
   INSERT [bz].[AppointmentWorkflowHistory]([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId]) VALUES(@EntesabId,4,N'تأیید و صدور ابلاغ انتصاب',2,10,@DecisionNote,@ActorUserId,@ActorPostId);
 END;
 COMMIT; SELECT @EntesabId AS [EntesabId],CASE WHEN @Action=N'approve' THEN 10 WHEN @Action=N'reject' THEN 3 ELSE 2 END AS [RecordState];
 END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_File_Get]
 @ActorUserId NVARCHAR(450),@FileId BIGINT
AS
BEGIN
 SET NOCOUNT ON; DECLARE @ActorPostId BIGINT;
 SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
 SELECT TOP(1) F.[FileId],F.[FileName],F.[ContentType],F.[FileSize],F.[FileData]
 FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F INNER JOIN [bz].[Entesabat] E ON E.[EntesabId]=F.[EntesabId]
 WHERE F.[FileId]=@FileId AND F.[IsDelete]=0 AND (E.[CreateUserId]=@ActorUserId OR E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1));
END;
GO
