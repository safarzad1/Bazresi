
USE [DBBazresi];
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CurrentByAccess]
    @Semat BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    /* ============================================================
       قوانین:
       204:
         کل انتصاب‌های جاری، ولی فقط Mahal با طول 1 یا 3

       206:
         1) نیروهای زیرمجموعه واقعی خودش
         2) تمام پست‌های زیرمجموعه 20609 که LEN(Mahal)=3
         شهرستان‌ها (LEN=5) در شاخه 20609 حذف می‌شوند

       سایر سمت‌ها:
         فقط زیرمجموعه واقعی پست خودشان
       ============================================================ */

    /* ------------------------------------------------------------
       Semat = 204
       ------------------------------------------------------------ */
    IF @Semat = 204
    BEGIN
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
                    COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]) AS [PostOnvan],
                    S.[PID] AS [ParentPostId],
                    NULL AS [TreeLevel],
                    S.[Mahal],
                    E.[TarikhEblagh],
                    E.[ModatEblagKhedmat],
                    E.[RecordState],
                    E.[RecordState_NameFarsi],
                    E.[TaeedOrAdamTaeed],
                    E.[TaeedOrAdamTaeedNameFarsi],
                    E.[IsEblagh]
                FROM [bz].[Entesabat] AS E
                INNER JOIN [dbo].[Semats] AS S
                    ON S.[ID] = E.[PostId]
                WHERE
                    E.[RecordState] = 10
                    AND E.[TaeedOrAdamTaeed] = 4
                    AND LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(50), S.[Mahal])))) IN (1, 3)
                ORDER BY
                    LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(50), S.[Mahal])))) ASC,
                    TRY_CONVERT(BIGINT, S.[Mahal]) ASC,
                    E.[PostId] ASC,
                    E.[EntesabId] ASC
                FOR JSON PATH, INCLUDE_NULL_VALUES
            ),
            '[]'
        ) AS [JsonResult];

        RETURN;
    END;


    /* ------------------------------------------------------------
       Semat = 206
       مدیرکل امور انتخابات:
       - زیرمجموعه خودش
       - رؤسای استان‌ها از شاخه 20609 با Mahal سه‌رقمی
       ------------------------------------------------------------ */
    IF @Semat = 206
    BEGIN
        ;WITH OwnTree AS
        (
            SELECT
                S.[ID],
                S.[PID],
                S.[Mahal],
                0 AS [TreeLevel],
                CAST(CASE WHEN S.[ID] = 20609 THEN 1 ELSE 0 END AS BIT) AS [IsProvinceBranch]
            FROM [dbo].[Semats] AS S
            WHERE S.[ID] = 206

            UNION ALL

            SELECT
                C.[ID],
                C.[PID],
                C.[Mahal],
                P.[TreeLevel] + 1,
                CAST(
                    CASE
                        WHEN P.[IsProvinceBranch] = 1 OR C.[ID] = 20609 THEN 1
                        ELSE 0
                    END
                    AS BIT
                )
            FROM [dbo].[Semats] AS C
            INNER JOIN OwnTree AS P
                ON C.[PID] = P.[ID]
        ),
        ProvinceTree AS
        (
            SELECT
                S.[ID],
                S.[PID],
                S.[Mahal],
                0 AS [TreeLevel]
            FROM [dbo].[Semats] AS S
            WHERE S.[ID] = 20609

            UNION ALL

            SELECT
                C.[ID],
                C.[PID],
                C.[Mahal],
                P.[TreeLevel] + 1
            FROM [dbo].[Semats] AS C
            INNER JOIN ProvinceTree AS P
                ON C.[PID] = P.[ID]
        ),
        AllowedPosts AS
        (
            /* نیروهای واقعی زیرمجموعه 206، به جز شاخه استانی 20609 */
            SELECT
                T.[ID],
                T.[TreeLevel],
                T.[Mahal]
            FROM OwnTree AS T
            WHERE
                T.[TreeLevel] > 0
                AND T.[IsProvinceBranch] = 0

            UNION

            /* رؤسای استان‌ها از شاخه 20609؛ شهرستان‌ها وارد نمی‌شوند */
            SELECT
                T.[ID],
                T.[TreeLevel],
                T.[Mahal]
            FROM ProvinceTree AS T
            WHERE
                T.[TreeLevel] > 0
                AND LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(50), T.[Mahal])))) = 3
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
                    COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]) AS [PostOnvan],
                    S.[PID] AS [ParentPostId],
                    AP.[TreeLevel],
                    S.[Mahal],
                    E.[TarikhEblagh],
                    E.[ModatEblagKhedmat],
                    E.[RecordState],
                    E.[RecordState_NameFarsi],
                    E.[TaeedOrAdamTaeed],
                    E.[TaeedOrAdamTaeedNameFarsi],
                    E.[IsEblagh]
                FROM [bz].[Entesabat] AS E
                INNER JOIN AllowedPosts AS AP
                    ON AP.[ID] = E.[PostId]
                INNER JOIN [dbo].[Semats] AS S
                    ON S.[ID] = E.[PostId]
                WHERE
                    E.[RecordState] = 10
                    AND E.[TaeedOrAdamTaeed] = 4
                ORDER BY
                    LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(50), S.[Mahal])))) ASC,
                    TRY_CONVERT(BIGINT, S.[Mahal]) ASC,
                    E.[PostId] ASC,
                    E.[EntesabId] ASC
                FOR JSON PATH, INCLUDE_NULL_VALUES
            ),
            '[]'
        ) AS [JsonResult]
        OPTION (MAXRECURSION 100);

        RETURN;
    END;


    /* ------------------------------------------------------------
       سایر مدیرکل‌ها و رؤسای استان‌ها
       ------------------------------------------------------------ */
    ;WITH UserSematTree AS
    (
        SELECT
            S.[ID],
            S.[PID],
            S.[Mahal],
            0 AS [TreeLevel]
        FROM [dbo].[Semats] AS S
        WHERE S.[ID] = @Semat

        UNION ALL

        SELECT
            C.[ID],
            C.[PID],
            C.[Mahal],
            P.[TreeLevel] + 1
        FROM [dbo].[Semats] AS C
        INNER JOIN UserSematTree AS P
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
                COALESCE(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N''), E.[PostOnvan]) AS [PostOnvan],
                S.[PID] AS [ParentPostId],
                T.[TreeLevel],
                S.[Mahal],
                E.[TarikhEblagh],
                E.[ModatEblagKhedmat],
                E.[RecordState],
                E.[RecordState_NameFarsi],
                E.[TaeedOrAdamTaeed],
                E.[TaeedOrAdamTaeedNameFarsi],
                E.[IsEblagh]
            FROM [bz].[Entesabat] AS E
            INNER JOIN UserSematTree AS T
                ON T.[ID] = E.[PostId]
                AND T.[TreeLevel] > 0
            INNER JOIN [dbo].[Semats] AS S
                ON S.[ID] = E.[PostId]
            WHERE
                E.[RecordState] = 10
                AND E.[TaeedOrAdamTaeed] = 4
            ORDER BY
                LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(50), S.[Mahal])))) ASC,
                TRY_CONVERT(BIGINT, S.[Mahal]) ASC,
                E.[PostId] ASC,
                E.[EntesabId] ASC
            FOR JSON PATH, INCLUDE_NULL_VALUES
        ),
        '[]'
    ) AS [JsonResult]
    OPTION (MAXRECURSION 100);
END;
GO
