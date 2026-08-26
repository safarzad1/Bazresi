USE [DBBazresi];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ============================================================
   پاک‌سازی نهایی جدول سوابق شغلی
   ساختار نهایی:
     ID | PersonId | Mahal | SematPostSazmani | AzTarikh | TaTarikh
     CreateUserId | CreateDateTime | EditUserId | EditDateTime

   تاریخ‌ها و تاریخ/ساعت‌ها: NVARCHAR(25)
   زمان سیستمی: dbo.FarsiDateTimeNow()
   ============================================================ */

IF OBJECT_ID(N'[bz].[Shoghl]', N'U') IS NULL
    THROW 51000, N'جدول [bz].[Shoghl] وجود ندارد.', 1;
GO

/* Procedureهای قدیمی که ممکن است به ستون‌های حذف‌شونده وابسته باشند */
DROP PROCEDURE IF EXISTS [bz].[SP_ShoghlAdmin_List];
DROP PROCEDURE IF EXISTS [bz].[SP_ShoghlAdmin_Get];
DROP PROCEDURE IF EXISTS [bz].[SP_ShoghlAdmin_Save];
DROP PROCEDURE IF EXISTS [bz].[SP_ShoghlAdmin_Delete];
DROP PROCEDURE IF EXISTS [bz].[SP_ShoghlAdmin_Lookups];
DROP PROCEDURE IF EXISTS [bz].[SP_GetShoghl];
DROP PROCEDURE IF EXISTS [bz].[SP_GetShoghlById];
DROP PROCEDURE IF EXISTS [bz].[SP_Delete_Shoghl];
GO

/* ستون‌های مورد نیاز نسخه نهایی، اگر در دیتابیس قدیمی وجود نداشته باشند */
IF COL_LENGTH(N'bz.Shoghl', N'PersonId') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [PersonId] BIGINT NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'Mahal') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [Mahal] INT NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'SematPostSazmani') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [SematPostSazmani] NVARCHAR(150) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'AzTarikh') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [AzTarikh] NVARCHAR(25) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'TaTarikh') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [TaTarikh] NVARCHAR(25) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'CreateUserId') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [CreateUserId] NVARCHAR(50) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'CreateDateTime') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [CreateDateTime] NVARCHAR(25) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'EditUserId') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [EditUserId] NVARCHAR(50) NULL;
GO
IF COL_LENGTH(N'bz.Shoghl', N'EditDateTime') IS NULL
    ALTER TABLE [bz].[Shoghl] ADD [EditDateTime] NVARCHAR(25) NULL;
GO

/* اگر داده‌ای از ساختار قدیمی وجود دارد، تا حد ممکن عنوان سمت را منتقل می‌کنیم. */
DECLARE @MigrationSql NVARCHAR(MAX) = N'';

IF COL_LENGTH(N'bz.Shoghl', N'PostSazmani_NameFarsi') IS NOT NULL
    SET @MigrationSql += N'NULLIF(LTRIM(RTRIM([PostSazmani_NameFarsi])), N''''),';
IF COL_LENGTH(N'bz.Shoghl', N'Semat_NameFarsi') IS NOT NULL
    SET @MigrationSql += N'NULLIF(LTRIM(RTRIM([Semat_NameFarsi])), N''''),';
IF COL_LENGTH(N'bz.Shoghl', N'OnvanMasoliat') IS NOT NULL
    SET @MigrationSql += N'NULLIF(LTRIM(RTRIM([OnvanMasoliat])), N''''),';
IF COL_LENGTH(N'bz.Shoghl', N'NameShoghl') IS NOT NULL
    SET @MigrationSql += N'NULLIF(LTRIM(RTRIM([NameShoghl])), N''''),';

