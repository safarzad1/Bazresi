USE [DBBazresi];
GO

/*
  ارجاعات کامل فرایند انتصابات
  این فایل بعد از Appointments_Full_Workflow.sql اجرا شود.
  رکورد اصلی انتصاب ثابت می‌ماند و هر ارسال/پاسخ یک شاخه مستقل در جدول ارجاعات دارد.
*/

IF OBJECT_ID(N'[bz].[AppointmentWorkflowReferrals]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AppointmentWorkflowReferrals]
    (
        [ReferralId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AppointmentWorkflowReferrals] PRIMARY KEY,
        [EntesabId] BIGINT NOT NULL,
        [ParentReferralId] BIGINT NULL,
        [ReferralKind] TINYINT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_Kind] DEFAULT (1),
        [FromPostId] BIGINT NOT NULL,
        [ToPostId] BIGINT NOT NULL,
        [Note] NVARCHAR(1000) NULL,
        [StatusCode] TINYINT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_Status] DEFAULT (1),
        [IsRead] BIT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_IsRead] DEFAULT (0),
        [ReadUserId] NVARCHAR(450) NULL,
        [ReadDateTime] DATETIME2(0) NULL,
        [IsRecalled] BIT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_IsRecalled] DEFAULT (0),
        [RecallUserId] NVARCHAR(450) NULL,
        [RecallDateTime] DATETIME2(0) NULL,
        [SenderArchived] BIT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_SenderArchived] DEFAULT (0),
        [ReceiverArchived] BIT NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_ReceiverArchived] DEFAULT (0),
        [CreateUserId] NVARCHAR(450) NOT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AppointmentWorkflowReferrals_CreateDateTime] DEFAULT (SYSDATETIME()),
        CONSTRAINT [CK_AppointmentWorkflowReferrals_Kind] CHECK ([ReferralKind] IN (1,2)),
        CONSTRAINT [CK_AppointmentWorkflowReferrals_Status] CHECK ([StatusCode] IN (1,2,3,4)),
        CONSTRAINT [CK_AppointmentWorkflowReferrals_Posts] CHECK ([FromPostId] <> [ToPostId])
    );

    CREATE INDEX [IX_AppointmentWorkflowReferrals_Entesab]
        ON [bz].[AppointmentWorkflowReferrals] ([EntesabId], [ReferralId]);
    CREATE INDEX [IX_AppointmentWorkflowReferrals_Inbox]
        ON [bz].[AppointmentWorkflowReferrals] ([ToPostId], [StatusCode], [ReceiverArchived], [EntesabId]);
    CREATE INDEX [IX_AppointmentWorkflowReferrals_Sent]
        ON [bz].[AppointmentWorkflowReferrals] ([FromPostId], [SenderArchived], [EntesabId]);
END;
GO

IF COL_LENGTH(N'bz.AppointmentWorkflowHistory', N'ReferralId') IS NULL
    ALTER TABLE [bz].[AppointmentWorkflowHistory] ADD [ReferralId] BIGINT NULL;
GO
IF COL_LENGTH(N'bz.AppointmentWorkflowHistory', N'FromPostId') IS NULL
    ALTER TABLE [bz].[AppointmentWorkflowHistory] ADD [FromPostId] BIGINT NULL;
GO
IF COL_LENGTH(N'bz.AppointmentWorkflowHistory', N'ToPostId') IS NULL
    ALTER TABLE [bz].[AppointmentWorkflowHistory] ADD [ToPostId] BIGINT NULL;
GO

/* تبدیل مقصد فعلی درخواست‌های قبلی به نخستین ارجاع، بدون تکثیر رکورد انتصاب */
INSERT [bz].[AppointmentWorkflowReferrals]
(
    [EntesabId], [ParentReferralId], [ReferralKind], [FromPostId], [ToPostId], [Note],
    [StatusCode], [IsRead], [ReadUserId], [ReadDateTime], [CreateUserId], [CreateDateTime]
)
SELECT
    E.[EntesabId], NULL, 1, TRY_CONVERT(BIGINT,E.[PostSender]),
    COALESCE(E.[WorkflowDestinationPostId],TRY_CONVERT(BIGINT,E.[PostDelivered])),
    N'ارجاع اولیه پیشنهاد انتصاب',
    CASE WHEN E.[RecordState]=2 THEN CASE WHEN ISNULL(E.[IsRead],0)=1 THEN 2 ELSE 1 END ELSE 3 END,
    ISNULL(E.[IsRead],0),
    CASE WHEN ISNULL(E.[IsRead],0)=1 THEN E.[DecisionUserId] ELSE NULL END,
    CASE WHEN ISNULL(E.[IsRead],0)=1 THEN TRY_CONVERT(DATETIME2(0),E.[ReadTime]) ELSE NULL END,
    COALESCE(E.[CreateUserId],N'system-migration'),
    COALESCE(TRY_CONVERT(DATETIME2(0),E.[CreateDateTime]),SYSDATETIME())
