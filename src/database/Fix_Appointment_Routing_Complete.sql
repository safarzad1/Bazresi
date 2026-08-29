USE [DBBazresi];
GO

/*
  اصلاح کامل گردش انتصابات
  1) همه پیشنهادهای جدید ابتدا به پست 204 (رئیس دفتر بازرسی) می‌روند.
  2) ارجاع دستی فقط به زیرمجموعه مستقیم یا مافوق مستقیم مجاز است.
  3) فقط پست‌هایی که کاربر فعال دارند در فهرست گیرنده نمایش داده می‌شوند.
  4) ثبت‌کننده اولیه بعد از ارسال به 204 نمی‌تواند مسیر را دور بزند.
*/

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

    /* مقصد نخست همان گیرنده رسمی درخواست‌های بازرسی در گردش سامانه قبلی است. */
    /* قانون گردش: تمام پیشنهادهای انتصاب ابتدا باید به رئیس دفتر بازرسی (پست 204) ارسال شوند. */
    SELECT @DestinationPostId=S.[ID]
    FROM [dbo].[Semats] S
    WHERE S.[ID]=204;
    IF @DestinationPostId IS NULL THROW 51221,N'پست رئیس دفتر بازرسی با کد 204 در ساختار سازمانی پیدا نشد.',1;

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
    IF OBJECT_ID(N'[bz].[AppointmentWorkflowReferrals]',N'U') IS NULL
        THROW 51222,N'ساختار ارجاعات انتصابات نصب نشده است؛ ابتدا اسکریپت Appointments_Workflow_Referrals.sql را اجرا کنید.',1;

    DECLARE @ActorPostId BIGINT,@DestinationPostId BIGINT,@PersonCode NVARCHAR(10),@FirstName NVARCHAR(150),@LastName NVARCHAR(150),@FatherName NVARCHAR(150),@BirthDate NVARCHAR(10),@LastJob NVARCHAR(150),@PostTitle NVARCHAR(500),@Code NVARCHAR(50);
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51205,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;
    IF NOT EXISTS(SELECT 1 FROM [bz].[AppointmentPostAccess] A WHERE A.[ActorPostId]=@ActorPostId AND A.[TargetPostId]=@PostId AND A.[IsActive]=1) THROW 51206,N'مجوز پیشنهاد انتصاب برای این پست را ندارید.',1;
    SELECT @PostTitle=S.[OnvanSemat] FROM [dbo].[Semats] S WHERE S.[ID]=@PostId;
    /* قانون گردش: تمام پیشنهادهای انتصاب ابتدا باید به رئیس دفتر بازرسی (پست 204) ارسال شوند. */
    SELECT @DestinationPostId=S.[ID]
    FROM [dbo].[Semats] S
    WHERE S.[ID]=204;
    IF @DestinationPostId IS NULL THROW 51221,N'پست رئیس دفتر بازرسی با کد 204 در ساختار سازمانی پیدا نشد.',1;
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

      /* ثبت درخواست و ارجاع اولیه یک تراکنش واحد هستند تا رکورد بدون کارتابل ایجاد نشود. */
      IF @DestinationPostId<>@ActorPostId
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


CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_Workflow_Referral_Lookups]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActorPostId BIGINT,@CanSee BIT=0,@CanRefer BIT=0;
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat])
    FROM [dbo].[AspNetUsers] U
    WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51301,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;

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
      (E.[WorkflowDestinationPostId]=@ActorPostId OR EXISTS(SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R
       WHERE R.[EntesabId]=E.[EntesabId] AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0))
    ) THEN 1 ELSE 0 END);

    ;WITH Candidate AS
    (
      -- فقط زیرمجموعه مستقیم
      SELECT C.[ID]
      FROM [dbo].[Semats] C
      WHERE C.[PID]=@ActorPostId

      UNION

      -- فقط مافوق مستقیم
      SELECT S.[PID]
      FROM [dbo].[Semats] S
      WHERE S.[ID]=@ActorPostId AND ISNULL(S.[PID],0)>0
    )
    SELECT CONVERT(BIGINT,S.[ID]) AS [PostId],S.[OnvanSemat] AS [PostTitle],S.[PID] AS [ParentPostId],S.[Mahal],
      U.[FullName] AS [AssigneeFullName]
    FROM Candidate C
    INNER JOIN [dbo].[Semats] S ON S.[ID]=C.[ID]
    CROSS APPLY(SELECT TOP(1) AU.[FullName] FROM [dbo].[AspNetUsers] AU
                WHERE TRY_CONVERT(BIGINT,AU.[Semat])=S.[ID] AND ISNULL(AU.[IsDelete],0)=0 AND ISNULL(AU.[IsActive],1)=1
                ORDER BY AU.[FullName]) U
    WHERE S.[ID]<>@ActorPostId
    ORDER BY CASE WHEN S.[PID]=@ActorPostId THEN 0 ELSE 1 END,[PostTitle],[PostId];

    SELECT @ActorPostId AS [ActorPostId],U.[FullName] AS [ActorFullName],S.[OnvanSemat] AS [ActorPostTitle],@CanRefer AS [CanRefer]
    FROM [dbo].[AspNetUsers] U LEFT JOIN [dbo].[Semats] S ON S.[ID]=@ActorPostId WHERE U.[Id]=@ActorUserId;
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

    DECLARE @ActorPostId BIGINT,@State INT,@SourceReferralId BIGINT,@ReplyPostId BIGINT,@Now DATETIME2(0)=SYSDATETIME();
    SELECT @ActorPostId=TRY_CONVERT(BIGINT,U.[Semat]) FROM [dbo].[AspNetUsers] U
    WHERE U.[Id]=@ActorUserId AND ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],1)=1;
    IF @ActorPostId IS NULL THROW 51301,N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.',1;
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

        -- ارجاع دستی فقط بین دو سطح مستقیم سازمانی مجاز است:
        -- مدیر -> زیرمجموعه مستقیم / زیرمجموعه -> مافوق مستقیم
        INSERT @Allowed([PostId])
        SELECT C.[ID]
        FROM [dbo].[Semats] C
        WHERE C.[PID]=@ActorPostId
          AND EXISTS
          (
            SELECT 1 FROM [dbo].[AspNetUsers] AU
            WHERE TRY_CONVERT(BIGINT,AU.[Semat])=C.[ID]
              AND ISNULL(AU.[IsDelete],0)=0
              AND ISNULL(AU.[IsActive],1)=1
          )
        UNION
        SELECT S.[PID]
        FROM [dbo].[Semats] S
        WHERE S.[ID]=@ActorPostId
          AND ISNULL(S.[PID],0)>0
          AND EXISTS
          (
            SELECT 1 FROM [dbo].[AspNetUsers] AU
            WHERE TRY_CONVERT(BIGINT,AU.[Semat])=S.[PID]
              AND ISNULL(AU.[IsDelete],0)=0
              AND ISNULL(AU.[IsActive],1)=1
          );

        IF EXISTS(SELECT 1 FROM @Destinations D WHERE NOT EXISTS(SELECT 1 FROM @Allowed A WHERE A.[PostId]=D.[PostId]))
          THROW 51309,N'ارجاع فقط به مافوق مستقیم یا زیرمجموعه مستقیم شما مجاز است.',1;

        SELECT TOP(1) @SourceReferralId=R.[ReferralId] FROM [bz].[AppointmentWorkflowReferrals] R WITH(UPDLOCK,HOLDLOCK)
        WHERE R.[EntesabId]=@EntesabId AND R.[ToPostId]=@ActorPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0
        ORDER BY R.[ReferralId] DESC;
        IF @SourceReferralId IS NULL AND NOT EXISTS
        (
          SELECT 1 FROM [bz].[Entesabat] E
          WHERE E.[EntesabId]=@EntesabId AND E.[WorkflowDestinationPostId]=@ActorPostId
        )
          THROW 51310,N'این درخواست در کارتابل ارجاع شما قرار ندارد.',1;

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

        IF NOT EXISTS
        (
          SELECT 1
          FROM [dbo].[Semats] ActorPost
          INNER JOIN [dbo].[Semats] ReplyPost ON ReplyPost.[ID]=@ReplyPostId
          WHERE ActorPost.[ID]=@ActorPostId
            AND (ActorPost.[PID]=@ReplyPostId OR ReplyPost.[PID]=@ActorPostId)
        )
          THROW 51314,N'پاسخ فقط بین مافوق مستقیم و زیرمجموعه مستقیم مجاز است.',1;

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


