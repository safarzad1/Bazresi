USE [DBBazresi];
GO

/*
    پیشنهاد لغو ابلاغ
    - تکمیل خودکار مشخصات از انتصاب جاری و اطلاعات شخص
    - ثبت دلایل به‌صورت ردیف‌های مستقل
    - نگهداری تصویر نهایی فرم به‌صورت SVG خودکفا
    - عدم تغییر وضعیت انتصاب تا زمان فرایند تأیید نهایی
*/

IF COL_LENGTH(N'bz.LaghveEblagh', N'EntesabId') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [EntesabId] BIGINT NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'RequestingPostId') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [RequestingPostId] BIGINT NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'RequesterFullName') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [RequesterFullName] NVARCHAR(150) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'RequesterPostTitle') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [RequesterPostTitle] NVARCHAR(250) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'SignaturePath') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [SignaturePath] NVARCHAR(500) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'DocumentSvg') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [DocumentSvg] NVARCHAR(MAX) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'DocumentHash') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [DocumentHash] NVARCHAR(64) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh', N'RegisteredAt') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [RegisteredAt] DATETIME2(0) NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh_Ellat', N'LaghveEblaghId') IS NULL
    ALTER TABLE [bz].[LaghveEblagh_Ellat] ADD [LaghveEblaghId] BIGINT NULL;
GO

IF COL_LENGTH(N'bz.LaghveEblagh_Ellat', N'SortOrder') IS NULL
    ALTER TABLE [bz].[LaghveEblagh_Ellat] ADD [SortOrder] TINYINT NULL;
GO

IF OBJECT_ID(N'bz.CancellationFormSettings', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[CancellationFormSettings]
    (
        [ID] TINYINT NOT NULL,
        [TitleFont] NVARCHAR(50) NOT NULL,
        [TitleFontSize] DECIMAL(5,2) NOT NULL,
        [RecipientFont] NVARCHAR(50) NOT NULL,
        [RecipientFontSize] DECIMAL(5,2) NOT NULL,
        [SignerFont] NVARCHAR(50) NOT NULL,
        [SignerFontSize] DECIMAL(5,2) NOT NULL,
        [BodyFont] NVARCHAR(50) NOT NULL,
        [BodyFontSize] DECIMAL(5,2) NOT NULL,
        [BodyLineHeight] DECIMAL(5,2) NOT NULL,
        [ReasonsFont] NVARCHAR(50) NOT NULL,
        [ReasonsFontSize] DECIMAL(5,2) NOT NULL,
        [ReasonsLineHeight] DECIMAL(5,2) NOT NULL,
        [ReasonsRowHeight] DECIMAL(6,2) NOT NULL,
        [CopyFont] NVARCHAR(50) NOT NULL,
        [CopyFontSize] DECIMAL(5,2) NOT NULL,
        [UpdatedByUserId] NVARCHAR(450) NULL,
        [UpdatedAt] DATETIME2(0) NULL,
        CONSTRAINT [PK_CancellationFormSettings] PRIMARY KEY ([ID]),
        CONSTRAINT [CK_CancellationFormSettings_OneRow] CHECK ([ID] = 1)
    );
END;
GO

IF COL_LENGTH(N'bz.CancellationFormSettings', N'TitleFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [TitleFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_TitleFontWeight] DEFAULT (400);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'RecipientFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [RecipientFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_RecipientFontWeight] DEFAULT (700);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'SignerFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [SignerFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_SignerFontWeight] DEFAULT (400);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'BodyFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [BodyFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_BodyFontWeight] DEFAULT (400);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'ReasonsTitleFont') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [ReasonsTitleFont] NVARCHAR(50) NOT NULL CONSTRAINT [DF_CancellationFormSettings_ReasonsTitleFont] DEFAULT (N'titr');
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'ReasonsTitleFontSize') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [ReasonsTitleFontSize] DECIMAL(5,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_ReasonsTitleFontSize] DEFAULT (14);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'ReasonsTitleFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [ReasonsTitleFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_ReasonsTitleFontWeight] DEFAULT (400);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'ReasonsFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [ReasonsFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_ReasonsFontWeight] DEFAULT (400);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'CopyFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [CopyFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_CopyFontWeight] DEFAULT (700);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'DataFont') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [DataFont] NVARCHAR(50) NOT NULL CONSTRAINT [DF_CancellationFormSettings_DataFont] DEFAULT (N'MitraBold');
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'DataFontSize') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [DataFontSize] DECIMAL(5,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_DataFontSize] DEFAULT (14);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'DataFontWeight') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [DataFontWeight] SMALLINT NOT NULL CONSTRAINT [DF_CancellationFormSettings_DataFontWeight] DEFAULT (700);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'TitleBottomSpacing') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [TitleBottomSpacing] DECIMAL(6,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_TitleBottomSpacing] DEFAULT (18);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'RecipientBottomSpacing') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [RecipientBottomSpacing] DECIMAL(6,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_RecipientBottomSpacing] DEFAULT (24);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'BodyFirstLineIndent') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [BodyFirstLineIndent] DECIMAL(6,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_BodyFirstLineIndent] DEFAULT (24);
GO
IF COL_LENGTH(N'bz.CancellationFormSettings', N'ReasonsTitleTopSpacing') IS NULL
    ALTER TABLE [bz].[CancellationFormSettings] ADD [ReasonsTitleTopSpacing] DECIMAL(6,2) NOT NULL CONSTRAINT [DF_CancellationFormSettings_ReasonsTitleTopSpacing] DEFAULT (20);
