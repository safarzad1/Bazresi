USE [DBBazresi];
GO

/* =========================================================
   Wizard - خدمت، تحصیل و اشتغال
   تمام تاریخ‌ها NVARCHAR(25)
   تاریخ/زمان سیستمی همچنان با FarsiDateTimeNow()
   ========================================================= */

IF COL_LENGTH(N'bz.Person', N'NoeTahsil') IS NULL
    ALTER TABLE [bz].[Person] ADD [NoeTahsil] NVARCHAR(20) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'SathTahsilHozavi') IS NULL
    ALTER TABLE [bz].[Person] ADD [SathTahsilHozavi] NVARCHAR(150) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'HamtarazTahsil') IS NULL
    ALTER TABLE [bz].[Person] ADD [HamtarazTahsil] NVARCHAR(150) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'MahalTahsil') IS NULL
    ALTER TABLE [bz].[Person] ADD [MahalTahsil] NVARCHAR(250) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'BalatarinMadrakTahsil') IS NULL
    ALTER TABLE [bz].[Person] ADD [BalatarinMadrakTahsil] NVARCHAR(150) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'MahalAkhzMadrak') IS NULL
    ALTER TABLE [bz].[Person] ADD [MahalAkhzMadrak] NVARCHAR(250) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'TarikhAkhzMadrak') IS NULL
    ALTER TABLE [bz].[Person] ADD [TarikhAkhzMadrak] NVARCHAR(25) NULL;
GO

IF COL_LENGTH(N'bz.Person', N'VazeyatEshteghal') IS NULL
    ALTER TABLE [bz].[Person] ADD [VazeyatEshteghal] NVARCHAR(20) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'MahalKhedmatFeli') IS NULL
    ALTER TABLE [bz].[Person] ADD [MahalKhedmatFeli] INT NULL;
GO
IF COL_LENGTH(N'bz.Person', N'OnvanPostSazmani') IS NULL
    ALTER TABLE [bz].[Person] ADD [OnvanPostSazmani] NVARCHAR(250) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'TarikhEntesab') IS NULL
    ALTER TABLE [bz].[Person] ADD [TarikhEntesab] NVARCHAR(25) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'AkharinMahalKhedmat') IS NULL
    ALTER TABLE [bz].[Person] ADD [AkharinMahalKhedmat] INT NULL;
GO
IF COL_LENGTH(N'bz.Person', N'AkharinPostSazmani') IS NULL
    ALTER TABLE [bz].[Person] ADD [AkharinPostSazmani] NVARCHAR(250) NULL;
GO
IF COL_LENGTH(N'bz.Person', N'ModdatEntesab') IS NULL
    ALTER TABLE [bz].[Person] ADD [ModdatEntesab] NVARCHAR(100) NULL;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_PersonAdmin_Get]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        P.[PersonId], P.[CodeMelli], P.[CodeMelliSarparast], P.[Nesbat],
        P.[FirstName], P.[LastName], P.[FatherName], P.[TarikhTavalod],
        P.[ShomareShenasnameh], P.[Life], P.[TarikhFoat],
        P.[MahalTavalod], P.[MahalSodor], P.[Serial_Harf], P.[Serial_Seri],
        P.[Serial_Code], P.[Almosana], P.[FirstNameOld], P.[LastNameOld],
        P.[TaghyiratShenasnamehSet], P.[TaghyiratShenasnameh],
        P.[Jensiat], P.[JensiatName], P.[Shoghl], P.[Taahol], P.[DinMazhab], P.[Rohani],
        P.[NezamVazifeh], P.[TarikhShoro], P.[TarikhPayan],
        P.[NoeMoaafiat], P.[TarikhMoaafiat], P.[SharhMoaafiat],
        P.[Email], P.[TelHamrah], P.[TelZaruri],
        P.[MaharatRayaneh], P.[VazeyatJesmani],
        P.[AddressManzel], P.[TelSabet], P.[CodeShahrestan], P.[AddressKar], P.[TelKar],

        P.[NoeTahsil], P.[SathTahsilHozavi], P.[HamtarazTahsil], P.[MahalTahsil],
        P.[BalatarinMadrakTahsil], P.[MahalAkhzMadrak], P.[TarikhAkhzMadrak],

        P.[VazeyatEshteghal], P.[MahalKhedmatFeli], P.[OnvanPostSazmani], P.[TarikhEntesab],
        P.[AkharinMahalKhedmat], P.[AkharinPostSazmani], P.[ModdatEntesab],

        P.[ImagePath], P.[RegistrationState], P.[CreateDateTime], P.[FinalizedDateTime]
    FROM [bz].[Person] AS P
    WHERE P.[PersonId] = @PersonId
      AND P.[IsDelete] = 0;
END
GO

