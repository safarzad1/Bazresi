USE [DBBazresi];
GO

/*
  اصلاح گردش اولیه پیشنهاد انتصاب
  قانون: هر پیشنهاد انتصاب ابتدا باید به رئیس دفتر بازرسی با کد پست 204 ارسال شود.
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


/* اصلاح درخواست موجود نمونه: EntesabId = 1289 */
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @EntesabId BIGINT = 1289;
    DECLARE @HeadInspectionPostId BIGINT = 204;
    DECLARE @FromPostId BIGINT;
    DECLARE @CreateUserId NVARCHAR(450);

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Semats] WHERE [ID]=@HeadInspectionPostId)
        THROW 51401, N'پست رئیس دفتر بازرسی با کد 204 در جدول dbo.Semats پیدا نشد.', 1;

    SELECT
        @FromPostId = TRY_CONVERT(BIGINT,E.[PostSender]),
        @CreateUserId = COALESCE(E.[CreateUserId],N'system-routing-fix')
    FROM [bz].[Entesabat] E WITH (UPDLOCK,HOLDLOCK)
    WHERE E.[EntesabId]=@EntesabId
      AND ISNULL(E.[IsDelete],0)=0
      AND E.[RecordState]=2;

    IF @FromPostId IS NULL
        THROW 51402, N'درخواست 1289 پیدا نشد، در وضعیت پیشنهاد انتصاب نیست، یا PostSender معتبر ندارد.', 1;

    /* ارجاع اولیه اشتباه قبلی بسته شود. */
    UPDATE R
       SET R.[StatusCode]=4,
           R.[IsRecalled]=1,
           R.[RecallUserId]=N'system-routing-fix',
           R.[RecallDateTime]=SYSDATETIME()
    FROM [bz].[AppointmentWorkflowReferrals] R
    WHERE R.[EntesabId]=@EntesabId
      AND R.[ParentReferralId] IS NULL
      AND R.[ReferralKind]=1
      AND R.[ToPostId]<>@HeadInspectionPostId
      AND R.[StatusCode] IN(1,2)
      AND R.[IsRecalled]=0;

    /* مقصد اصلی رکورد نیز 204 شود. */
    UPDATE [bz].[Entesabat]
       SET [PostDelivered]=CONVERT(NVARCHAR(50),@HeadInspectionPostId),
           [WorkflowDestinationPostId]=@HeadInspectionPostId,
           [IsRead]=0,
           [ReadTime]=NULL,
           [WhoRead]=NULL
    WHERE [EntesabId]=@EntesabId;

    /* ارجاع فعال به رئیس دفتر ساخته شود؛ این بخش برای نمایش کارتابل و CanDecide ضروری است. */
    IF NOT EXISTS
    (
        SELECT 1
        FROM [bz].[AppointmentWorkflowReferrals] R
        WHERE R.[EntesabId]=@EntesabId
          AND R.[ToPostId]=@HeadInspectionPostId
          AND R.[StatusCode] IN(1,2)
          AND R.[IsRecalled]=0
          AND R.[ReceiverArchived]=0
    )
    BEGIN
        INSERT [bz].[AppointmentWorkflowReferrals]
        (
            [EntesabId],[ParentReferralId],[ReferralKind],[FromPostId],[ToPostId],[Note],
            [StatusCode],[IsRead],[SenderArchived],[ReceiverArchived],[CreateUserId]
        )
        VALUES
        (
            @EntesabId,NULL,1,@FromPostId,@HeadInspectionPostId,
            N'ارجاع اولیه پیشنهاد انتصاب - اصلاح مقصد به رئیس دفتر بازرسی',
            1,0,0,0,@CreateUserId
        );
    END;

    IF OBJECT_ID(N'bz.AppointmentWorkflowHistory',N'U') IS NOT NULL
    BEGIN
        INSERT [bz].[AppointmentWorkflowHistory]
        ([EntesabId],[ActionCode],[ActionTitle],[FromState],[ToState],[Note],[ActorUserId],[ActorPostId],[FromPostId],[ToPostId])
        VALUES
        (@EntesabId,8,N'اصلاح مقصد ارجاع اولیه',2,2,N'انتقال درخواست به رئیس دفتر بازرسی (پست 204)',N'system-routing-fix',@FromPostId,@FromPostId,@HeadInspectionPostId);
    END;

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK;
    THROW;
END CATCH;
GO

/* کنترل نهایی */
SELECT [EntesabId],[PostSender],[PostDelivered],[WorkflowDestinationPostId],[RecordState],[RecordState_NameFarsi],[IsRead]
FROM [bz].[Entesabat]
WHERE [EntesabId]=1289;

SELECT [ReferralId],[EntesabId],[FromPostId],[ToPostId],[StatusCode],[IsRead],[IsRecalled],[ReceiverArchived],[Note],[CreateDateTime]
FROM [bz].[AppointmentWorkflowReferrals]
WHERE [EntesabId]=1289
ORDER BY [ReferralId];

SELECT [Id],[UserName],[FullName],[Semat],[IsActive],[IsDelete]
FROM [dbo].[AspNetUsers]
WHERE TRY_CONVERT(BIGINT,[Semat])=204;
GO