GO

IF NOT EXISTS (SELECT 1 FROM [bz].[CancellationFormSettings] WHERE [ID] = 1)
BEGIN
    INSERT INTO [bz].[CancellationFormSettings]
    (
        [ID], [TitleFont], [TitleFontSize], [RecipientFont], [RecipientFontSize],
        [SignerFont], [SignerFontSize], [BodyFont], [BodyFontSize], [BodyLineHeight],
        [ReasonsFont], [ReasonsFontSize], [ReasonsLineHeight], [ReasonsRowHeight],
        [CopyFont], [CopyFontSize], [UpdatedAt]
    )
    VALUES
    (
        1, N'IranNastaliq', 20, N'titr', 20,
        N'titr', 14, N'MitraBold', 14, 2.20,
        N'MitraBold', 14, 1.65, 38,
        N'bnaznin', 16, GETDATE()
    );
END;
GO

UPDATE [bz].[CancellationFormSettings]
SET [TitleFont] = N'IranNastaliq',
    [TitleFontSize] = 20,
    [RecipientFont] = N'titr',
    [RecipientFontSize] = 20,
    [TitleFontWeight] = 400,
    [RecipientFontWeight] = 700,
    [SignerFont] = N'titr',
    [SignerFontSize] = 14,
    [SignerFontWeight] = 400,
    [BodyFont] = N'MitraBold',
    [BodyFontSize] = 14,
    [BodyFontWeight] = 400,
    [BodyLineHeight] = 2.40,
    [DataFont] = N'MitraBold',
    [DataFontSize] = 14,
    [DataFontWeight] = 700,
    [TitleBottomSpacing] = 18,
    [RecipientBottomSpacing] = 24,
    [BodyFirstLineIndent] = 24,
    [ReasonsTitleTopSpacing] = 20,
    [ReasonsTitleFont] = N'titr',
    [ReasonsTitleFontSize] = 18,
    [ReasonsTitleFontWeight] = 400,
    [ReasonsFont] = N'MitraBold',
    [ReasonsFontSize] = 14,
    [ReasonsFontWeight] = 400,
    [CopyFont] = N'MitraBold',
    [CopyFontWeight] = 700,
    [UpdatedAt] = GETDATE()
