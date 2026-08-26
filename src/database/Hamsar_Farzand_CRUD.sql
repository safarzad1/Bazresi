USE [DBBazresi];
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'bz')
    EXEC(N'CREATE SCHEMA [bz]');
GO

IF OBJECT_ID(N'[bz].[Hamsar]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[Hamsar]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Hamsar] PRIMARY KEY,
        [PersonId] BIGINT NOT NULL,
        [NameHamsar] NVARCHAR(250) NOT NULL,
        [ShoghlHamsar] NVARCHAR(250) NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NOT NULL CONSTRAINT [DF_Hamsar_CreateDateTime] DEFAULT ([dbo].[FarsiDateTimeNow]()),
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL,
        CONSTRAINT [UQ_Hamsar_PersonId] UNIQUE ([PersonId])
    );
END
GO

IF OBJECT_ID(N'[bz].[Farzand]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[Farzand]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Farzand] PRIMARY KEY,
        [PersonId] BIGINT NOT NULL,
        [NameFarzand] NVARCHAR(250) NOT NULL,
        [ShoghlFarzand] NVARCHAR(250) NULL,
        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NOT NULL CONSTRAINT [DF_Farzand_CreateDateTime] DEFAULT ([dbo].[FarsiDateTimeNow]()),
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[bz].[Farzand]') AND name = N'IX_Farzand_PersonId')
    CREATE INDEX [IX_Farzand_PersonId] ON [bz].[Farzand]([PersonId]);
GO

CREATE OR ALTER PROCEDURE [bz].[SP_HamsarAdmin_Get]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (1)
        [ID], [PersonId], [NameHamsar], [ShoghlHamsar],
        [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
    FROM [bz].[Hamsar]
    WHERE [PersonId] = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_HamsarAdmin_Save]
    @PersonId BIGINT,
    @NameHamsar NVARCHAR(250),
    @ShoghlHamsar NVARCHAR(250) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NameHamsar = NULLIF(LTRIM(RTRIM(@NameHamsar)), N'');
    SET @ShoghlHamsar = NULLIF(LTRIM(RTRIM(@ShoghlHamsar)), N'');
    SET @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF @PersonId <= 0 THROW 51000, N'شناسه شخص معتبر نیست.', 1;
    IF @NameHamsar IS NULL THROW 51000, N'نام و نام خانوادگی همسر را وارد کنید.', 1;

    IF EXISTS (SELECT 1 FROM [bz].[Hamsar] WHERE [PersonId] = @PersonId)
    BEGIN
        UPDATE [bz].[Hamsar]
        SET [NameHamsar] = @NameHamsar,
            [ShoghlHamsar] = @ShoghlHamsar,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [PersonId] = @PersonId;
    END
    ELSE
    BEGIN
        INSERT INTO [bz].[Hamsar]
        ([PersonId], [NameHamsar], [ShoghlHamsar], [CreateUserId], [CreateDateTime])
        VALUES
        (@PersonId, @NameHamsar, @ShoghlHamsar, @ActorUserId, [dbo].[FarsiDateTimeNow]());
    END;

    EXEC [bz].[SP_HamsarAdmin_Get] @PersonId = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_HamsarAdmin_Delete]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [bz].[Hamsar] WHERE [PersonId] = @PersonId;
    IF @@ROWCOUNT = 0 THROW 51000, N'اطلاعات همسر پیدا نشد.', 1;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_FarzandAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        [ID], [PersonId], [NameFarzand], [ShoghlFarzand],
        [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
    FROM [bz].[Farzand]
    WHERE [PersonId] = @PersonId
    ORDER BY [ID];
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_FarzandAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @NameFarzand NVARCHAR(250),
    @ShoghlFarzand NVARCHAR(250) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NameFarzand = NULLIF(LTRIM(RTRIM(@NameFarzand)), N'');
    SET @ShoghlFarzand = NULLIF(LTRIM(RTRIM(@ShoghlFarzand)), N'');
    SET @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF @PersonId <= 0 THROW 51000, N'شناسه شخص معتبر نیست.', 1;
    IF @NameFarzand IS NULL THROW 51000, N'نام و نام خانوادگی فرزند را وارد کنید.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        IF (SELECT COUNT(1) FROM [bz].[Farzand] WHERE [PersonId] = @PersonId) >= 5
            THROW 51000, N'حداکثر ۵ فرزند مطابق فرم قابل ثبت است.', 1;

        INSERT INTO [bz].[Farzand]
        ([PersonId], [NameFarzand], [ShoghlFarzand], [CreateUserId], [CreateDateTime])
        VALUES
        (@PersonId, @NameFarzand, @ShoghlFarzand, @ActorUserId, [dbo].[FarsiDateTimeNow]());

        SET @ID = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [bz].[Farzand]
        SET [NameFarzand] = @NameFarzand,
            [ShoghlFarzand] = @ShoghlFarzand,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0 THROW 51000, N'اطلاعات فرزند پیدا نشد.', 1;
    END;

    SELECT TOP (1)
        [ID], [PersonId], [NameFarzand], [ShoghlFarzand],
        [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
    FROM [bz].[Farzand]
    WHERE [ID] = @ID AND [PersonId] = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_FarzandAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [bz].[Farzand] WHERE [ID] = @ID AND [PersonId] = @PersonId;
    IF @@ROWCOUNT = 0 THROW 51000, N'اطلاعات فرزند پیدا نشد.', 1;
END
GO
