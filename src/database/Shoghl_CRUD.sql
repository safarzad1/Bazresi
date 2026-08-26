USE [DBBazresi];
GO

/*
    CRUD کامل سوابق شغلی
    نکته: تمام تاریخ‌ها و تاریخ/ساعت‌ها NVARCHAR(25) هستند.
    تاریخ/ساعت سیستمی فقط با dbo.FarsiDateTimeNow() ثبت می‌شود.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* 1) یکسان‌سازی نوع ستون‌های تاریخ با استاندارد پروژه */
IF EXISTS
(
    SELECT 1
    FROM [bz].[Shoghl]
    WHERE LEN(ISNULL([AzTarikh], N'')) > 25
       OR LEN(ISNULL([TaTarikh], N'')) > 25
       OR LEN(ISNULL([CreateDateTime], N'')) > 25
       OR LEN(ISNULL([EditDateTime], N'')) > 25
)
    THROW 51000, N'در جدول Shoghl مقدار تاریخ/تاریخ‌وساعتی با طول بیشتر از 25 کاراکتر وجود دارد. ابتدا داده را اصلاح کنید.', 1;
GO

ALTER TABLE [bz].[Shoghl] ALTER COLUMN [AzTarikh] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [TaTarikh] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [CreateDateTime] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [EditDateTime] NVARCHAR(25) NULL;
GO

/* 2) فهرست سوابق شغلی یک شخص */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF ISNULL(@PersonId, 0) <= 0
        THROW 51000, N'شناسه شخص معتبر نیست.', 1;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[Vazeyat],
        S.[Vazeyat_NameFarsi],
        S.[VazeyatShoghl],
        S.[VazeyatShoghl_NameFarsi],
        S.[NoeSazman],
        S.[NoeSazman_NameFarsi],
        S.[SathSazmani],
        S.[SathSazmani_NameFarsi],
        S.[PostSazmani],
        S.[PostSazmani_NameFarsi],
        S.[NameShoghl],
        S.[OnvanMasoliat],
        S.[Semat],
        S.[Semat_NameFarsi],
        S.[AzTarikh],
        S.[TaTarikh],
        S.[Mahal],
        S.[Mahal_NameFarsi],
        S.[Neshani],
        S.[Tel],
        S.[Tozihat],
        S.[CreateUserId],
        S.[CreateDateTime],
        S.[EditUserId],
        S.[EditDateTime]
    FROM [bz].[Shoghl] AS S
    WHERE S.[PersonId] = @PersonId
    ORDER BY
        CASE WHEN NULLIF(LTRIM(RTRIM(S.[TaTarikh])), N'') IS NULL THEN 0 ELSE 1 END,
        S.[AzTarikh] DESC,
        S.[ID] DESC;
END;
GO

/* 3) دریافت یک سابقه شغلی */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Get]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[Vazeyat],
        S.[Vazeyat_NameFarsi],
        S.[VazeyatShoghl],
        S.[VazeyatShoghl_NameFarsi],
        S.[NoeSazman],
        S.[NoeSazman_NameFarsi],
        S.[SathSazmani],
        S.[SathSazmani_NameFarsi],
        S.[PostSazmani],
        S.[PostSazmani_NameFarsi],
        S.[NameShoghl],
        S.[OnvanMasoliat],
        S.[Semat],
        S.[Semat_NameFarsi],
        S.[AzTarikh],
        S.[TaTarikh],
        S.[Mahal],
        S.[Mahal_NameFarsi],
        S.[Neshani],
        S.[Tel],
        S.[Tozihat],
        S.[CreateUserId],
        S.[CreateDateTime],
        S.[EditUserId],
        S.[EditDateTime]
    FROM [bz].[Shoghl] AS S
    WHERE S.[ID] = @ID
      AND S.[PersonId] = @PersonId;
END;
GO

/* 4) Lookupهای فرم شغل */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Lookups]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CONVERT(INT, D.[PID]) AS [GroupCode],
        CONVERT(INT, D.[Value]) AS [Id],
        LTRIM(RTRIM(ISNULL(D.[NameFarsi], N''))) AS [Title]
    FROM [bz].[DFN] AS D
    WHERE D.[PID] IN (40401, 40402, 40403, 40404, 40405, 40406)
      AND D.[Value] IS NOT NULL
    ORDER BY D.[PID], D.[Value], D.[ID];

    SELECT
        C.[CityId] AS [Id],
        COALESCE(
            NULLIF(LTRIM(RTRIM(C.[FullName])), N''),
            NULLIF(LTRIM(RTRIM(C.[Name])), N''),
            CONVERT(NVARCHAR(20), C.[CityId])
        ) AS [Title]
    FROM [bz].[Citys] AS C
    WHERE LEN(CONVERT(VARCHAR(20), ABS(C.[CityId]))) = 5
    ORDER BY [Title], C.[CityId];