WHERE [ID] = 1;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_LaghveEblagh_Entesabat'
      AND [parent_object_id] = OBJECT_ID(N'bz.LaghveEblagh')
)
BEGIN
    ALTER TABLE [bz].[LaghveEblagh] WITH NOCHECK
        ADD CONSTRAINT [FK_LaghveEblagh_Entesabat]
        FOREIGN KEY ([EntesabId]) REFERENCES [bz].[Entesabat]([EntesabId]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CancellationFormSettings_Get]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1)
        [TitleFont], [TitleFontSize], [TitleFontWeight],
        [RecipientFont], [RecipientFontSize], [RecipientFontWeight],
        [SignerFont], [SignerFontSize], [SignerFontWeight],
        [BodyFont], [BodyFontSize], [BodyFontWeight], [BodyLineHeight],
        [DataFont], [DataFontSize], [DataFontWeight],
        [TitleBottomSpacing], [RecipientBottomSpacing], [BodyFirstLineIndent], [ReasonsTitleTopSpacing],
        [ReasonsTitleFont], [ReasonsTitleFontSize], [ReasonsTitleFontWeight],
        [ReasonsFont], [ReasonsFontSize], [ReasonsFontWeight], [ReasonsLineHeight], [ReasonsRowHeight],
        [CopyFont], [CopyFontSize], [CopyFontWeight]
    FROM [bz].[CancellationFormSettings]
    WHERE [ID] = 1;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CancellationFormSettings_Save]
    @ActorUserId NVARCHAR(450),
    @TitleFont NVARCHAR(50),
    @TitleFontSize DECIMAL(5,2),
    @TitleFontWeight SMALLINT,
    @RecipientFont NVARCHAR(50),
    @RecipientFontSize DECIMAL(5,2),
    @RecipientFontWeight SMALLINT,
    @SignerFont NVARCHAR(50),
    @SignerFontSize DECIMAL(5,2),
    @SignerFontWeight SMALLINT,
    @BodyFont NVARCHAR(50),
    @BodyFontSize DECIMAL(5,2),
    @BodyFontWeight SMALLINT,
    @BodyLineHeight DECIMAL(5,2),
    @DataFont NVARCHAR(50),
    @DataFontSize DECIMAL(5,2),
    @DataFontWeight SMALLINT,
    @TitleBottomSpacing DECIMAL(6,2),
    @RecipientBottomSpacing DECIMAL(6,2),
    @BodyFirstLineIndent DECIMAL(6,2),
    @ReasonsTitleTopSpacing DECIMAL(6,2),
    @ReasonsTitleFont NVARCHAR(50),
    @ReasonsTitleFontSize DECIMAL(5,2),
    @ReasonsTitleFontWeight SMALLINT,
    @ReasonsFont NVARCHAR(50),
    @ReasonsFontSize DECIMAL(5,2),
    @ReasonsFontWeight SMALLINT,
    @ReasonsLineHeight DECIMAL(5,2),
    @ReasonsRowHeight DECIMAL(6,2),
    @CopyFont NVARCHAR(50),
    @CopyFontSize DECIMAL(5,2),
    @CopyFontWeight SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    IF @TitleFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @RecipientFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @SignerFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @BodyFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @DataFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @ReasonsTitleFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @ReasonsFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
       OR @CopyFont NOT IN (N'IranNastaliq', N'titr', N'MitraBold', N'bnaznin', N'PeydaFaNum_Regular', N'IRANSansXMedium', N'Shabnam')
        THROW 51121, N'فونت انتخاب‌شده معتبر نیست.', 1;

    IF @TitleFontSize NOT BETWEEN 18 AND 60
       OR @RecipientFontSize NOT BETWEEN 12 AND 40
       OR @SignerFontSize NOT BETWEEN 11 AND 36
       OR @BodyFontSize NOT BETWEEN 11 AND 30
       OR @DataFontSize NOT BETWEEN 10 AND 30
       OR @ReasonsTitleFontSize NOT BETWEEN 10 AND 28
       OR @ReasonsFontSize NOT BETWEEN 10 AND 28
       OR @CopyFontSize NOT BETWEEN 10 AND 28
       OR @BodyLineHeight NOT BETWEEN 1.20 AND 3.00
       OR @ReasonsLineHeight NOT BETWEEN 1.10 AND 3.00
       OR @ReasonsRowHeight NOT BETWEEN 24 AND 100
       OR @TitleBottomSpacing NOT BETWEEN 0 AND 100
       OR @RecipientBottomSpacing NOT BETWEEN 0 AND 100
       OR @BodyFirstLineIndent NOT BETWEEN 0 AND 100
       OR @ReasonsTitleTopSpacing NOT BETWEEN 0 AND 100
        THROW 51122, N'اندازه فونت یا فاصله خطوط خارج از محدوده مجاز است.', 1;

    IF @TitleFontWeight NOT IN (400, 700)
       OR @RecipientFontWeight NOT IN (400, 700)
       OR @SignerFontWeight NOT IN (400, 700)
       OR @BodyFontWeight NOT IN (400, 700)
       OR @DataFontWeight NOT IN (400, 700)
       OR @ReasonsTitleFontWeight NOT IN (400, 700)
       OR @ReasonsFontWeight NOT IN (400, 700)
       OR @CopyFontWeight NOT IN (400, 700)
        THROW 51123, N'وزن فونت فقط می‌تواند معمولی یا بولد باشد.', 1;

    UPDATE [bz].[CancellationFormSettings]
    SET [TitleFont] = @TitleFont,
        [TitleFontSize] = @TitleFontSize,
        [TitleFontWeight] = @TitleFontWeight,
        [RecipientFont] = @RecipientFont,
        [RecipientFontSize] = @RecipientFontSize,
        [RecipientFontWeight] = @RecipientFontWeight,
        [SignerFont] = @SignerFont,
        [SignerFontSize] = @SignerFontSize,
        [SignerFontWeight] = @SignerFontWeight,
        [BodyFont] = @BodyFont,
        [BodyFontSize] = @BodyFontSize,
        [BodyFontWeight] = @BodyFontWeight,
        [BodyLineHeight] = @BodyLineHeight,
        [DataFont] = @DataFont,
        [DataFontSize] = @DataFontSize,
        [DataFontWeight] = @DataFontWeight,
        [TitleBottomSpacing] = @TitleBottomSpacing,
        [RecipientBottomSpacing] = @RecipientBottomSpacing,
        [BodyFirstLineIndent] = @BodyFirstLineIndent,
        [ReasonsTitleTopSpacing] = @ReasonsTitleTopSpacing,
        [ReasonsTitleFont] = @ReasonsTitleFont,
        [ReasonsTitleFontSize] = @ReasonsTitleFontSize,
        [ReasonsTitleFontWeight] = @ReasonsTitleFontWeight,
        [ReasonsFont] = @ReasonsFont,
        [ReasonsFontSize] = @ReasonsFontSize,
        [ReasonsFontWeight] = @ReasonsFontWeight,
        [ReasonsLineHeight] = @ReasonsLineHeight,
        [ReasonsRowHeight] = @ReasonsRowHeight,
        [CopyFont] = @CopyFont,
        [CopyFontSize] = @CopyFontSize,
        [CopyFontWeight] = @CopyFontWeight,
        [UpdatedByUserId] = @ActorUserId,
        [UpdatedAt] = GETDATE()
    WHERE [ID] = 1;

    EXEC [bz].[SP_Appointments_CancellationFormSettings_Get];
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_LaghveEblaghEllat_LaghveEblagh'
      AND [parent_object_id] = OBJECT_ID(N'bz.LaghveEblagh_Ellat')
)
BEGIN
    ALTER TABLE [bz].[LaghveEblagh_Ellat] WITH NOCHECK
        ADD CONSTRAINT [FK_LaghveEblaghEllat_LaghveEblagh]
        FOREIGN KEY ([LaghveEblaghId]) REFERENCES [bz].[LaghveEblagh]([ID]);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_LaghveEblagh_EntesabId_RecordState'
      AND [object_id] = OBJECT_ID(N'bz.LaghveEblagh')
)
BEGIN
    CREATE INDEX [IX_LaghveEblagh_EntesabId_RecordState]
        ON [bz].[LaghveEblagh]([EntesabId], [RecordState]);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_LaghveEblaghEllat_Request'
      AND [object_id] = OBJECT_ID(N'bz.LaghveEblagh_Ellat')
)
BEGIN
    CREATE INDEX [IX_LaghveEblaghEllat_Request]
        ON [bz].[LaghveEblagh_Ellat]([LaghveEblaghId], [SortOrder]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CancellationDraft_Get]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActorPostId BIGINT;
    DECLARE @RequesterFullName NVARCHAR(150);
    DECLARE @RequesterPostTitle NVARCHAR(250);
    DECLARE @SignaturePath NVARCHAR(500);

    SELECT TOP (1)
        @ActorPostId = TRY_CONVERT(BIGINT, U.[Semat]),
        @RequesterFullName = U.[FullName],
        @RequesterPostTitle = S.[OnvanSemat]
    FROM [dbo].[AspNetUsers] AS U
    LEFT JOIN [dbo].[Semats] AS S ON S.[ID] = TRY_CONVERT(BIGINT, U.[Semat])
    WHERE U.[Id] = @ActorUserId
      AND ISNULL(U.[IsDelete], 0) = 0
      AND ISNULL(U.[IsActive], 1) = 1;

    SELECT TOP (1) @SignaturePath = SG.[PathFile]
    FROM [bz].[Signature] AS SG
    WHERE SG.[UserId] = @ActorUserId
    ORDER BY SG.[Id] DESC;

    IF @ActorPostId IS NULL
        THROW 51100, N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.', 1;

    SELECT ISNULL
    (
        (
            SELECT TOP (1)
                E.[EntesabId],
                E.[PersonId],
                E.[CodeMelli],
                E.[FirstName],
                E.[LastName],
                E.[FullName],
                E.[FatherName],
                E.[TarikhTavalod],
                ISNULL(P.[ShomareShenasnameh], N'') AS [ShomareShenasnameh],
                E.[PostId],
                COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]) AS [PostOnvan],
                E.[TarikhEblagh],
                E.[ModatEblagKhedmat],
                dbo.MiladiToShamsi
                (
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [TarikhPayan],
                DATEDIFF
                (
                    DAY,
                    CONVERT(DATE, GETDATE()),
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [DaysLeft],
                @ActorPostId AS [RequestingPostId],
                @RequesterFullName AS [RequesterFullName],
                @RequesterPostTitle AS [RequesterPostTitle],
                @SignaturePath AS [SignaturePath]
            FROM [bz].[Entesabat] AS E
            INNER JOIN [dbo].[Semats] AS S ON S.[ID] = E.[PostId]
            LEFT JOIN [bz].[Person] AS P ON P.[PersonId] = E.[PersonId]
            WHERE E.[EntesabId] = @EntesabId
              AND E.[RecordState] = 10
              AND E.[TaeedOrAdamTaeed] = 4
              AND ISNULL(E.[KartablOthePost], 0) = 0
              AND ISNULL(E.[IsDelete], 0) = 0
              AND ISNULL(E.[IsEblagh], 0) = 1
              AND DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh])) >= CONVERT(DATE, GETDATE())
              AND EXISTS
              (
                  SELECT 1
                  FROM [bz].[AppointmentPostAccess] AS A
                  WHERE A.[ActorPostId] = @ActorPostId
                    AND A.[TargetPostId] = E.[PostId]
                    AND A.[IsActive] = 1
              )
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM [bz].[LaghveEblagh] AS L
                  WHERE L.[EntesabId] = E.[EntesabId]
                    AND L.[RecordState] = 10
              )
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
        ),
        N'{}'
    ) AS [JsonResult];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CancellationProposal_Create]
    @ActorUserId NVARCHAR(450),
    @EntesabId BIGINT,
    @ReasonsJson NVARCHAR(MAX),
    @DocumentSvg NVARCHAR(MAX),
    @DocumentHash NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@ReasonsJson) <> 1
        THROW 51101, N'ساختار دلایل لغو ابلاغ معتبر نیست.', 1;

    IF NULLIF(LTRIM(RTRIM(ISNULL(@DocumentSvg, N''))), N'') IS NULL
        THROW 51102, N'تصویر فرم لغو ابلاغ تولید نشده است.', 1;

    DECLARE @ReasonCount INT =
    (
        SELECT COUNT(1)
        FROM OPENJSON(@ReasonsJson)
        WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(1500), [value]))), N'') IS NOT NULL
    );

    IF @ReasonCount < 1 OR @ReasonCount > 10
        THROW 51103, N'حداقل یک و حداکثر ده دلیل وارد کنید.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM OPENJSON(@ReasonsJson)
        WHERE LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), [value])))) > 220
    )
        THROW 51104, N'هر دلیل باید حداکثر ۲۲۰ نویسه باشد.', 1;

    DECLARE @ActorPostId BIGINT;
    DECLARE @RequesterFullName NVARCHAR(150);
    DECLARE @RequesterPostTitle NVARCHAR(250);
    DECLARE @SignaturePath NVARCHAR(500);

    SELECT TOP (1)
        @ActorPostId = TRY_CONVERT(BIGINT, U.[Semat]),
        @RequesterFullName = U.[FullName],
        @RequesterPostTitle = S.[OnvanSemat]
    FROM [dbo].[AspNetUsers] AS U
    LEFT JOIN [dbo].[Semats] AS S ON S.[ID] = TRY_CONVERT(BIGINT, U.[Semat])
    WHERE U.[Id] = @ActorUserId
      AND ISNULL(U.[IsDelete], 0) = 0
      AND ISNULL(U.[IsActive], 1) = 1;

    SELECT TOP (1) @SignaturePath = SG.[PathFile]
    FROM [bz].[Signature] AS SG
    WHERE SG.[UserId] = @ActorUserId
    ORDER BY SG.[Id] DESC;

    IF @ActorPostId IS NULL
        THROW 51105, N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.', 1;

    DECLARE
        @PersonId BIGINT,
        @CodeMelli NVARCHAR(10),
        @FirstName NVARCHAR(150),
        @LastName NVARCHAR(150),
        @FatherName NVARCHAR(150),
        @TarikhTavalod NVARCHAR(10),
        @ShomareShenasnameh NVARCHAR(20),
        @PostId BIGINT,
        @PostOnvan NVARCHAR(500),
        @TarikhEblagh NVARCHAR(20),
        @ModatEblagKhedmat INT,
        @TarikhPayan NVARCHAR(10),
        @NoeMasuliyat INT;

    SELECT TOP (1)
        @PersonId = E.[PersonId],
        @CodeMelli = E.[CodeMelli],
        @FirstName = E.[FirstName],
        @LastName = E.[LastName],
        @FatherName = E.[FatherName],
        @TarikhTavalod = E.[TarikhTavalod],
        @ShomareShenasnameh = ISNULL(P.[ShomareShenasnameh], N''),
        @PostId = E.[PostId],
        @PostOnvan = COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]),
        @TarikhEblagh = E.[TarikhEblagh],
        @ModatEblagKhedmat = E.[ModatEblagKhedmat],
        @TarikhPayan = dbo.MiladiToShamsi
        (
            DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
        ),
        @NoeMasuliyat = ISNULL(S.[TypeSemat], 0)
    FROM [bz].[Entesabat] AS E
    INNER JOIN [dbo].[Semats] AS S ON S.[ID] = E.[PostId]
    LEFT JOIN [bz].[Person] AS P ON P.[PersonId] = E.[PersonId]
    WHERE E.[EntesabId] = @EntesabId
      AND E.[RecordState] = 10
      AND E.[TaeedOrAdamTaeed] = 4
      AND ISNULL(E.[KartablOthePost], 0) = 0
      AND ISNULL(E.[IsDelete], 0) = 0
      AND ISNULL(E.[IsEblagh], 0) = 1
      AND DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh])) >= CONVERT(DATE, GETDATE())
      AND EXISTS
      (
          SELECT 1
          FROM [bz].[AppointmentPostAccess] AS A
          WHERE A.[ActorPostId] = @ActorPostId
            AND A.[TargetPostId] = E.[PostId]
            AND A.[IsActive] = 1
      );

    IF @PersonId IS NULL
        THROW 51106, N'ابلاغ جاری یا مجوز لغو آن پیدا نشد.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS
        (
            SELECT 1
            FROM [bz].[LaghveEblagh] WITH (UPDLOCK, HOLDLOCK)
            WHERE [EntesabId] = @EntesabId
              AND [RecordState] = 10
        )
            THROW 51107, N'برای این ابلاغ قبلاً پیشنهاد لغو ثبت شده است.', 1;

        INSERT INTO [bz].[LaghveEblagh]
        (
            [PersonId], [CodeMelli], [FirstName], [LastName], [FatherName],
            [TarikhTavalod], [ShomareShenasnameh], [Shoghl], [TarikhShoro],
            [Moddat], [NoeMasuliyat], [NoeMasuliyat_NameFarsi], [TarikhPayan],
            [Ellat], [Ellat_NameFarsi], [RecordState], [RecordState_NameFarsi],
            [CreateUserId], [CreateDateTime], [EntesabId], [RequestingPostId],
            [RequesterFullName], [RequesterPostTitle], [SignaturePath],
            [DocumentSvg], [DocumentHash], [RegisteredAt]
        )
        VALUES
        (
            @PersonId, @CodeMelli, @FirstName, @LastName, @FatherName,
            @TarikhTavalod, @ShomareShenasnameh, @PostOnvan, @TarikhEblagh,
            @ModatEblagKhedmat, @NoeMasuliyat, @PostOnvan, @TarikhPayan,
            1, N'لغو ابلاغ', 10, N'پیشنهاد لغو ابلاغ',
            @ActorUserId, CONVERT(NVARCHAR(19), GETDATE(), 120), @EntesabId, @ActorPostId,
            @RequesterFullName, @RequesterPostTitle, @SignaturePath,
            @DocumentSvg, @DocumentHash, GETDATE()
        );

        DECLARE @LaghveEblaghId BIGINT = SCOPE_IDENTITY();

        INSERT INTO [bz].[LaghveEblagh_Ellat]
        (
            [PersonId], [Dalayel], [CreateUserId], [CreateDateTime],
            [LaghveEblaghId], [SortOrder]
        )
        SELECT
            @PersonId,
            LTRIM(RTRIM(CONVERT(NVARCHAR(1500), [value]))),
            @ActorUserId,
            CONVERT(NVARCHAR(19), GETDATE(), 120),
            @LaghveEblaghId,
            CONVERT(TINYINT, CONVERT(INT, [key]) + 1)
        FROM OPENJSON(@ReasonsJson)
        WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(1500), [value]))), N'') IS NOT NULL
          AND TRY_CONVERT(INT, [key]) BETWEEN 0 AND 9;

        COMMIT TRANSACTION;

        SELECT
            @LaghveEblaghId AS [ProposalId],
            @DocumentHash AS [DocumentHash];
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CancellationDocument_Get]
    @ActorUserId NVARCHAR(450),
    @ProposalId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActorPostId BIGINT;
    SELECT TOP (1) @ActorPostId = TRY_CONVERT(BIGINT, U.[Semat])
    FROM [dbo].[AspNetUsers] AS U
    WHERE U.[Id] = @ActorUserId
      AND ISNULL(U.[IsDelete], 0) = 0
      AND ISNULL(U.[IsActive], 1) = 1;

    SELECT TOP (1)
        L.[ID] AS [ProposalId],
        L.[DocumentSvg],
        L.[DocumentHash],
        L.[FirstName],
        L.[LastName]
    FROM [bz].[LaghveEblagh] AS L
    INNER JOIN [bz].[Entesabat] AS E ON E.[EntesabId] = L.[EntesabId]
    WHERE L.[ID] = @ProposalId
      AND L.[DocumentSvg] IS NOT NULL
      AND
      (
          L.[CreateUserId] = @ActorUserId
          OR L.[RequestingPostId] = @ActorPostId
          OR EXISTS
          (
              SELECT 1
              FROM [bz].[AppointmentPostAccess] AS A
              WHERE A.[ActorPostId] = @ActorPostId
                AND A.[TargetPostId] = E.[PostId]
                AND A.[IsActive] = 1
          )
      );