CREATE OR ALTER PROCEDURE [bz].[SP_PersonAdmin_SaveNormalized]
    @PersonId BIGINT,
    @IsFinal BIT,
    @CodeMelli NVARCHAR(50),
    @CodeMelliSarparast NVARCHAR(50) = NULL,
    @Nesbat INT = NULL,
    @FirstName NVARCHAR(150),
    @LastName NVARCHAR(150),
    @FatherName NVARCHAR(150),
    @TarikhTavalod NVARCHAR(50) = NULL,
    @ShomareShenasnameh NVARCHAR(20),
    @Life INT = NULL,
    @TarikhFoat NVARCHAR(50) = NULL,
    @MahalTavalod INT = NULL,
    @MahalSodor INT = NULL,
    @Serial_Harf NVARCHAR(3) = NULL,
    @Serial_Seri NVARCHAR(50) = NULL,
    @Serial_Code NVARCHAR(50) = NULL,
    @Almosana INT = NULL,
    @FirstNameOld NVARCHAR(250) = NULL,
    @LastNameOld NVARCHAR(150) = NULL,
    @TaghyiratShenasnamehSet INT = NULL,
    @TaghyiratShenasnameh NVARCHAR(1500) = NULL,
    @Jensiat INT = NULL,
    @Shoghl NVARCHAR(50),
    @Taahol INT = NULL,
    @DinMazhab INT = NULL,
    @Rohani INT = NULL,
    @NezamVazifeh INT = NULL,
    @TarikhShoro NVARCHAR(25) = NULL,
    @TarikhPayan NVARCHAR(25) = NULL,
    @NoeMoaafiat INT = NULL,
    @TarikhMoaafiat NVARCHAR(25) = NULL,
    @SharhMoaafiat NVARCHAR(1500) = NULL,
    @Email NVARCHAR(1500) = NULL,
    @TelHamrah NVARCHAR(15) = NULL,
    @TelZaruri NVARCHAR(15) = NULL,

    @MaharatRayaneh NVARCHAR(1500) = NULL,
    @VazeyatJesmani NVARCHAR(1500) = NULL,
    @AddressManzel NVARCHAR(1500) = NULL,
    @TelSabet NVARCHAR(20) = NULL,
    @CodeShahrestan INT = NULL,
    @AddressKar NVARCHAR(1500) = NULL,
    @TelKar NVARCHAR(20) = NULL,

    @NoeTahsil NVARCHAR(20) = NULL,
    @SathTahsilHozavi NVARCHAR(150) = NULL,
    @HamtarazTahsil NVARCHAR(150) = NULL,
    @MahalTahsil NVARCHAR(250) = NULL,
    @BalatarinMadrakTahsil NVARCHAR(150) = NULL,
    @MahalAkhzMadrak NVARCHAR(250) = NULL,
    @TarikhAkhzMadrak NVARCHAR(25) = NULL,

    @VazeyatEshteghal NVARCHAR(20) = NULL,
    @MahalKhedmatFeli INT = NULL,
    @OnvanPostSazmani NVARCHAR(250) = NULL,
    @TarikhEntesab NVARCHAR(25) = NULL,
    @AkharinMahalKhedmat INT = NULL,
    @AkharinPostSazmani NVARCHAR(250) = NULL,
    @ModdatEntesab NVARCHAR(100) = NULL,

    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NoeTahsil = NULLIF(LTRIM(RTRIM(@NoeTahsil)), N'');
    SET @SathTahsilHozavi = NULLIF([dbo].[NormalizePersianText](@SathTahsilHozavi), N'');
    SET @HamtarazTahsil = NULLIF([dbo].[NormalizePersianText](@HamtarazTahsil), N'');
    SET @MahalTahsil = NULLIF([dbo].[NormalizePersianText](@MahalTahsil), N'');
    SET @BalatarinMadrakTahsil = NULLIF([dbo].[NormalizePersianText](@BalatarinMadrakTahsil), N'');
    SET @MahalAkhzMadrak = NULLIF([dbo].[NormalizePersianText](@MahalAkhzMadrak), N'');
    SET @VazeyatEshteghal = NULLIF(LTRIM(RTRIM(@VazeyatEshteghal)), N'');
    SET @OnvanPostSazmani = NULLIF([dbo].[NormalizePersianText](@OnvanPostSazmani), N'');
    SET @AkharinPostSazmani = NULLIF([dbo].[NormalizePersianText](@AkharinPostSazmani), N'');
    SET @ModdatEntesab = NULLIF([dbo].[NormalizePersianText](@ModdatEntesab), N'');

    DECLARE @Saved TABLE
    (
        [PersonId] BIGINT,
        [RegistrationState] TINYINT,
        [ImagePath] NVARCHAR(150) NULL
    );

    INSERT INTO @Saved ([PersonId], [RegistrationState], [ImagePath])
    EXEC [bz].[SP_PersonAdmin_Save]
        @PersonId = @PersonId,
        @IsFinal = @IsFinal,
        @CodeMelli = @CodeMelli,
        @CodeMelliSarparast = @CodeMelliSarparast,
        @Nesbat = @Nesbat,
        @FirstName = @FirstName,
        @LastName = @LastName,
        @FatherName = @FatherName,
        @TarikhTavalod = @TarikhTavalod,
        @ShomareShenasnameh = @ShomareShenasnameh,
        @Life = @Life,
        @TarikhFoat = @TarikhFoat,
        @MahalTavalod = @MahalTavalod,
        @MahalSodor = @MahalSodor,
        @Serial_Harf = @Serial_Harf,
        @Serial_Seri = @Serial_Seri,
        @Serial_Code = @Serial_Code,
        @Almosana = @Almosana,
        @FirstNameOld = @FirstNameOld,
        @LastNameOld = @LastNameOld,
        @TaghyiratShenasnamehSet = @TaghyiratShenasnamehSet,
        @TaghyiratShenasnameh = @TaghyiratShenasnameh,
        @Jensiat = @Jensiat,
        @Shoghl = @Shoghl,
        @Taahol = @Taahol,
        @DinMazhab = @DinMazhab,
        @Rohani = @Rohani,
        @NezamVazifeh = @NezamVazifeh,
        @TarikhShoro = @TarikhShoro,
        @TarikhPayan = @TarikhPayan,
        @NoeMoaafiat = @NoeMoaafiat,
        @TarikhMoaafiat = @TarikhMoaafiat,
        @SharhMoaafiat = @SharhMoaafiat,
        @Email = @Email,
        @TelHamrah = @TelHamrah,
        @TelZaruri = @TelZaruri,
        @ActorUserId = @ActorUserId;

    SELECT TOP (1) @PersonId = [PersonId] FROM @Saved;

    UPDATE [bz].[Person]
    SET
        [MaharatRayaneh] = @MaharatRayaneh,
        [VazeyatJesmani] = @VazeyatJesmani,
        [AddressManzel] = @AddressManzel,
        [TelSabet] = @TelSabet,
        [CodeShahrestan] = @CodeShahrestan,
        [AddressKar] = @AddressKar,
        [TelKar] = @TelKar,

        [NoeTahsil] = @NoeTahsil,
        [SathTahsilHozavi] = CASE WHEN @NoeTahsil = N'حوزوی' THEN @SathTahsilHozavi ELSE NULL END,
        [HamtarazTahsil] = CASE WHEN @NoeTahsil = N'حوزوی' THEN @HamtarazTahsil ELSE NULL END,
        [MahalTahsil] = CASE WHEN @NoeTahsil = N'حوزوی' THEN @MahalTahsil ELSE NULL END,
        [BalatarinMadrakTahsil] = CASE WHEN @NoeTahsil = N'دانشگاهی' THEN @BalatarinMadrakTahsil ELSE NULL END,
        [MahalAkhzMadrak] = CASE WHEN @NoeTahsil = N'دانشگاهی' THEN @MahalAkhzMadrak ELSE NULL END,
        [TarikhAkhzMadrak] = CASE WHEN @NoeTahsil = N'دانشگاهی' THEN @TarikhAkhzMadrak ELSE NULL END,

        [VazeyatEshteghal] = @VazeyatEshteghal,
        [MahalKhedmatFeli] = CASE WHEN @VazeyatEshteghal = N'شاغل' THEN @MahalKhedmatFeli ELSE NULL END,
        [OnvanPostSazmani] = CASE WHEN @VazeyatEshteghal = N'شاغل' THEN @OnvanPostSazmani ELSE NULL END,
        [TarikhEntesab] = CASE WHEN @VazeyatEshteghal = N'شاغل' THEN @TarikhEntesab ELSE NULL END,
        [AkharinMahalKhedmat] = CASE WHEN @VazeyatEshteghal = N'بازنشسته' THEN @AkharinMahalKhedmat ELSE NULL END,
        [AkharinPostSazmani] = CASE WHEN @VazeyatEshteghal = N'بازنشسته' THEN @AkharinPostSazmani ELSE NULL END,
        [ModdatEntesab] = CASE WHEN @VazeyatEshteghal = N'بازنشسته' THEN @ModdatEntesab ELSE NULL END
    WHERE [PersonId] = @PersonId
      AND [IsDelete] = 0;

    SELECT
        P.[PersonId],
        P.[RegistrationState],
        P.[ImagePath]
    FROM [bz].[Person] AS P
    WHERE P.[PersonId] = @PersonId;
END
GO
