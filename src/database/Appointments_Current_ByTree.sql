
USE [DBBazresi];
GO

/* ============================================================
   فهرست انتصاب‌های جاری بر اساس درخت واقعی پست سازمانی

   مبنا:
       dbo.Semats.ID  = کد پست
       dbo.Semats.PID = پست والد

   @Semat = پست جاری کاربر
   تمام پست‌های زیرمجموعه در هر عمق از درخت بازیابی می‌شوند.
   ============================================================ */
CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CurrentByTree]
    @Semat BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH SematTree AS
    (
        -- پست فعلی
        SELECT
            S.[ID],
            S.[PID],
            S.[OnvanSemat],
            S.[Level],
            0 AS [TreeLevel]
        FROM [dbo].[Semats] AS S
        WHERE S.[ID] = @Semat

        UNION ALL

        -- تمام فرزندان، نوه‌ها و سطوح پایین‌تر
        SELECT
            C.[ID],
            C.[PID],
            C.[OnvanSemat],
            C.[Level],
            P.[TreeLevel] + 1
        FROM [dbo].[Semats] AS C
        INNER JOIN SematTree AS P
            ON C.[PID] = P.[ID]
    )
    SELECT ISNULL
    (
        (
            SELECT
                E.[EntesabId],
                E.[PersonId],
                E.[CodeMelli],
                E.[FirstName],
                E.[LastName],
                E.[FullName],
                E.[PostId],
                ST.[OnvanSemat] AS [PostOnvan],
                ST.[PID] AS [ParentPostId],
                ST.[TreeLevel],
                E.[TarikhEblagh],
                E.[ModatEblagKhedmat],
                E.[RecordState],
                E.[RecordState_NameFarsi],
                E.[TaeedOrAdamTaeed],
                E.[TaeedOrAdamTaeedNameFarsi],
                E.[IsEblagh],
                ISNULL
                (
                    (
                        SELECT
                            EM.[Id],
                            EM.[OnvanSanad],
                            EM.[CreateDateTime],
                            RIGHT
                            (
                                EM.[FileName],
                                CHARINDEX('\', REVERSE(EM.[FileName])) - 1
                            ) AS [FullFileName],
                            (
                                SELECT TOP (1) E2.[FullName]
                                FROM [bz].[Entesabat] AS E2
                                WHERE E2.[PersonId] = EM.[PersonId]
                                ORDER BY E2.[EntesabId] DESC
                            ) AS [FullName2]
                        FROM [bz].[Entesabat_Madarek] AS EM
                        WHERE EM.[PersonId] = E.[PersonId]
                        ORDER BY EM.[CreateDateTime] DESC
                        FOR JSON PATH, INCLUDE_NULL_VALUES
                    ),
                    '[]'
                ) AS [Madarek]
            FROM [bz].[Entesabat] AS E
            INNER JOIN SematTree AS ST
                ON ST.[ID] = E.[PostId]
            WHERE
                -- فقط زیرشاخه‌ها؛ خود پست رئیس نمایش داده نشود
                ST.[TreeLevel] > 0
                AND E.[RecordState] = 10
                AND E.[TaeedOrAdamTaeed] = 4
                AND ISNULL(E.[KartablOthePost], 0) = 0
                AND ISNULL(E.[IsDelete], 0) = 0
                -- مطابق مفهوم «انتصاب جاری / ابلاغ شده»
                AND ISNULL(E.[IsEblagh], 0) = 1
            ORDER BY
                ST.[TreeLevel],
                E.[PostId],
                E.[EntesabId]
            FOR JSON PATH, INCLUDE_NULL_VALUES
        ),
        '[]'
    ) AS [JsonResult]
    OPTION (MAXRECURSION 100);
END;
GO


/* تست درخت یک پست - @Semat را با کد رئیس اداره بازرسی جایگزین کنید */
-- DECLARE @Semat BIGINT = 0;
-- ;WITH T AS
-- (
--     SELECT ID, PID, OnvanSemat, 0 AS Lvl
--     FROM dbo.Semats
--     WHERE ID = @Semat
--
--     UNION ALL
--
--     SELECT S.ID, S.PID, S.OnvanSemat, T.Lvl + 1
--     FROM dbo.Semats S
--     JOIN T ON S.PID = T.ID
-- )
-- SELECT * FROM T ORDER BY Lvl, ID;
GO