END;
GO

/* به‌روزرسانی فهرست جاری برای مخفی‌شدن عملیات پس از ثبت پیشنهاد لغو */
CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CurrentByAccess]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActorPostId BIGINT;

    SELECT TOP (1) @ActorPostId = TRY_CONVERT(BIGINT, U.[Semat])
    FROM [dbo].[AspNetUsers] AS U
    WHERE U.[Id] = @ActorUserId
      AND ISNULL(U.[IsDelete], 0) = 0
      AND ISNULL(U.[IsActive], 1) = 1;

    IF @ActorPostId IS NULL
        THROW 51005, N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.', 1;

    SELECT ISNULL
    (
        (
            SELECT
                E.[EntesabId], E.[PersonId], E.[CodeMelli], E.[FirstName], E.[LastName], E.[FullName], E.[PostId],
                COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]) AS [PostOnvan],
                S.[PID] AS [ParentPostId], NULL AS [TreeLevel], S.[Mahal],
                E.[TarikhEblagh], E.[ModatEblagKhedmat],
                dbo.MiladiToShamsi
                (
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [TarikhLaghv],
                DATEDIFF
                (
                    DAY, CONVERT(DATE, GETDATE()),
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [DaysLeft],
                E.[RecordState], E.[RecordState_NameFarsi], E.[TaeedOrAdamTaeed],
                E.[TaeedOrAdamTaeedNameFarsi], E.[IsEblagh],
                CONVERT
                (
                    BIT,
                    CASE
                        WHEN E.[RecordState] = 10
                         AND E.[TaeedOrAdamTaeed] = 4
                         AND DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh])) >= CONVERT(DATE, GETDATE())
                         AND NOT EXISTS
                         (
                             SELECT 1
                             FROM [bz].[LaghveEblagh] AS L
                             WHERE L.[EntesabId] = E.[EntesabId]
                               AND L.[RecordState] = 10
                         )
                            THEN 1
                        ELSE 0
                    END
                ) AS [CanCancel],
                ISNULL
                (
                    (
                        SELECT
                            EM.[Id], EM.[OnvanSanad], EM.[CreateDateTime],
                            CASE
                                WHEN CHARINDEX(N'\', REVERSE(ISNULL(EM.[FileName], N''))) > 0
                                    THEN RIGHT(EM.[FileName], CHARINDEX(N'\', REVERSE(EM.[FileName])) - 1)
                                ELSE EM.[FileName]
                            END AS [FullFileName]
                        FROM [bz].[Entesabat_Madarek] AS EM
                        WHERE EM.[PersonId] = E.[PersonId]
                        ORDER BY EM.[CreateDateTime] DESC
                        FOR JSON PATH, INCLUDE_NULL_VALUES
                    ),
                    N'[]'
                ) AS [Madarek]
            FROM [bz].[Entesabat] AS E
            INNER JOIN [dbo].[Semats] AS S ON S.[ID] = E.[PostId]
            WHERE E.[RecordState] = 10
              AND E.[TaeedOrAdamTaeed] = 4
              AND ISNULL(E.[KartablOthePost], 0) = 0
              AND ISNULL(E.[IsDelete], 0) = 0
              AND ISNULL(E.[IsEblagh], 0) = 1
              AND EXISTS
              (
                  SELECT 1
                  FROM [bz].[AppointmentPostAccess] AS A
                  WHERE A.[ActorPostId] = @ActorPostId
                    AND A.[TargetPostId] = E.[PostId]
                    AND A.[IsActive] = 1
              )
            ORDER BY E.[PostId], E.[EntesabId]
            FOR JSON PATH, INCLUDE_NULL_VALUES
        ),
        N'[]'
    ) AS [JsonResult];
END;
GO
