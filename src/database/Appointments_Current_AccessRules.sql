USE [DBBazresi];
GO

/*
    پیش‌نیاز: ابتدا AppointmentAccess_Settings.sql اجرا شود.
    فهرست جاری فقط پست‌هایی را برمی‌گرداند که برای سمت کاربر
    به‌صورت صریح در bz.AppointmentPostAccess ثبت شده‌اند.
*/
IF COL_LENGTH(N'bz.LaghveEblagh', N'EntesabId') IS NULL
    ALTER TABLE [bz].[LaghveEblagh] ADD [EntesabId] BIGINT NULL;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Appointments_CurrentByAccess]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActorPostId BIGINT;

    SELECT TOP (1)
        @ActorPostId = TRY_CONVERT(BIGINT, U.[Semat])
    FROM [dbo].[AspNetUsers] AS U
    WHERE U.[Id] = @ActorUserId
      AND ISNULL(U.[IsDelete], 0) = 0
      AND ISNULL(U.[IsActive], 1) = 1;

    IF @ActorPostId IS NULL
        THROW 51005, N'سمت سازمانی فعال برای کاربر جاری پیدا نشد.', 1;

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
                dbo.MiladiToShamsi
                (
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [TarikhLaghv],
                DATEDIFF
                (
                    DAY,
                    CONVERT(DATE, GETDATE()),
                    DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh]))
                ) AS [DaysLeft],
                E.[RecordState],
                E.[RecordState_NameFarsi],
                E.[TaeedOrAdamTaeed],
                E.[TaeedOrAdamTaeedNameFarsi],
                E.[IsEblagh],
                (
                    SELECT TOP (1) L.[ID]
                    FROM [bz].[LaghveEblagh] AS L
                    WHERE L.[EntesabId] = E.[EntesabId]
                      AND L.[RecordState] = 10
                    ORDER BY L.[ID] DESC
                ) AS [CancellationProposalId],
                CONVERT
                (
                    BIT,
                    CASE
                        WHEN E.[RecordState] = 10
                         AND E.[TaeedOrAdamTaeed] = 4
                         AND DATEADD(MONTH, E.[ModatEblagKhedmat], dbo.ShamsiToMiladi(E.[TarikhEblagh])) >= CONVERT(DATE, GETDATE())
                         AND NOT EXISTS
                         (
                             SELECT 1
                             FROM [bz].[LaghveEblagh] AS L
                             WHERE L.[EntesabId] = E.[EntesabId]
                               AND L.[RecordState] = 10
                         )
                            THEN 1
                        ELSE 0
                    END
                ) AS [CanCancel],
                ISNULL
                (
                    (
                        SELECT
                            EM.[Id],
                            EM.[OnvanSanad],
                            EM.[CreateDateTime],
                            CASE
                                WHEN CHARINDEX(N'\', REVERSE(ISNULL(EM.[FileName], N''))) > 0
                                    THEN RIGHT
                                    (
                                        EM.[FileName],
                                        CHARINDEX(N'\', REVERSE(EM.[FileName])) - 1
                                    )
                                ELSE EM.[FileName]
                            END AS [FullFileName]
                        FROM [bz].[Entesabat_Madarek] AS EM
                        WHERE EM.[PersonId] = E.[PersonId]
                        ORDER BY EM.[CreateDateTime] DESC
                        FOR JSON PATH, INCLUDE_NULL_VALUES
                    ),
                    '[]'
                ) AS [Madarek]
            FROM [bz].[Entesabat] AS E
            INNER JOIN [dbo].[Semats] AS S ON S.[ID] = E.[PostId]
            WHERE E.[RecordState] = 10
              AND E.[TaeedOrAdamTaeed] = 4
              AND ISNULL(E.[KartablOthePost], 0) = 0
              AND ISNULL(E.[IsDelete], 0) = 0
              AND ISNULL(E.[IsEblagh], 0) = 1
              AND EXISTS
              (
                  SELECT 1
                  FROM [bz].[AppointmentPostAccess] AS A
                  WHERE A.[ActorPostId] = @ActorPostId
                    AND A.[TargetPostId] = E.[PostId]
                    AND A.[IsActive] = 1
              )
            ORDER BY E.[PostId], E.[EntesabId]
            FOR JSON PATH, INCLUDE_NULL_VALUES
        ),
        '[]'
    ) AS [JsonResult];
END;
GO