FROM [bz].[Entesabat] E
WHERE ISNULL(E.[IsDelete],0)=0
  AND E.[Code] IS NOT NULL
  AND TRY_CONVERT(BIGINT,E.[PostSender]) IS NOT NULL
  AND COALESCE(E.[WorkflowDestinationPostId],TRY_CONVERT(BIGINT,E.[PostDelivered])) IS NOT NULL
  AND TRY_CONVERT(BIGINT,E.[PostSender])<>COALESCE(E.[WorkflowDestinationPostId],TRY_CONVERT(BIGINT,E.[PostDelivered]))
  AND NOT EXISTS
      (SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId]);
GO

/* جست‌وجوی سروری فرد: نام، نام خانوادگی، نام کامل یا کد ملی؛ حداکثر ۲۰ نتیجه */
CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Lookups]
    @ActorUserId NVARCHAR(450),
    @Search NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActorPostId BIGINT,@RequesterName NVARCHAR(150),@RequesterPostTitle NVARCHAR(250),@DestinationPostId BIGINT;
    SELECT TOP(1) @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]),@RequesterName=U.[FullName],@RequesterPostTitle=S.[OnvanSemat]
    FROM [dbo].[AspNetUsers] U LEFT JOIN [dbo].[Semats] S ON S.[ID]=TRY_CONVERT(BIGINT,U.[Semat])
    WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51201,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;

    SELECT @DestinationPostId=NULLIF(S.[PID],0) FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId;
    SET @DestinationPostId=ISNULL(@DestinationPostId,@ActorPostId);

    SELECT TOP(20) P.[PersonId],P.[CodeMelli],P.[FirstName],P.[LastName],
      LTRIM(RTRIM(CONCAT(P.[FirstName],N' ',P.[LastName]))) AS [FullName],P.[FatherName],P.[TarikhTavalod],
      P.[ShomareShenasnameh],P.[Shoghl],P.[TelHamrah]
    FROM [bz].[Person] P
    WHERE ISNULL(P.[IsDelete],0)=0 AND
      (@Search IS NULL OR @Search=N'' OR P.[CodeMelli] LIKE N'%'+@Search+N'%' OR P.[FirstName] LIKE N'%'+@Search+N'%'
       OR P.[LastName] LIKE N'%'+@Search+N'%' OR LTRIM(RTRIM(CONCAT(P.[FirstName],N' ',P.[LastName]))) LIKE N'%'+@Search+N'%')
    ORDER BY P.[FirstName],P.[LastName],P.[PersonId];

    SELECT A.[TargetPostId] AS [PostId],S.[OnvanSemat] AS [PostOnvan],S.[Mahal]
    FROM [bz].[AppointmentPostAccess] A INNER JOIN [dbo].[Semats] S ON S.[ID]=A.[TargetPostId]
    WHERE A.[ActorPostId]=@ActorPostId AND A.[IsActive]=1
      AND NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[PostId]=A.[TargetPostId] AND E.[RecordState]=10 AND E.[TaeedOrAdamTaeed]=4 AND ISNULL(E.[IsDelete],0)=0 AND ISNULL(E.[IsEblagh],0)=1)
      AND NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[PostId]=A.[TargetPostId] AND E.[RecordState]=2 AND ISNULL(E.[IsDelete],0)=0)
    ORDER BY S.[OnvanSemat];

    SELECT @ActorPostId AS [RequesterPostId],@RequesterName AS [RequesterFullName],@RequesterPostTitle AS [RequesterPostTitle],
      @DestinationPostId AS [DestinationPostId],DS.[OnvanSemat] AS [DestinationPostTitle],DU.[FullName] AS [DestinationFullName]
    FROM [dbo].[Semats] DS
    OUTER APPLY(SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=@DestinationPostId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1) DU
    WHERE DS.[ID]=@DestinationPostId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Referral_Lookups]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActorPostId BIGINT,@IsAdmin BIT=0,@CanSee BIT=0,@CanRefer BIT=0;
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat])
    FROM [dbo].[AspNetUsers] U
    WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51301,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;

    IF EXISTS(SELECT 1 FROM [dbo].[AspNetUserRoles] UR INNER JOIN [dbo].[AspNetRoles] AR ON AR.[Id]=UR.[RoleId]
              WHERE UR.[UserId]=@ActorUserId AND AR.[Name] IN(N'Admin',N'a_root')) SET @IsAdmin=1;

    SELECT @CanSee=CONVERT(BIT,CASE WHEN EXISTS
    (
      SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND ISNULL(E.[IsDelete],0)=0 AND
       (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND @ActorPostId IN(R.[FromPostId],R.[ToPostId]))
        OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1))
    ) THEN 1 ELSE 0 END);
    IF @CanSee=0 THROW 51302,N'درخواست پیدا نشد یا مجوز مشاهده آن را ندارید.',1;

    SELECT @CanRefer=CONVERT(BIT,CASE WHEN EXISTS
    (
      SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND E.[RecordState]=2 AND
      (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R
       WHERE R.[EntesabId]=E.[EntesabId] AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0))
    ) THEN 1 ELSE 0 END);

    ;WITH DownTree AS
    (
      SELECT S.[ID],S.[PID],0 AS [Depth] FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId
      UNION ALL
      SELECT C.[ID],C.[PID],T.[Depth]+1 FROM [dbo].[Semats] C INNER JOIN DownTree T ON C.[PID]=T.[ID] WHERE T.[Depth]<12
    ), Candidate AS
    (
      SELECT S.[ID] FROM [dbo].[Semats] S WHERE @IsAdmin=1 OR @ActorPostId IN(2,201,204) OR CONVERT(NVARCHAR(50),@ActorPostId) LIKE N'204%'
      UNION SELECT T.[ID] FROM DownTree T
      UNION SELECT S.[PID] FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId AND ISNULL(S.[PID],0)>0
      UNION SELECT B.[ID] FROM [dbo].[Semats] A INNER JOIN [dbo].[Semats] B ON B.[PID]=A.[PID]
            WHERE A.[ID]=@ActorPostId AND ISNULL(A.[IsReadEntesabatTop],0)=1
      UNION SELECT A.[TargetPostId] FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[IsActive]=1
    )
    SELECT DISTINCT CONVERT(BIGINT,S.[ID]) AS [PostId],S.[OnvanSemat] AS [PostTitle],S.[PID] AS [ParentPostId],S.[Mahal],
      U.[FullName] AS [AssigneeFullName]
    FROM Candidate C INNER JOIN [dbo].[Semats] S ON S.[ID]=C.[ID]
    OUTER APPLY(SELECT TOP(1) AU.[FullName] FROM [dbo].[AspNetUsers] AU
                WHERE TRY_CONVERT(BIGINT,AU.[Semat])=S.[ID] AND ISNULL(AU.[IsDelete],0)=0 AND ISNULL(AU.[IsActive],1)=1
                ORDER BY AU.[FullName]) U
    WHERE S.[ID]<>@ActorPostId
    ORDER BY [PostTitle],[PostId]
    OPTION(MAXRECURSION 20);

    SELECT @ActorPostId AS [ActorPostId],U.[FullName] AS [ActorFullName],S.[OnvanSemat] AS [ActorPostTitle],@CanRefer AS [CanRefer]
    FROM [dbo].[AspNetUsers] U LEFT JOIN [dbo].[Semats] S ON S.[ID]=@ActorPostId WHERE U.[Id]=@ActorUserId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Referral_MarkRead]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ActorPostId BIGINT,@ActorName NVARCHAR(150),@Now DATETIME2(0)=SYSDATETIME();
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]),@ActorName=U.[FullName]
    FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL RETURN;

    UPDATE [bz].[AppointmentWorkflowReferrals]
       SET [StatusCode]=2,[IsRead]=1,[ReadUserId]=@ActorUserId,[ReadDateTime]=@Now
     WHERE [EntesabId]=@EntesabId AND [ToPostId]=@ActorPostId AND [StatusCode]=1 AND [IsRecalled]=0;

    IF @@ROWCOUNT>0
      UPDATE [bz].[Entesabat]
         SET [IsRead]=1,[ReadTime]=CONVERT(NVARCHAR(19),@Now,120),[WhoRead]=@ActorName
       WHERE [EntesabId]=@EntesabId AND [WorkflowDestinationPostId]=@ActorPostId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Referral_Action]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT,
    @Action NVARCHAR(20),
    @ReferralId BIGINT=NULL,
    @DestinationPostIdsJson NVARCHAR(MAX)=NULL,
    @Note NVARCHAR(1000)=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    SET @Note=NULLIF(LTRIM(RTRIM(ISNULL(@Note,N''))),N'');
    IF @Action NOT IN(N'forward',N'reply',N'recall',N'archive',N'restore') THROW 51303,N'عملیات ارجاع معتبر نیست.',1;
    IF @Action IN(N'forward',N'reply') AND @Note IS NULL THROW 51304,N'درج توضیحات ارجاع یا پاسخ الزامی است.',1;

    DECLARE @ActorPostId BIGINT,@IsAdmin BIT=0,@State INT,@SourceReferralId BIGINT,@ReplyPostId BIGINT,@Now DATETIME2(0)=SYSDATETIME();
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U
    WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51301,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;
    IF EXISTS(SELECT 1 FROM [dbo].[AspNetUserRoles] UR INNER JOIN [dbo].[AspNetRoles] AR ON AR.[Id]=UR.[RoleId]
              WHERE UR.[UserId]=@ActorUserId AND AR.[Name] IN(N'Admin',N'a_root')) SET @IsAdmin=1;

    SELECT @State=E.[RecordState] FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND ISNULL(E.[IsDelete],0)=0;
    IF @State IS NULL THROW 51305,N'درخواست انتصاب پیدا نشد.',1;
    IF @Action IN(N'forward',N'reply') AND @State<>2 THROW 51306,N'ارجاع درخواست تعیین‌تکلیف‌شده امکان‌پذیر نیست.',1;
    IF NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND
      (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=@EntesabId AND @ActorPostId IN(R.[FromPostId],R.[ToPostId]))
       OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1)))
      THROW 51307,N'مجوز اقدام روی این ارجاع را ندارید.',1;

    BEGIN TRY
      BEGIN TRANSACTION;

      IF @Action=N'forward'
      BEGIN
        IF ISJSON(@DestinationPostIdsJson)<>1 THROW 51308,N'حداقل یک گیرنده برای ارجاع انتخاب کنید.',1;
        DECLARE @Destinations TABLE([PostId] BIGINT PRIMARY KEY);
        INSERT @Destinations([PostId])
        SELECT DISTINCT TRY_CONVERT(BIGINT,[value]) FROM OPENJSON(@DestinationPostIdsJson)
        WHERE TRY_CONVERT(BIGINT,[value]) IS NOT NULL AND TRY_CONVERT(BIGINT,[value])<>@ActorPostId;
        IF (SELECT COUNT(1) FROM @Destinations) NOT BETWEEN 1 AND 10 THROW 51308,N'حداقل یک و حداکثر ده گیرنده انتخاب کنید.',1;

        DECLARE @Allowed TABLE([PostId] BIGINT PRIMARY KEY);
        ;WITH DownTree AS
        (
          SELECT S.[ID],S.[PID],0 AS [Depth] FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId
          UNION ALL
          SELECT C.[ID],C.[PID],T.[Depth]+1 FROM [dbo].[Semats] C INNER JOIN DownTree T ON C.[PID]=T.[ID] WHERE T.[Depth]<12
        ), Candidate AS
        (
          SELECT S.[ID] FROM [dbo].[Semats] S WHERE @IsAdmin=1 OR @ActorPostId IN(2,201,204) OR CONVERT(NVARCHAR(50),@ActorPostId) LIKE N'204%'
          UNION SELECT T.[ID] FROM DownTree T
          UNION SELECT S.[PID] FROM [dbo].[Semats] S WHERE S.[ID]=@ActorPostId AND ISNULL(S.[PID],0)>0
          UNION SELECT B.[ID] FROM [dbo].[Semats] A INNER JOIN [dbo].[Semats] B ON B.[PID]=A.[PID]
                WHERE A.[ID]=@ActorPostId AND ISNULL(A.[IsReadEntesabatTop],0)=1
          UNION SELECT A.[TargetPostId] FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[IsActive]=1
        )
        INSERT @Allowed([PostId]) SELECT DISTINCT [ID] FROM Candidate WHERE [ID]<>@ActorPostId OPTION(MAXRECURSION 20);
        IF EXISTS(SELECT 1 FROM @Destinations D WHERE NOT EXISTS(SELECT 1 FROM @Allowed A WHERE A.[PostId]=D.[PostId]))
          THROW 51309,N'یک یا چند گیرنده خارج از محدوده دسترسی شماست.',1;

        SELECT TOP(1) @SourceReferralId=R.[ReferralId] FROM [bz].[AppointmentWorkflowReferrals] R WITH(UPDLOCK,HOLDLOCK)
        WHERE R.[EntesabId]=@EntesabId AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0
        ORDER BY R.[ReferralId] DESC;
        IF @SourceReferralId IS NULL AND NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND E.[CreateUserId]=@ActorUserId)
          THROW 51310,N'ارجاع فعالی برای ارسال مجدد در کارتابل شما وجود ندارد.',1;

        IF @SourceReferralId IS NOT NULL UPDATE [bz].[AppointmentWorkflowReferrals] SET [StatusCode]=3 WHERE [ReferralId]=@SourceReferralId;
        DECLARE @Created TABLE([ReferralId] BIGINT,[ToPostId] BIGINT);
        INSERT [bz].[AppointmentWorkflowReferrals]
          ([EntesabId],[ParentReferralId],[ReferralKind],[FromPostId],[ToPostId],[Note],[StatusCode],[CreateUserId],[CreateDateTime])
        OUTPUT inserted.[ReferralId],inserted.[ToPostId] INTO @Created
        SELECT @EntesabId,@SourceReferralId,1,@ActorPostId,D.[PostId],@Note,1,@ActorUserId,@Now FROM @Destinations D;

        INSERT [bz].[AppointmentWorkflowHistory]
          ([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId],[ReferralId],[FromPostId],[ToPostId])
        SELECT @EntesabId,5,N'ارجاع درخواست انتصاب',@State,@State,@Note,@ActorUserId,@ActorPostId,C.[ReferralId],@ActorPostId,C.[ToPostId] FROM @Created C;
        UPDATE [bz].[Entesabat] SET [WorkflowDestinationPostId]=(SELECT MIN([ToPostId]) FROM @Created),[IsRead]=0,[ReadTime]=NULL,[WhoRead]=NULL
        WHERE [EntesabId]=@EntesabId;
      END;

      IF @Action=N'reply'
      BEGIN
        SELECT @ReplyPostId=R.[FromPostId] FROM [bz].[AppointmentWorkflowReferrals] R WITH(UPDLOCK,HOLDLOCK)
        WHERE R.[ReferralId]=@ReferralId AND R.[EntesabId]=@EntesabId AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0;
        IF @ReplyPostId IS NULL THROW 51311,N'ارجاع فعال برای ثبت پاسخ پیدا نشد.',1;
        UPDATE [bz].[AppointmentWorkflowReferrals] SET [StatusCode]=3 WHERE [ReferralId]=@ReferralId;
        INSERT [bz].[AppointmentWorkflowReferrals]
          ([EntesabId],[ParentReferralId],[ReferralKind],[FromPostId],[ToPostId],[Note],[StatusCode],[CreateUserId],[CreateDateTime])
        VALUES(@EntesabId,@ReferralId,2,@ActorPostId,@ReplyPostId,@Note,1,@ActorUserId,@Now);
        DECLARE @NewReplyId BIGINT=SCOPE_IDENTITY();
        INSERT [bz].[AppointmentWorkflowHistory]
          ([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId],[ReferralId],[FromPostId],[ToPostId])
        VALUES(@EntesabId,6,N'پاسخ به ارجاع انتصاب',@State,@State,@Note,@ActorUserId,@ActorPostId,@NewReplyId,@ActorPostId,@ReplyPostId);
        UPDATE [bz].[Entesabat] SET [WorkflowDestinationPostId]=@ReplyPostId,[IsRead]=0,[ReadTime]=NULL,[WhoRead]=NULL WHERE [EntesabId]=@EntesabId;
      END;

      IF @Action=N'recall'
      BEGIN
        DECLARE @RecallToPost BIGINT;
        SELECT @RecallToPost=R.[ToPostId] FROM [bz].[AppointmentWorkflowReferrals] R WITH(UPDLOCK,HOLDLOCK)
        WHERE R.[ReferralId]=@ReferralId AND R.[EntesabId]=@EntesabId AND R.[FromPostId]=@ActorPostId AND R.[StatusCode]=1 AND R.[IsRead]=0 AND R.[IsRecalled]=0;
        IF @RecallToPost IS NULL THROW 51312,N'فقط ارجاع خوانده‌نشده قابل بازپس‌گیری است.',1;
        UPDATE [bz].[AppointmentWorkflowReferrals]
          SET [StatusCode]=4,[IsRecalled]=1,[RecallUserId]=@ActorUserId,[RecallDateTime]=@Now WHERE [ReferralId]=@ReferralId;
        INSERT [bz].[AppointmentWorkflowHistory]
          ([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId],[ReferralId],[FromPostId],[ToPostId])
        VALUES(@EntesabId,7,N'بازپس‌گیری ارجاع انتصاب',@State,@State,@Note,@ActorUserId,@ActorPostId,@ReferralId,@ActorPostId,@RecallToPost);
        UPDATE [bz].[Entesabat] SET [WorkflowDestinationPostId]=
          (SELECT TOP(1) R.[ToPostId] FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=@EntesabId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0 ORDER BY R.[ReferralId] DESC)
        WHERE [EntesabId]=@EntesabId;
      END;

      IF @Action IN(N'archive',N'restore')
      BEGIN
        DECLARE @ArchiveValue BIT=CASE WHEN @Action=N'archive' THEN 1 ELSE 0 END;
        UPDATE [bz].[AppointmentWorkflowReferrals]
           SET [SenderArchived]=CASE WHEN [FromPostId]=@ActorPostId THEN @ArchiveValue ELSE [SenderArchived] END,
               [ReceiverArchived]=CASE WHEN [ToPostId]=@ActorPostId THEN @ArchiveValue ELSE [ReceiverArchived] END
         WHERE [ReferralId]=@ReferralId AND [EntesabId]=@EntesabId AND @ActorPostId IN([FromPostId],[ToPostId]);
        IF @@ROWCOUNT=0 THROW 51313,N'ارجاع موردنظر برای بایگانی پیدا نشد.',1;
      END;

      COMMIT;
      SELECT @EntesabId AS [EntesabId],@Action AS [Action];
    END TRY
    BEGIN CATCH
      IF @@TRANCOUNT>0 ROLLBACK;
      THROW;
    END CATCH;
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
    CONVERT(BIT,CASE WHEN E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND R.[FromPostId]=@ActorPostId) THEN 1 ELSE 0 END) AS [IsOwnRequest],
    CONVERT(BIT,CASE WHEN E.[RecordState]=2 AND E.[CreateUserId]<>@ActorUserId AND EXISTS
      (SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0 AND R.[ReceiverArchived]=0)
      THEN 1 ELSE 0 END) AS [CanDecide],
    (SELECT COUNT(1) FROM [bz].[AppointmentRequestReasons] R WHERE R.[EntesabId]=E.[EntesabId]) AS [ReasonsCount],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=1) THEN 1 ELSE 0 END) AS [HasInitialInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=2) THEN 1 ELSE 0 END) AS [HasFinalInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F WHERE F.[EntesabId]=E.[EntesabId] AND F.[FileKind]=2 AND F.[IsDelete]=0) THEN 1 ELSE 0 END) AS [HasOrder],
    (SELECT COUNT(1) FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId]) AS [ReferralCount],
    (SELECT COUNT(1) FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND R.[ToPostId]=@ActorPostId AND R.[StatusCode]=1 AND R.[ReceiverArchived]=0) AS [UnreadReferrals],
    Dest.[DestinationTitles]
  FROM [bz].[Entesabat] E
  LEFT JOIN [dbo].[Semats] S ON S.[ID]=E.[PostId]
  LEFT JOIN [dbo].[AspNetUsers] CU ON CU.[Id]=E.[CreateUserId]
  LEFT JOIN [dbo].[Semats] CS ON CS.[ID]=TRY_CONVERT(BIGINT,E.[PostSender])
  LEFT JOIN [dbo].[AspNetUsers] DU ON DU.[Id]=E.[DecisionUserId]
  OUTER APPLY(SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),X.[OnvanSemat]),N'، ') AS [DestinationTitles]
              FROM(SELECT DISTINCT ST.[OnvanSemat] FROM [bz].[AppointmentWorkflowReferrals] RR INNER JOIN [dbo].[Semats] ST ON ST.[ID]=RR.[ToPostId]
                   WHERE RR.[EntesabId]=E.[EntesabId] AND RR.[StatusCode] IN(1,2) AND RR.[IsRecalled]=0) X) Dest
  WHERE ISNULL(E.[IsDelete],0)=0 AND E.[IsEblagh]=1 AND E.[Code] IS NOT NULL
    AND (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND @ActorPostId IN(R.[FromPostId],R.[ToPostId]))
      OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1))
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
  IF NOT EXISTS(SELECT 1 FROM [bz].[Entesabat] E WHERE E.[EntesabId]=@EntesabId AND ISNULL(E.[IsDelete],0)=0 AND
    (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND @ActorPostId IN(R.[FromPostId],R.[ToPostId]))
     OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1)))
    THROW 51210,N'درخواست پیدا نشد یا مجوز مشاهده آن را ندارید.',1;

  SELECT E.[EntesabId],E.[PersonId],E.[Code],E.[CodeMelli],E.[FirstName],E.[LastName],E.[FullName],E.[FatherName],E.[TarikhTavalod],P.[ShomareShenasnameh],P.[Shoghl],P.[TelHamrah],
    E.[PostId],COALESCE(S.[OnvanSemat],E.[PostOnvan]) AS [PostOnvan],E.[RecordState],E.[RecordState_NameFarsi] AS [RecordStateNameFarsi],E.[TaeedOrAdamTaeed],E.[TaeedOrAdamTaeedNameFarsi],E.[CreateDateTime],E.[TarikhEblagh],E.[ModatEblagKhedmat],E.[DecisionNote],E.[DecisionAt],
    CU.[FullName] AS [RequesterFullName],CS.[OnvanSemat] AS [RequesterPostTitle],DS.[OnvanSemat] AS [DestinationPostTitle],DA.[FullName] AS [DestinationFullName],DU.[FullName] AS [DecisionByFullName],
    CONVERT(BIT,CASE WHEN E.[RecordState]=2 AND E.[CreateUserId]<>@ActorUserId AND EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R
      WHERE R.[EntesabId]=E.[EntesabId] AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0 AND R.[ReceiverArchived]=0) THEN 1 ELSE 0 END) AS [CanDecide],
    CONVERT(BIT,CASE WHEN E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND R.[FromPostId]=@ActorPostId) THEN 1 ELSE 0 END) AS [IsOwnRequest],
    (SELECT COUNT(1) FROM [bz].[AppointmentRequestReasons] R WHERE R.[EntesabId]=E.[EntesabId]) AS [ReasonsCount],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=1) THEN 1 ELSE 0 END) AS [HasInitialInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [bz].[AppointmentInterviewForms] I WHERE I.[EntesabId]=E.[EntesabId] AND I.[InterviewType]=2) THEN 1 ELSE 0 END) AS [HasFinalInterview],
    CONVERT(BIT,CASE WHEN EXISTS(SELECT 1 FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F WHERE F.[EntesabId]=E.[EntesabId] AND F.[FileKind]=2 AND F.[IsDelete]=0) THEN 1 ELSE 0 END) AS [HasOrder]
  FROM [bz].[Entesabat] E LEFT JOIN [bz].[Person] P ON P.[PersonId]=E.[PersonId] LEFT JOIN [dbo].[Semats] S ON S.[ID]=E.[PostId]
  LEFT JOIN [dbo].[AspNetUsers] CU ON CU.[Id]=E.[CreateUserId] LEFT JOIN [dbo].[Semats] CS ON CS.[ID]=TRY_CONVERT(BIGINT,E.[PostSender])
  LEFT JOIN [dbo].[Semats] DS ON DS.[ID]=E.[WorkflowDestinationPostId] OUTER APPLY(SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=E.[WorkflowDestinationPostId] AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1) DA
  LEFT JOIN [dbo].[AspNetUsers] DU ON DU.[Id]=E.[DecisionUserId] WHERE E.[EntesabId]=@EntesabId;

  SELECT [ReasonText] FROM [bz].[AppointmentRequestReasons] WHERE [EntesabId]=@EntesabId ORDER BY [SortOrder];
  SELECT [InterviewType],[InterviewTypeTitle],[FormJson],[CreateDateTime],[EditDateTime] FROM [bz].[AppointmentInterviewForms] WHERE [EntesabId]=@EntesabId ORDER BY [InterviewType];
  SELECT H.[HistoryId],H.[ActionTitle],H.[FromState],H.[ToState],H.[Note],U.[FullName] AS [ActorFullName],H.[CreateDateTime],
    H.[ReferralId],H.[FromPostId],FP.[OnvanSemat] AS [FromPostTitle],H.[ToPostId],TP.[OnvanSemat] AS [ToPostTitle]
  FROM [bz].[AppointmentWorkflowHistory] H LEFT JOIN [dbo].[AspNetUsers] U ON U.[Id]=H.[ActorUserId]
  LEFT JOIN [dbo].[Semats] FP ON FP.[ID]=H.[FromPostId] LEFT JOIN [dbo].[Semats] TP ON TP.[ID]=H.[ToPostId]
  WHERE H.[EntesabId]=@EntesabId ORDER BY H.[HistoryId];
  SELECT F.[FileId],F.[FileKind],F.[FileKindTitle],F.[FileName],F.[ContentType],F.[FileSize],F.[CreateDateTime] FROM [DBBazresiFiles].[filedb].[AppointmentWorkflowFiles] F WHERE F.[EntesabId]=@EntesabId AND F.[IsDelete]=0 ORDER BY F.[FileKind],F.[FileId];

  SELECT R.[ReferralId],R.[ParentReferralId],R.[ReferralKind],R.[FromPostId],FP.[OnvanSemat] AS [FromPostTitle],FU.[FullName] AS [FromFullName],
    R.[ToPostId],TP.[OnvanSemat] AS [ToPostTitle],TU.[FullName] AS [ToFullName],R.[Note],R.[StatusCode],
    CASE R.[StatusCode] WHEN 1 THEN N'خوانده‌نشده' WHEN 2 THEN N'مشاهده‌شده' WHEN 3 THEN N'پاسخ داده‌شده' ELSE N'بازپس‌گرفته‌شده' END AS [StatusTitle],
    R.[IsRead],RU.[FullName] AS [ReadByFullName],R.[ReadDateTime],R.[IsRecalled],R.[RecallDateTime],CU2.[FullName] AS [CreateByFullName],R.[CreateDateTime],
    CONVERT(BIT,CASE WHEN R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0 THEN 1 ELSE 0 END) AS [CanReply],
    CONVERT(BIT,CASE WHEN R.[FromPostId]=@ActorPostId AND R.[StatusCode]=1 AND R.[IsRead]=0 AND R.[IsRecalled]=0 THEN 1 ELSE 0 END) AS [CanRecall],
    CONVERT(BIT,CASE WHEN @ActorPostId IN(R.[FromPostId],R.[ToPostId]) THEN 1 ELSE 0 END) AS [CanArchive],
    CONVERT(BIT,CASE WHEN R.[FromPostId]=@ActorPostId THEN R.[SenderArchived] WHEN R.[ToPostId]=@ActorPostId THEN R.[ReceiverArchived] ELSE 0 END) AS [IsArchivedForActor]
  FROM [bz].[AppointmentWorkflowReferrals] R
  INNER JOIN [dbo].[Semats] FP ON FP.[ID]=R.[FromPostId] INNER JOIN [dbo].[Semats] TP ON TP.[ID]=R.[ToPostId]
  OUTER APPLY(SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=R.[FromPostId] AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1 ORDER BY U.[FullName]) FU
  OUTER APPLY(SELECT TOP(1) U.[FullName] FROM [dbo].[AspNetUsers] U WHERE TRY_CONVERT(BIGINT,U.[Semat])=R.[ToPostId] AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1 ORDER BY U.[FullName]) TU
  LEFT JOIN [dbo].[AspNetUsers] RU ON RU.[Id]=R.[ReadUserId] LEFT JOIN [dbo].[AspNetUsers] CU2 ON CU2.[Id]=R.[CreateUserId]
  WHERE R.[EntesabId]=@EntesabId ORDER BY R.[ReferralId];

  EXEC [bz].[SP_Appointments_Workflow_Referral_Lookups] @ActorUserId=@ActorUserId,@EntesabId=@EntesabId;
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
 IF NOT EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=@EntesabId AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0 AND R.[ReceiverArchived]=0)
   THROW 51219,N'ارجاع فعال این درخواست در کارتابل شما نیست.',1;

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
   UPDATE [bz].[AppointmentWorkflowReferrals] SET [StatusCode]=3 WHERE [EntesabId]=@EntesabId AND [StatusCode] IN(1,2) AND [IsRecalled]=0;
   INSERT [bz].[AppointmentWorkflowHistory]([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId]) VALUES(@EntesabId,3,N'عدم تأیید پیشنهاد انتصاب',2,3,@DecisionNote,@ActorUserId,@ActorPostId);
 END;

 IF @Action=N'approve'
 BEGIN
   IF EXISTS(SELECT 1 FROM [bz].[Entesabat] WHERE [PostId]=@TargetPostId AND [EntesabId]<>@EntesabId AND [RecordState]=10 AND [TaeedOrAdamTaeed]=4 AND ISNULL([IsDelete],0)=0 AND ISNULL([IsEblagh],0)=1) THROW 51220,N'برای این پست قبلاً ابلاغ فعال صادر شده است.',1;
   UPDATE [bz].[Entesabat] SET [RecordState]=10,[RecordState_NameFarsi]=N'انتصاب مسئولیت',[TaeedOrAdamTaeed]=4,[TaeedOrAdamTaeedNameFarsi]=N'تأیید انتصاب مسئولیت',[TarikhEblagh]=@TarikhEblagh,[ModatEblagKhedmat]=@DurationMonths,[DecisionNote]=@DecisionNote,[DecisionUserId]=@ActorUserId,[DecisionAt]=SYSDATETIME(),[IsEblagh]=1,[EditUserId]=@ActorUserId,[EditDateTime]=CONVERT(NVARCHAR(19),GETDATE(),120) WHERE [EntesabId]=@EntesabId;
   UPDATE [bz].[AppointmentWorkflowReferrals] SET [StatusCode]=3 WHERE [EntesabId]=@EntesabId AND [StatusCode] IN(1,2) AND [IsRecalled]=0;
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
 WHERE F.[FileId]=@FileId AND F.[IsDelete]=0 AND
   (E.[CreateUserId]=@ActorUserId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=E.[EntesabId] AND @ActorPostId IN(R.[FromPostId],R.[ToPostId]))
    OR EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=E.[PostId] AND A.[IsActive]=1));
END;
GO
