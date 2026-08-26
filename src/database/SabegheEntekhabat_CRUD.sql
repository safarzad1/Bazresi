
USE [DBBazresi];
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'bz')
    EXEC(N'CREATE SCHEMA [bz]');
GO

IF OBJECT_ID(N'[bz].[SabegheEntekhabat]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[SabegheEntekhabat]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_SabegheEntekhabat] PRIMARY KEY,
        [PersonId] BIGINT NOT NULL,
        [NoeEntekhabat] NVARCHAR(150) NOT NULL,
        [HozeEntekhabieh] NVARCHAR(250) NOT NULL,
        [Natijeh] NVARCHAR(250) NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NOT NULL
            CONSTRAINT [DF_SabegheEntekhabat_CreateDateTime] DEFAULT ([dbo].[FarsiDateTimeNow]()),
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL
    );
END
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[bz].[SabegheEntekhabat]')
      AND name = N'IX_SabegheEntekhabat_PersonId'
)
BEGIN
    CREATE INDEX [IX_SabegheEntekhabat_PersonId]
        ON [bz].[SabegheEntekhabat]([PersonId]);
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheEntekhabatAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [ID],
        [PersonId],
        [NoeEntekhabat],
        [HozeEntekhabieh],
        [Natijeh],
        [CreateUserId],
        [CreateDateTime],
        [EditUserId],
        [EditDateTime]
    FROM [bz].[SabegheEntekhabat]
    WHERE [PersonId] = @PersonId
    ORDER BY [ID] DESC;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheEntekhabatAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @NoeEntekhabat NVARCHAR(150),
    @HozeEntekhabieh NVARCHAR(250),
    @Natijeh NVARCHAR(250) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NoeEntekhabat = NULLIF(LTRIM(RTRIM(@NoeEntekhabat)), N'');
    SET @HozeEntekhabieh = NULLIF(LTRIM(RTRIM(@HozeEntekhabieh)), N'');
    SET @Natijeh = NULLIF(LTRIM(RTRIM(@Natijeh)), N'');
    SET @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF @PersonId <= 0
        THROW 51000, N'شناسه شخص معتبر نیست.', 1;

    IF @NoeEntekhabat IS NULL
        THROW 51000, N'نوع انتخابات را وارد کنید.', 1;

    IF @HozeEntekhabieh IS NULL
        THROW 51000, N'حوزه انتخابیه را وارد کنید.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[SabegheEntekhabat]
        (
            [PersonId], [NoeEntekhabat], [HozeEntekhabieh], [Natijeh],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @PersonId, @NoeEntekhabat, @HozeEntekhabieh, @Natijeh,
            @ActorUserId, [dbo].[FarsiDateTimeNow]()
        );

        SET @ID = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [bz].[SabegheEntekhabat]
        SET
            [NoeEntekhabat] = @NoeEntekhabat,
            [HozeEntekhabieh] = @HozeEntekhabieh,
            [Natijeh] = @Natijeh,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID
          AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'سابقه داوطلبی موردنظر پیدا نشد.', 1;
    END;

    SELECT TOP (1)
        [ID], [PersonId], [NoeEntekhabat], [HozeEntekhabieh], [Natijeh],
        [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
    FROM [bz].[SabegheEntekhabat]
    WHERE [ID] = @ID AND [PersonId] = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_SabegheEntekhabatAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DELETE FROM [bz].[SabegheEntekhabat]
    WHERE [ID] = @ID
      AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'سابقه داوطلبی موردنظر پیدا نشد.', 1;
END
GO
