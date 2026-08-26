USE [DBBazresi];
GO

IF SCHEMA_ID(N'bz') IS NULL EXEC(N'CREATE SCHEMA [bz]');
GO

IF OBJECT_ID(N'[bz].[DoreAmozeshi]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[DoreAmozeshi]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL,
        [PersonId] BIGINT NOT NULL,
        [NameDore] NVARCHAR(250) NOT NULL,
        [ModatSaat] INT NOT NULL,
        [NameMarkazMahalAmozesh] NVARCHAR(300) NOT NULL,
        [NoeMadrak] INT NOT NULL,
        [TarikhAkhzMadrak] NVARCHAR(25) NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NULL,
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL,
        CONSTRAINT [PK_DoreAmozeshi] PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[bz].[DoreAmozeshi]')
      AND name = N'IX_DoreAmozeshi_PersonId'
)
BEGIN
    CREATE INDEX [IX_DoreAmozeshi_PersonId]
        ON [bz].[DoreAmozeshi]([PersonId]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_DoreAmozeshiAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        A.[ID],
        A.[PersonId],
        A.[NameDore],
        A.[ModatSaat],
        A.[NameMarkazMahalAmozesh],
        A.[NoeMadrak],
        D.[NameFarsi] AS [NoeMadrakName],
        A.[TarikhAkhzMadrak],
        A.[CreateUserId],
        A.[CreateDateTime],
        A.[EditUserId],
        A.[EditDateTime]
    FROM [bz].[DoreAmozeshi] AS A
    LEFT JOIN [bz].[DFN] AS D
      ON D.[PID] = 10115
     AND TRY_CONVERT(INT, D.[Value]) = A.[NoeMadrak]
    WHERE A.[PersonId] = @PersonId
    ORDER BY A.[ID] DESC;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_DoreAmozeshiAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @NameDore NVARCHAR(250),
    @ModatSaat INT,
    @NameMarkazMahalAmozesh NVARCHAR(300),
    @NoeMadrak INT,
    @TarikhAkhzMadrak NVARCHAR(25) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NameDore = NULLIF(LTRIM(RTRIM(@NameDore)), N'');
    SET @NameMarkazMahalAmozesh = NULLIF(LTRIM(RTRIM(@NameMarkazMahalAmozesh)), N'');
    SET @TarikhAkhzMadrak = NULLIF(LTRIM(RTRIM(@TarikhAkhzMadrak)), N'');
    SET @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF NOT EXISTS
    (
        SELECT 1
        FROM [bz].[Person]
        WHERE [PersonId] = @PersonId
          AND ISNULL([IsDelete], 0) = 0
    )
        THROW 51000, N'شخص موردنظر پیدا نشد.', 1;

    IF @NameDore IS NULL
        THROW 51000, N'نام دوره را وارد کنید.', 1;

    IF ISNULL(@ModatSaat, 0) <= 0
        THROW 51000, N'مدت دوره به ساعت باید بیشتر از صفر باشد.', 1;

    IF @NameMarkazMahalAmozesh IS NULL
        THROW 51000, N'نام مرکز و محل آموزش را وارد کنید.', 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [bz].[DFN]
        WHERE [PID] = 10115
          AND TRY_CONVERT(INT, [Value]) = @NoeMadrak
    )
        THROW 51000, N'نوع مدرک انتخاب‌شده معتبر نیست.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[DoreAmozeshi]
        (
            [PersonId], [NameDore], [ModatSaat],
            [NameMarkazMahalAmozesh], [NoeMadrak], [TarikhAkhzMadrak],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @PersonId, @NameDore, @ModatSaat,
            @NameMarkazMahalAmozesh, @NoeMadrak, @TarikhAkhzMadrak,
            @ActorUserId, [dbo].[FarsiDateTimeNow]()
        );

        SET @ID = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [bz].[DoreAmozeshi]
        SET [NameDore] = @NameDore,
            [ModatSaat] = @ModatSaat,
            [NameMarkazMahalAmozesh] = @NameMarkazMahalAmozesh,
            [NoeMadrak] = @NoeMadrak,
            [TarikhAkhzMadrak] = @TarikhAkhzMadrak,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID
          AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'دوره آموزشی موردنظر پیدا نشد.', 1;
    END;

    EXEC [bz].[SP_DoreAmozeshiAdmin_List] @PersonId = @PersonId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_DoreAmozeshiAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM [bz].[DoreAmozeshi]
    WHERE [ID] = @ID
      AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'دوره آموزشی موردنظر پیدا نشد.', 1;
END;
GO

SELECT TOP (1000)
    [ID], [PersonId], [NameDore], [ModatSaat],
    [NameMarkazMahalAmozesh], [NoeMadrak], [TarikhAkhzMadrak],
    [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
FROM [bz].[DoreAmozeshi]
ORDER BY [ID] DESC;
GO