/* ترمیم امن رکورد نمونه 1289 در صورت باقی‌ماندن مقصد اشتباه */
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @EntesabId BIGINT=1289,@HeadPostId BIGINT=204,@FromPostId BIGINT,@CreateUserId NVARCHAR(450);
  IF EXISTS
  (
    SELECT 1 FROM [bz].[Entesabat] E
    WHERE E.[EntesabId]=@EntesabId AND E.[RecordState]=2 AND ISNULL(E.[IsDelete],0)=0
      AND ISNULL(E.[WorkflowDestinationPostId],0)<>@HeadPostId
  )
  BEGIN
    IF NOT EXISTS(SELECT 1 FROM [dbo].[Semats] WHERE [ID]=@HeadPostId)
      THROW 51401,N'پست رئیس دفتر بازرسی با کد 204 پیدا نشد.',1;

    SELECT @FromPostId=TRY_CONVERT(BIGINT,E.[PostSender]),@CreateUserId=COALESCE(E.[CreateUserId],N'system-routing-fix')
    FROM [bz].[Entesabat] E WITH(UPDLOCK,HOLDLOCK) WHERE E.[EntesabId]=@EntesabId;

    UPDATE [bz].[AppointmentWorkflowReferrals]
      SET [StatusCode]=4,[IsRecalled]=1,[RecallUserId]=N'system-routing-fix',[RecallDateTime]=SYSDATETIME()
    WHERE [EntesabId]=@EntesabId AND [StatusCode] IN(1,2) AND [IsRecalled]=0 AND [ToPostId]<>@HeadPostId;

    UPDATE [bz].[Entesabat]
      SET [PostDelivered]=CONVERT(NVARCHAR(50),@HeadPostId),[WorkflowDestinationPostId]=@HeadPostId,[IsRead]=0,[ReadTime]=NULL,[WhoRead]=NULL
    WHERE [EntesabId]=@EntesabId;

    IF NOT EXISTS
    (SELECT 1 FROM [bz].[AppointmentWorkflowReferrals] R WHERE R.[EntesabId]=@EntesabId AND R.[ToPostId]=@HeadPostId AND R.[StatusCode] IN(1,2) AND R.[IsRecalled]=0)
      INSERT [bz].[AppointmentWorkflowReferrals]
      ([EntesabId],[ParentReferralId],[ReferralKind],[FromPostId],[ToPostId],[Note],[StatusCode],[IsRead],[SenderArchived],[ReceiverArchived],[CreateUserId])
      VALUES(@EntesabId,NULL,1,@FromPostId,@HeadPostId,N'اصلاح مقصد اولیه به رئیس دفتر بازرسی',1,0,0,0,@CreateUserId);
  END;
  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
END CATCH;
GO

/* کنترل ساختار مستقیم رئیس دفتر و کاربران فعال زیرمجموعه */
SELECT C.[ID] AS [PostId],C.[PID] AS [ParentPostId],C.[OnvanSemat],U.[FullName]
FROM [dbo].[Semats] C
OUTER APPLY(SELECT TOP(1) AU.[FullName] FROM [dbo].[AspNetUsers] AU WHERE TRY_CONVERT(BIGINT,AU.[Semat])=C.[ID] AND ISNULL(AU.[IsDelete],0)=0 AND ISNULL(AU.[IsActive],1)=1) U
WHERE C.[PID]=204
ORDER BY C.[OnvanSemat];
GO
