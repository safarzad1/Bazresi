USE [DBBazresi];
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'bz')
    EXEC(N'CREATE SCHEMA [bz]');
GO

IF OBJECT_ID(N'[bz].[Isargari]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[Isargari]
    (
        [ID] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Isargari] PRIMARY KEY,
        [PersonId] BIGINT NOT NULL,

        [JebheSal] INT NULL,
        [JebheMah] INT NULL,
        [JebheRoz] INT NULL,

        [Janbaz] BIT NOT NULL CONSTRAINT [DF_Isargari_Janbaz] DEFAULT (0),
        [DarsadJanbazi] INT NULL,
        [MarjaTaeid] NVARCHAR(250) NULL,

        [Azadeh] BIT NOT NULL CONSTRAINT [DF_Isargari_Azadeh] DEFAULT (0),
        [AsaratSal] INT NULL,
        [AsaratMah] INT NULL,
        [AsaratRoz] INT NULL,

        [KhanevadeShahid] BIT NOT NULL CONSTRAINT [DF_Isargari_KhanevadeShahid] DEFAULT (0),
        [NameShahid] NVARCHAR(500) NULL,
        [TarikhMahalShahadat] NVARCHAR(500) NULL,
        [NesbatBaShahid] NVARCHAR(150) NULL,

        [CreateUserId] NVARCHAR(50) NULL,
        [CreateDateTime] NVARCHAR(25) NOT NULL
            CONSTRAINT [DF_Isargari_CreateDateTime] DEFAULT ([dbo].[FarsiDateTimeNow]()),
        [EditUserId] NVARCHAR(50) NULL,
        [EditDateTime] NVARCHAR(25) NULL,

        CONSTRAINT [UQ_Isargari_PersonId] UNIQUE ([PersonId])
    );
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_IsargariAdmin_Get]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1)
        [ID], [PersonId],
        [JebheSal], [JebheMah], [JebheRoz],
        [Janbaz], [DarsadJanbazi], [MarjaTaeid],
        [Azadeh], [AsaratSal], [AsaratMah], [AsaratRoz],
        [KhanevadeShahid], [NameShahid], [TarikhMahalShahadat], [NesbatBaShahid],
        [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
    FROM [bz].[Isargari]
    WHERE [PersonId] = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_IsargariAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @JebheSal INT = NULL,
    @JebheMah INT = NULL,
    @JebheRoz INT = NULL,
    @Janbaz BIT = 0,
    @DarsadJanbazi INT = NULL,
    @MarjaTaeid NVARCHAR(250) = NULL,
    @Azadeh BIT = 0,
    @AsaratSal INT = NULL,
    @AsaratMah INT = NULL,
    @AsaratRoz INT = NULL,
    @KhanevadeShahid BIT = 0,
    @NameShahid NVARCHAR(500) = NULL,
    @TarikhMahalShahadat NVARCHAR(500) = NULL,
    @NesbatBaShahid NVARCHAR(150) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MarjaTaeid = NULLIF(LTRIM(RTRIM(@MarjaTaeid)), N'');
    SET @NameShahid = NULLIF(LTRIM(RTRIM(@NameShahid)), N'');
    SET @TarikhMahalShahadat = NULLIF(LTRIM(RTRIM(@TarikhMahalShahadat)), N'');
    SET @NesbatBaShahid = NULLIF(LTRIM(RTRIM(@NesbatBaShahid)), N'');
    SET @ActorUserId = NULLIF(LTRIM(RTRIM(@ActorUserId)), N'');

    IF @PersonId <= 0
        THROW 51000, N'شناسه شخص معتبر نیست.', 1;

    IF @JebheSal IS NOT NULL AND @JebheSal < 0
        THROW 51000, N'سال حضور در جبهه معتبر نیست.', 1;
    IF @JebheMah IS NOT NULL AND (@JebheMah < 0 OR @JebheMah > 11)
        THROW 51000, N'ماه حضور در جبهه باید بین ۰ تا ۱۱ باشد.', 1;
    IF @JebheRoz IS NOT NULL AND (@JebheRoz < 0 OR @JebheRoz > 30)
        THROW 51000, N'روز حضور در جبهه باید بین ۰ تا ۳۰ باشد.', 1;

    IF @Janbaz = 0
    BEGIN
        SET @DarsadJanbazi = NULL;
        SET @MarjaTaeid = NULL;
    END
    ELSE IF @DarsadJanbazi IS NULL OR @DarsadJanbazi < 1 OR @DarsadJanbazi > 100
        THROW 51000, N'درصد جانبازی باید بین ۱ تا ۱۰۰ باشد.', 1;

    IF @Azadeh = 0
    BEGIN
        SET @AsaratSal = NULL;
        SET @AsaratMah = NULL;
        SET @AsaratRoz = NULL;
    END
    ELSE
    BEGIN
        IF @AsaratSal IS NOT NULL AND @AsaratSal < 0
            THROW 51000, N'سال اسارت معتبر نیست.', 1;
        IF @AsaratMah IS NOT NULL AND (@AsaratMah < 0 OR @AsaratMah > 11)
            THROW 51000, N'ماه اسارت باید بین ۰ تا ۱۱ باشد.', 1;
        IF @AsaratRoz IS NOT NULL AND (@AsaratRoz < 0 OR @AsaratRoz > 30)
            THROW 51000, N'روز اسارت باید بین ۰ تا ۳۰ باشد.', 1;
    END

    IF @KhanevadeShahid = 0
    BEGIN
        SET @NameShahid = NULL;
        SET @TarikhMahalShahadat = NULL;
        SET @NesbatBaShahid = NULL;
    END

    DECLARE @ExistingId BIGINT;
    SELECT @ExistingId = [ID] FROM [bz].[Isargari] WHERE [PersonId] = @PersonId;

    IF @ExistingId IS NULL
    BEGIN
        INSERT INTO [bz].[Isargari]
        (
            [PersonId], [JebheSal], [JebheMah], [JebheRoz],
            [Janbaz], [DarsadJanbazi], [MarjaTaeid],
            [Azadeh], [AsaratSal], [AsaratMah], [AsaratRoz],
            [KhanevadeShahid], [NameShahid], [TarikhMahalShahadat], [NesbatBaShahid],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @PersonId, @JebheSal, @JebheMah, @JebheRoz,
            @Janbaz, @DarsadJanbazi, @MarjaTaeid,
            @Azadeh, @AsaratSal, @AsaratMah, @AsaratRoz,
            @KhanevadeShahid, @NameShahid, @TarikhMahalShahadat, @NesbatBaShahid,
            @ActorUserId, [dbo].[FarsiDateTimeNow]()
        );
        SET @ExistingId = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [bz].[Isargari]
        SET
            [JebheSal] = @JebheSal,
            [JebheMah] = @JebheMah,
            [JebheRoz] = @JebheRoz,
            [Janbaz] = @Janbaz,
            [DarsadJanbazi] = @DarsadJanbazi,
            [MarjaTaeid] = @MarjaTaeid,
            [Azadeh] = @Azadeh,
            [AsaratSal] = @AsaratSal,
            [AsaratMah] = @AsaratMah,
            [AsaratRoz] = @AsaratRoz,
            [KhanevadeShahid] = @KhanevadeShahid,
            [NameShahid] = @NameShahid,
            [TarikhMahalShahadat] = @TarikhMahalShahadat,
            [NesbatBaShahid] = @NesbatBaShahid,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ExistingId AND [PersonId] = @PersonId;
    END

    EXEC [bz].[SP_IsargariAdmin_Get] @PersonId = @PersonId;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_IsargariAdmin_Delete]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DELETE FROM [bz].[Isargari] WHERE [PersonId] = @PersonId;
    IF @@ROWCOUNT = 0
        THROW 51000, N'اطلاعات ایثارگری برای این شخص ثبت نشده است.', 1;
END
GO