IF LEN(@MigrationSql) > 0
BEGIN
    SET @MigrationSql = N'
        UPDATE [bz].[Shoghl]
        SET [SematPostSazmani] = COALESCE(
            NULLIF(LTRIM(RTRIM([SematPostSazmani])), N''''),
            ' + LEFT(@MigrationSql, LEN(@MigrationSql) - 1) + N'
        )
        WHERE NULLIF(LTRIM(RTRIM([SematPostSazmani])), N'''') IS NULL;';
    EXEC sys.sp_executesql @MigrationSql;
END;
GO

/* استانداردسازی طول تاریخ‌ها */
UPDATE [bz].[Shoghl] SET [AzTarikh] = LEFT([AzTarikh], 25) WHERE LEN([AzTarikh]) > 25;
UPDATE [bz].[Shoghl] SET [TaTarikh] = LEFT([TaTarikh], 25) WHERE LEN([TaTarikh]) > 25;
UPDATE [bz].[Shoghl] SET [CreateDateTime] = LEFT([CreateDateTime], 25) WHERE LEN([CreateDateTime]) > 25;
UPDATE [bz].[Shoghl] SET [EditDateTime] = LEFT([EditDateTime], 25) WHERE LEN([EditDateTime]) > 25;
GO

ALTER TABLE [bz].[Shoghl] ALTER COLUMN [AzTarikh] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [TaTarikh] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [CreateDateTime] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [EditDateTime] NVARCHAR(25) NULL;
ALTER TABLE [bz].[Shoghl] ALTER COLUMN [SematPostSazmani] NVARCHAR(150) NULL;
GO

/* ============================================================
   حذف وابستگی‌های متعلق به ستون‌های قدیمی
   ============================================================ */
DECLARE @KeepColumns TABLE ([Name] SYSNAME PRIMARY KEY);
INSERT INTO @KeepColumns ([Name]) VALUES
(N'ID'), (N'PersonId'), (N'Mahal'), (N'SematPostSazmani'),
(N'AzTarikh'), (N'TaTarikh'),
(N'CreateUserId'), (N'CreateDateTime'), (N'EditUserId'), (N'EditDateTime');

DECLARE @sql NVARCHAR(MAX) = N'';

/* Default constraintهای ستون‌های قدیمی */
SELECT @sql += N'ALTER TABLE [bz].[Shoghl] DROP CONSTRAINT ' + QUOTENAME(DC.[name]) + N';' + CHAR(13)
FROM sys.default_constraints AS DC
INNER JOIN sys.columns AS C
    ON C.[object_id] = DC.[parent_object_id]
   AND C.[column_id] = DC.[parent_column_id]
WHERE DC.[parent_object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND NOT EXISTS (SELECT 1 FROM @KeepColumns K WHERE K.[Name] = C.[name]);

/* Foreign keyهایی که ستون مبدا آنها از ستون‌های قدیمی است */
SELECT @sql += N'ALTER TABLE [bz].[Shoghl] DROP CONSTRAINT ' + QUOTENAME(FK.[name]) + N';' + CHAR(13)
FROM sys.foreign_keys AS FK
WHERE FK.[parent_object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND EXISTS
  (
      SELECT 1
      FROM sys.foreign_key_columns FKC
      INNER JOIN sys.columns C
          ON C.[object_id] = FKC.[parent_object_id]
         AND C.[column_id] = FKC.[parent_column_id]
      WHERE FKC.[constraint_object_id] = FK.[object_id]
        AND NOT EXISTS (SELECT 1 FROM @KeepColumns K WHERE K.[Name] = C.[name])
  );

/* Check constraintهای ستونی مربوط به ستون‌های قدیمی */
SELECT @sql += N'ALTER TABLE [bz].[Shoghl] DROP CONSTRAINT ' + QUOTENAME(CC.[name]) + N';' + CHAR(13)
FROM sys.check_constraints CC
INNER JOIN sys.columns C
    ON C.[object_id] = CC.[parent_object_id]
   AND C.[column_id] = CC.[parent_column_id]
WHERE CC.[parent_object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND CC.[parent_column_id] <> 0
  AND NOT EXISTS (SELECT 1 FROM @KeepColumns K WHERE K.[Name] = C.[name]);

IF LEN(@sql) > 0 EXEC sys.sp_executesql @sql;
GO

/* ایندکس‌های غیرکلیدی که از ستون‌های قدیمی استفاده می‌کنند */
DECLARE @DropIndexes NVARCHAR(MAX) = N'';
DECLARE @KeepColumns2 TABLE ([Name] SYSNAME PRIMARY KEY);
INSERT INTO @KeepColumns2 ([Name]) VALUES
(N'ID'), (N'PersonId'), (N'Mahal'), (N'SematPostSazmani'),
(N'AzTarikh'), (N'TaTarikh'),
(N'CreateUserId'), (N'CreateDateTime'), (N'EditUserId'), (N'EditDateTime');

SELECT DISTINCT @DropIndexes += N'DROP INDEX ' + QUOTENAME(I.[name]) + N' ON [bz].[Shoghl];' + CHAR(13)
FROM sys.indexes I
INNER JOIN sys.index_columns IC ON IC.[object_id] = I.[object_id] AND IC.[index_id] = I.[index_id]
INNER JOIN sys.columns C ON C.[object_id] = IC.[object_id] AND C.[column_id] = IC.[column_id]
WHERE I.[object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND I.[is_primary_key] = 0
  AND I.[is_unique_constraint] = 0
  AND NOT EXISTS (SELECT 1 FROM @KeepColumns2 K WHERE K.[Name] = C.[name]);

IF LEN(@DropIndexes) > 0 EXEC sys.sp_executesql @DropIndexes;
GO

/* Unique constraintهای احتمالی روی ستون‌های قدیمی */
DECLARE @DropKeys NVARCHAR(MAX) = N'';
DECLARE @KeepColumns3 TABLE ([Name] SYSNAME PRIMARY KEY);
INSERT INTO @KeepColumns3 ([Name]) VALUES
(N'ID'), (N'PersonId'), (N'Mahal'), (N'SematPostSazmani'),
(N'AzTarikh'), (N'TaTarikh'),
(N'CreateUserId'), (N'CreateDateTime'), (N'EditUserId'), (N'EditDateTime');

SELECT DISTINCT @DropKeys += N'ALTER TABLE [bz].[Shoghl] DROP CONSTRAINT ' + QUOTENAME(KC.[name]) + N';' + CHAR(13)
FROM sys.key_constraints KC
INNER JOIN sys.index_columns IC
    ON IC.[object_id] = KC.[parent_object_id]
   AND IC.[index_id] = KC.[unique_index_id]
INNER JOIN sys.columns C
    ON C.[object_id] = IC.[object_id]
   AND C.[column_id] = IC.[column_id]
WHERE KC.[parent_object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND KC.[type] = N'UQ'
  AND NOT EXISTS (SELECT 1 FROM @KeepColumns3 K WHERE K.[Name] = C.[name]);

IF LEN(@DropKeys) > 0 EXEC sys.sp_executesql @DropKeys;
GO

/* حذف همه ستون‌های اضافه */
DECLARE @DropColumns NVARCHAR(MAX);
SELECT @DropColumns = STRING_AGG(QUOTENAME(C.[name]), N', ')
FROM sys.columns C
WHERE C.[object_id] = OBJECT_ID(N'[bz].[Shoghl]')
  AND C.[name] NOT IN
  (
      N'ID', N'PersonId', N'Mahal', N'SematPostSazmani',
      N'AzTarikh', N'TaTarikh',
      N'CreateUserId', N'CreateDateTime', N'EditUserId', N'EditDateTime'
  );

IF NULLIF(@DropColumns, N'') IS NOT NULL
    EXEC(N'ALTER TABLE [bz].[Shoghl] DROP COLUMN ' + @DropColumns + N';');
GO

/* ایندکس مورد نیاز */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE [object_id] = OBJECT_ID(N'[bz].[Shoghl]')
      AND [name] = N'IX_Shoghl_PersonId'
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Shoghl_PersonId]
        ON [bz].[Shoghl]([PersonId], [ID]);
END;
GO

/* ============================================================
   CRUD نهایی
   ============================================================ */
CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_List]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[Mahal],
        COALESCE(
            NULLIF(LTRIM(RTRIM(C.[FullName])), N''),
            NULLIF(LTRIM(RTRIM(C.[Name])), N''),
            CONVERT(NVARCHAR(20), S.[Mahal])
        ) AS [MahalName],
        S.[SematPostSazmani],
        S.[AzTarikh],
        S.[TaTarikh]
    FROM [bz].[Shoghl] S
    LEFT JOIN [bz].[Citys] C ON C.[CityId] = S.[Mahal]
    WHERE S.[PersonId] = @PersonId
    ORDER BY
        CASE WHEN NULLIF(LTRIM(RTRIM(S.[TaTarikh])), N'') IS NULL THEN 0 ELSE 1 END,
        S.[TaTarikh] DESC,
        S.[AzTarikh] DESC,
        S.[ID] DESC;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Get]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        S.[ID],
        S.[PersonId],
        S.[Mahal],
        COALESCE(
            NULLIF(LTRIM(RTRIM(C.[FullName])), N''),
            NULLIF(LTRIM(RTRIM(C.[Name])), N''),
            CONVERT(NVARCHAR(20), S.[Mahal])
        ) AS [MahalName],
        S.[SematPostSazmani],
        S.[AzTarikh],
        S.[TaTarikh]
    FROM [bz].[Shoghl] S
    LEFT JOIN [bz].[Citys] C ON C.[CityId] = S.[Mahal]
    WHERE S.[ID] = @ID
      AND S.[PersonId] = @PersonId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Save]
    @ID BIGINT = 0,
    @PersonId BIGINT,
    @Mahal INT,
    @SematPostSazmani NVARCHAR(150),
    @AzTarikh NVARCHAR(25) = NULL,
    @TaTarikh NVARCHAR(25) = NULL,
    @ActorUserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @SematPostSazmani = NULLIF(LTRIM(RTRIM(@SematPostSazmani)), N'');
    SET @AzTarikh = NULLIF(LTRIM(RTRIM(@AzTarikh)), N'');
    SET @TaTarikh = NULLIF(LTRIM(RTRIM(@TaTarikh)), N'');

    IF ISNULL(@PersonId, 0) <= 0
        THROW 51000, N'شناسه شخص معتبر نیست.', 1;

    IF ISNULL(@Mahal, 0) <= 0
        THROW 51000, N'محل خدمت را انتخاب کنید.', 1;

    IF LEN(CONVERT(VARCHAR(20), ABS(@Mahal))) <> 5
        THROW 51000, N'محل خدمت باید تا سطح شهرستان انتخاب شود.', 1;

    IF NOT EXISTS (SELECT 1 FROM [bz].[Citys] WHERE [CityId] = @Mahal)
        THROW 51000, N'شهرستان محل خدمت معتبر نیست.', 1;

    IF @SematPostSazmani IS NULL
        THROW 51000, N'سمت (پست سازمانی) را وارد کنید.', 1;

    IF @AzTarikh IS NOT NULL
       AND @AzTarikh NOT LIKE N'[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]'
        THROW 51000, N'فرمت «از تاریخ» معتبر نیست.', 1;

    IF @TaTarikh IS NOT NULL
       AND @TaTarikh NOT LIKE N'[0-9][0-9][0-9][0-9]/[0-9][0-9]/[0-9][0-9]'
        THROW 51000, N'فرمت «تا تاریخ» معتبر نیست.', 1;

    IF @AzTarikh IS NOT NULL AND @TaTarikh IS NOT NULL AND @TaTarikh < @AzTarikh
        THROW 51000, N'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.', 1;

    IF ISNULL(@ID, 0) = 0
    BEGIN
        INSERT INTO [bz].[Shoghl]
        (
            [PersonId], [Mahal], [SematPostSazmani], [AzTarikh], [TaTarikh],
            [CreateUserId], [CreateDateTime], [EditUserId], [EditDateTime]
        )
        VALUES
        (
            @PersonId, @Mahal, @SematPostSazmani, @AzTarikh, @TaTarikh,
            @ActorUserId, [dbo].[FarsiDateTimeNow](), NULL, NULL
        );

        SET @ID = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [bz].[Shoghl]
        SET [Mahal] = @Mahal,
            [SematPostSazmani] = @SematPostSazmani,
            [AzTarikh] = @AzTarikh,
            [TaTarikh] = @TaTarikh,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ID] = @ID
          AND [PersonId] = @PersonId;

        IF @@ROWCOUNT = 0
            THROW 51000, N'سابقه شغلی موردنظر پیدا نشد.', 1;
    END;

    EXEC [bz].[SP_ShoghlAdmin_Get] @ID = @ID, @PersonId = @PersonId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_ShoghlAdmin_Delete]
    @ID BIGINT,
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM [bz].[Shoghl]
    WHERE [ID] = @ID
      AND [PersonId] = @PersonId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'سابقه شغلی موردنظر پیدا نشد.', 1;
END;
GO

/* ============================================================
   کنترل نهایی: فقط همین ستون‌ها باید دیده شوند
   ============================================================ */
SELECT
    C.[column_id] AS [ColumnOrder],
    C.[name] AS [ColumnName],
    TYPE_NAME(C.[user_type_id]) AS [DataType],
    CASE
        WHEN TYPE_NAME(C.[user_type_id]) IN (N'nvarchar', N'nchar') THEN C.[max_length] / 2
        ELSE C.[max_length]
    END AS [MaxLength]
FROM sys.columns C
WHERE C.[object_id] = OBJECT_ID(N'[bz].[Shoghl]')
ORDER BY C.[column_id];
GO
