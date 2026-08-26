USE [DBBazresi];
GO

IF SCHEMA_ID(N'bz') IS NULL EXEC(N'CREATE SCHEMA [bz]');
GO

IF OBJECT_ID(N'[bz].[SabegheFaliyatEjtemai]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[SabegheFaliyatEjtemai]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [PersonId] BIGINT NOT NULL,
        [NameNahadTashakolHezb] NVARCHAR(250) NOT NULL,
        [Mahal] INT NOT NULL,
        [AzTarikh] NVARCHAR(25) NULL,
        [TaTarikh] NVARCHAR(25) NULL,
        [Molahazat] NVARCHAR(1000) NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NULL,
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL,
        CONSTRAINT [PK_SabegheFaliyatEjtemai] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[bz].[SabegheFaliyatEjtemai]')
      AND name = N'IX_SabegheFaliyatEjtemai_PersonId'
)
BEGIN
    CREATE INDEX [IX_SabegheFaliyatEjtemai_PersonId]
        ON [bz].[SabegheFaliyatEjtemai]([PersonId]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheFaliyatEjtemaiAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[NameNahadTashakolHezb],
        S.[Mahal],
        COALESCE(
            NULLIF(LTRIM(RTRIM(C.[FullName])), N''),
            NULLIF(LTRIM(RTRIM(C.[Name])), N''),
            CONVERT(NVARCHAR(20), S.[Mahal])
        ) AS [MahalName],
        S.[AzTarikh],
        S.[TaTarikh],
        S.[Molahazat],
        S.[CreateUserId],
        S.[CreateDateTime],
        S.[EditUserId],
        S.[EditDateTime]
    FROM [bz].[SabegheFaliyatEjtemai] AS S
    LEFT JOIN [bz].[Citys] AS C ON C.[CityId] = S.[Mahal]
    WHERE S.[PersonId] = @PersonId
    ORDER BY S.[ID] DESC;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheFaliyatEjtemaiAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @NameNahadTashakolHezb NVARCHAR(250),
    @Mahal INT,
    @AzTarikh NVARCHAR(25) = NULL,
    @TaTarikh NVARCHAR(25) = NULL,
    @Molahazat NVARCHAR(1000) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NameNahadTashakolHezb = NULLIF(LTRIM(RTRIM(@NameNahadTashakolHezb)), N'');
    SET @AzTarikh = NULLIF(LTRIM(RTRIM(@AzTarikh)), N'');
    SET @TaTarikh = NULLIF(LTRIM(RTRIM(@TaTarikh)), N'');
    SET @Molahazat = NULLIF(LTRIM(RTRIM(@Molahazat)), N'');

    IF NOT EXISTS
    (
        SELECT 1 FROM [bz].[Person]
        WHERE [PersonId] = @PersonId AND ISNULL([IsDelete], 0) = 0
    )
        THROW 51000, N'شخص موردنظر پیدا نشد.', 1;

    IF @NameNahadTashakolHezb IS NULL
        THROW 51000, N'نام نهاد، تشکل یا حزب را وارد کنید.', 1;

    IF @Mahal IS NULL OR @Mahal <= 0 OR NOT EXISTS
    (
        SELECT 1 FROM [bz].[Citys] WHERE [CityId] = @Mahal
    )
        THROW 51000, N'محل فعالیت انتخاب‌شده معتبر نیست.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[SabegheFaliyatEjtemai]
        (
            [PersonId], [NameNahadTashakolHezb], [Mahal],
            [AzTarikh], [TaTarikh], [Molahazat],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @PersonId, @NameNahadTashakolHezb, @Mahal,
            @AzTarikh, @TaTarikh, @Molahazat,
            @ActorUserId, [dbo].[FarsiDateTimeNow]()
        );

        SET @ID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE [bz].[SabegheFaliyatEjtemai]
        SET [NameNahadTashakolHezb] = @NameNahadTashakolHezb,
            [Mahal] = @Mahal,
            [AzTarikh] = @AzTarikh,
            [TaTarikh] = @TaTarikh,
            [Molahazat] = @Molahazat,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'سابقه فعالیت اجتماعی موردنظر پیدا نشد.', 1;
    END;

    EXEC [bz].[SP_SabegheFaliyatEjtemaiAdmin_List] @PersonId = @PersonId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheFaliyatEjtemaiAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM [bz].[SabegheFaliyatEjtemai]
    WHERE [ID] = @ID AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'سابقه فعالیت اجتماعی موردنظر پیدا نشد.', 1;
END;
GO

SELECT TOP (1000)
    [ID], [PersonId], [NameNahadTashakolHezb], [Mahal],
    [AzTarikh], [TaTarikh], [Molahazat],
    [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
FROM [bz].[SabegheFaliyatEjtemai]
ORDER BY [ID] DESC;
GO