END;
GO

/* 5) Insert / Update */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @Vazeyat INT = NULL,
    @VazeyatShoghl INT = NULL,
    @NoeSazman INT = NULL,
    @SathSazmani INT = NULL,
    @PostSazmani INT = NULL,
    @NameShoghl NVARCHAR(100) = NULL,
    @OnvanMasoliat NVARCHAR(100) = NULL,
    @Semat INT = NULL,
    @AzTarikh NVARCHAR(25) = NULL,
    @TaTarikh NVARCHAR(25) = NULL,
    @Mahal INT = NULL,
    @Neshani NVARCHAR(2500) = NULL,
    @Tel NVARCHAR(200) = NULL,
    @Tozihat NVARCHAR(2500) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        @NameShoghl = NULLIF(LTRIM(RTRIM(@NameShoghl)), N''),
        @OnvanMasoliat = NULLIF(LTRIM(RTRIM(@OnvanMasoliat)), N''),
        @AzTarikh = NULLIF(LTRIM(RTRIM(@AzTarikh)), N''),
        @TaTarikh = NULLIF(LTRIM(RTRIM(@TaTarikh)), N''),
        @Neshani = NULLIF(LTRIM(RTRIM(@Neshani)), N''),
        @Tel = NULLIF(LTRIM(RTRIM(@Tel)), N''),
        @Tozihat = NULLIF(LTRIM(RTRIM(@Tozihat)), N''),
        @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF ISNULL(@PersonId, 0) <= 0
        THROW 51000, N'شناسه شخص معتبر نیست.', 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [bz].[Person] AS P
        WHERE P.[PersonId] = @PersonId
          AND ISNULL(P.[IsDelete], 0) = 0
    )
        THROW 51000, N'شخص موردنظر پیدا نشد.', 1;

    IF @ActorUserId IS NULL
        THROW 51000, N'شناسه کاربر ثبت‌کننده معتبر نیست.', 1;

    IF @NameShoghl IS NULL
        THROW 51000, N'نام شغل را وارد کنید.', 1;

    IF @AzTarikh IS NOT NULL AND @AzTarikh NOT LIKE N'[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]'
        THROW 51000, N'تاریخ شروع باید به شکل 1405/01/01 باشد.', 1;

    IF @TaTarikh IS NOT NULL AND @TaTarikh NOT LIKE N'[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]'
        THROW 51000, N'تاریخ پایان باید به شکل 1405/01/01 باشد.', 1;

    IF @AzTarikh IS NOT NULL AND @TaTarikh IS NOT NULL AND @TaTarikh < @AzTarikh
        THROW 51000, N'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.', 1;

    IF @Vazeyat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40401 AND [Value] = @Vazeyat)
        THROW 51000, N'وضعیت انتخاب‌شده معتبر نیست.', 1;
    IF @VazeyatShoghl IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40402 AND [Value] = @VazeyatShoghl)
        THROW 51000, N'وضعیت شغلی انتخاب‌شده معتبر نیست.', 1;
    IF @NoeSazman IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40403 AND [Value] = @NoeSazman)
        THROW 51000, N'نوع سازمان انتخاب‌شده معتبر نیست.', 1;
    IF @SathSazmani IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40404 AND [Value] = @SathSazmani)
        THROW 51000, N'سطح سازمانی انتخاب‌شده معتبر نیست.', 1;
    IF @PostSazmani IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40405 AND [Value] = @PostSazmani)
        THROW 51000, N'پست سازمانی انتخاب‌شده معتبر نیست.', 1;
    IF @Semat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[DFN] WHERE [PID] = 40406 AND [Value] = @Semat)
        THROW 51000, N'سمت انتخاب‌شده معتبر نیست.', 1;
    IF @Mahal IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [bz].[Citys] WHERE [CityId] = @Mahal)
        THROW 51000, N'محل خدمت انتخاب‌شده معتبر نیست.', 1;

    DECLARE
        @Vazeyat_NameFarsi NVARCHAR(50) = NULL,
        @VazeyatShoghl_NameFarsi NVARCHAR(50) = NULL,
        @NoeSazman_NameFarsi NVARCHAR(50) = NULL,
        @SathSazmani_NameFarsi NVARCHAR(50) = NULL,
        @PostSazmani_NameFarsi NVARCHAR(50) = NULL,
        @Semat_NameFarsi NVARCHAR(50) = NULL,
        @Mahal_NameFarsi NVARCHAR(50) = NULL;

    SELECT @Vazeyat_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40401 AND [Value] = @Vazeyat;
    SELECT @VazeyatShoghl_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40402 AND [Value] = @VazeyatShoghl;
    SELECT @NoeSazman_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40403 AND [Value] = @NoeSazman;
    SELECT @SathSazmani_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40404 AND [Value] = @SathSazmani;
    SELECT @PostSazmani_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40405 AND [Value] = @PostSazmani;
    SELECT @Semat_NameFarsi = LEFT([NameFarsi], 50) FROM [bz].[DFN] WHERE [PID] = 40406 AND [Value] = @Semat;
    SELECT @Mahal_NameFarsi = LEFT(COALESCE(NULLIF(LTRIM(RTRIM([FullName])), N''), [Name]), 50) FROM [bz].[Citys] WHERE [CityId] = @Mahal;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[Shoghl]
        (
            [PersonId],
            [Vazeyat], [Vazeyat_NameFarsi],
            [VazeyatShoghl], [VazeyatShoghl_NameFarsi],
            [NoeSazman], [NoeSazman_NameFarsi],
            [SathSazmani], [SathSazmani_NameFarsi],
            [PostSazmani], [PostSazmani_NameFarsi],
            [NameShoghl], [OnvanMasoliat],
            [Semat], [Semat_NameFarsi],
            [AzTarikh], [TaTarikh],
            [Mahal], [Mahal_NameFarsi],
            [Neshani], [Tel], [Tozihat],
            [CreateUserId], [CreateDateTime],
            [EditUserId], [EditDateTime]
        )
        VALUES
        (
            @PersonId,
            @Vazeyat, @Vazeyat_NameFarsi,
            @VazeyatShoghl, @VazeyatShoghl_NameFarsi,
            @NoeSazman, @NoeSazman_NameFarsi,
            @SathSazmani, @SathSazmani_NameFarsi,
            @PostSazmani, @PostSazmani_NameFarsi,
            @NameShoghl, @OnvanMasoliat,
            @Semat, @Semat_NameFarsi,
            @AzTarikh, @TaTarikh,
            @Mahal, @Mahal_NameFarsi,
            @Neshani, @Tel, @Tozihat,
            @ActorUserId, CONVERT(NVARCHAR(25), [dbo].[FarsiDateTimeNow]()),
            NULL, NULL
        );

        SET @ID = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE S
        SET
            S.[Vazeyat] = @Vazeyat,
            S.[Vazeyat_NameFarsi] = @Vazeyat_NameFarsi,
            S.[VazeyatShoghl] = @VazeyatShoghl,
            S.[VazeyatShoghl_NameFarsi] = @VazeyatShoghl_NameFarsi,
            S.[NoeSazman] = @NoeSazman,
            S.[NoeSazman_NameFarsi] = @NoeSazman_NameFarsi,
            S.[SathSazmani] = @SathSazmani,
            S.[SathSazmani_NameFarsi] = @SathSazmani_NameFarsi,
            S.[PostSazmani] = @PostSazmani,
            S.[PostSazmani_NameFarsi] = @PostSazmani_NameFarsi,
            S.[NameShoghl] = @NameShoghl,
            S.[OnvanMasoliat] = @OnvanMasoliat,
            S.[Semat] = @Semat,
            S.[Semat_NameFarsi] = @Semat_NameFarsi,
            S.[AzTarikh] = @AzTarikh,
            S.[TaTarikh] = @TaTarikh,
            S.[Mahal] = @Mahal,
            S.[Mahal_NameFarsi] = @Mahal_NameFarsi,
            S.[Neshani] = @Neshani,
            S.[Tel] = @Tel,
            S.[Tozihat] = @Tozihat,
            S.[EditUserId] = @ActorUserId,
            S.[EditDateTime] = CONVERT(NVARCHAR(25), [dbo].[FarsiDateTimeNow]())
        FROM [bz].[Shoghl] AS S
        WHERE S.[ID] = @ID
          AND S.[PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'سابقه شغلی موردنظر پیدا نشد.', 1;
    END;

    EXEC [bz].[SP_ShoghlAdmin_Get]
        @ID = @ID,
        @PersonId = @PersonId;
END;
GO

/* 6) Delete */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT,
    @ActorUserId NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- جدول Shoghl ستون IsDelete ندارد؛ حذف در این بخش Hard Delete است.
    DELETE FROM [bz].[Shoghl]
    WHERE [ID] = @ID
      AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'سابقه شغلی موردنظر پیدا نشد.', 1;

    SELECT @ID AS [ID], @PersonId AS [PersonId];
END;
GO
