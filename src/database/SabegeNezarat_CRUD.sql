USE [DBBazresi];
GO

IF SCHEMA_ID(N'bz') IS NULL EXEC(N'CREATE SCHEMA [bz]');
GO

/*
  سوابق نظارتی و اجرایی انتخابات
  ساختار نهایی محل: فقط یک فیلد Mahal که همان CityId انتخاب‌شده است.
  اگر نسخه قبلی جدول دارای OstanCityId/ShahrestanCityId باشد،
  مقدار شهرستان به Mahal منتقل و سپس دو ستون قدیمی حذف می‌شوند.
*/
IF OBJECT_ID(N'[bz].[SabegeNezarat]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[SabegeNezarat]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [PersonId] BIGINT NOT NULL,
        [DoreEntekhabat] NVARCHAR(150) NOT NULL,
        [SematEntekhabat] NVARCHAR(150) NOT NULL,
        [Mahal] INT NOT NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NULL,
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL,
        CONSTRAINT [PK_SabegeNezarat] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END
ELSE
BEGIN
    IF COL_LENGTH(N'bz.SabegeNezarat', N'Mahal') IS NULL
        ALTER TABLE [bz].[SabegeNezarat] ADD [Mahal] INT NULL;

    /* انتقال داده نسخه قبلی: اولویت با شهرستان است */
    IF COL_LENGTH(N'bz.SabegeNezarat', N'ShahrestanCityId') IS NOT NULL
        EXEC(N'UPDATE [bz].[SabegeNezarat]
               SET [Mahal] = [ShahrestanCityId]
               WHERE [Mahal] IS NULL AND [ShahrestanCityId] IS NOT NULL;');

    IF COL_LENGTH(N'bz.SabegeNezarat', N'OstanCityId') IS NOT NULL
        EXEC(N'UPDATE [bz].[SabegeNezarat]
               SET [Mahal] = [OstanCityId]
               WHERE [Mahal] IS NULL AND [OstanCityId] IS NOT NULL;');

    /* رکورد ناقص قدیمی مانع تغییر NOT NULL نشود؛ در صورت وجود باید اصلاح دستی شود. */
    IF EXISTS (SELECT 1 FROM [bz].[SabegeNezarat] WHERE [Mahal] IS NULL)
        THROW 51000, N'در SabegeNezarat رکورد قدیمی بدون محل وجود دارد. ابتدا مقدار Mahal آن رکوردها را مشخص کنید.', 1;

    ALTER TABLE [bz].[SabegeNezarat] ALTER COLUMN [Mahal] INT NOT NULL;

    IF COL_LENGTH(N'bz.SabegeNezarat', N'OstanCityId') IS NOT NULL
        ALTER TABLE [bz].[SabegeNezarat] DROP COLUMN [OstanCityId];

    IF COL_LENGTH(N'bz.SabegeNezarat', N'ShahrestanCityId') IS NOT NULL
        ALTER TABLE [bz].[SabegeNezarat] DROP COLUMN [ShahrestanCityId];
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[bz].[SabegeNezarat]')
      AND name = N'IX_SabegeNezarat_PersonId'
)
BEGIN
    CREATE INDEX [IX_SabegeNezarat_PersonId]
        ON [bz].[SabegeNezarat]([PersonId]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegeNezaratAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[DoreEntekhabat],
        S.[SematEntekhabat],
        S.[Mahal],
        COALESCE(
            NULLIF(LTRIM(RTRIM(C.[FullName])), N''),
            NULLIF(LTRIM(RTRIM(C.[Name])), N''),
            CONVERT(NVARCHAR(20), S.[Mahal])
        ) AS [MahalName],
        S.[CreateUserId],
        S.[CreateDateTime],
        S.[EditUserId],
        S.[EditDateTime]
    FROM [bz].[SabegeNezarat] AS S
    LEFT JOIN [bz].[Citys] AS C ON C.[CityId] = S.[Mahal]
    WHERE S.[PersonId] = @PersonId
    ORDER BY S.[ID] DESC;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegeNezaratAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @DoreEntekhabat NVARCHAR(150),
    @SematEntekhabat NVARCHAR(150),
    @Mahal INT,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @DoreEntekhabat = NULLIF(LTRIM(RTRIM(@DoreEntekhabat)), N'');
    SET @SematEntekhabat = NULLIF(LTRIM(RTRIM(@SematEntekhabat)), N'');

    IF NOT EXISTS
    (
        SELECT 1 FROM [bz].[Person]
        WHERE [PersonId] = @PersonId AND ISNULL([IsDelete], 0) = 0
    )
        THROW 51000, N'شخص موردنظر پیدا نشد.', 1;

    IF @DoreEntekhabat IS NULL
        THROW 51000, N'دوره انتخاباتی را وارد کنید.', 1;

    IF @SematEntekhabat IS NULL
        THROW 51000, N'سمت انتخاباتی را وارد کنید.', 1;

    IF @Mahal IS NULL OR @Mahal <= 0 OR NOT EXISTS
    (
        SELECT 1 FROM [bz].[Citys] WHERE [CityId] = @Mahal
    )
        THROW 51000, N'محل انتخاب‌شده معتبر نیست.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[SabegeNezarat]
        (
            [PersonId], [DoreEntekhabat], [SematEntekhabat], [Mahal],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @PersonId, @DoreEntekhabat, @SematEntekhabat, @Mahal,
            @ActorUserId, [dbo].[FarsiDateTimeNow]()
        );

        SET @ID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE [bz].[SabegeNezarat]
        SET [DoreEntekhabat] = @DoreEntekhabat,
            [SematEntekhabat] = @SematEntekhabat,
            [Mahal] = @Mahal,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'سابقه نظارتی موردنظر پیدا نشد.', 1;
    END;

    EXEC [bz].[SP_SabegeNezaratAdmin_List] @PersonId = @PersonId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegeNezaratAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM [bz].[SabegeNezarat]
    WHERE [ID] = @ID AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'سابقه نظارتی موردنظر پیدا نشد.', 1;
END;
GO

/* Procedure قدیمی Lookup دیگر لازم نیست؛ محل از همان City dropdown عمومی UI تأمین می‌شود. */
IF OBJECT_ID(N'[bz].[SP_SabegeNezaratAdmin_Lookups]', N'P') IS NOT NULL
    DROP PROCEDURE [bz].[SP_SabegeNezaratAdmin_Lookups];
GO

SELECT TOP (1000)
    [ID], [PersonId], [DoreEntekhabat], [SematEntekhabat], [Mahal],
    [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
FROM [bz].[SabegeNezarat]
ORDER BY [ID] DESC;
GO
