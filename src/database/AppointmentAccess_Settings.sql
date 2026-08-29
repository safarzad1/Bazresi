USE [DBBazresi];
GO

/*
    دسترسی پست‌های سازمانی به عملیات انتصاب و لغو انتصاب
    هر ردیف فقط یک پست انجام‌دهنده را به یک پست مقصد متصل می‌کند.
    دسترسی به زیرمجموعه‌ها به‌صورت خودکار گسترش داده نمی‌شود.
*/
IF OBJECT_ID(N'[bz].[AppointmentPostAccess]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AppointmentPostAccess]
    (
        [AccessId] BIGINT IDENTITY(1,1) NOT NULL,
        [ActorPostId] BIGINT NOT NULL,
        [TargetPostId] BIGINT NOT NULL,
        [IsActive] BIT NOT NULL
            CONSTRAINT [DF_AppointmentPostAccess_IsActive] DEFAULT (1),
        [CreateUserId] NVARCHAR(450) NOT NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL
            CONSTRAINT [DF_AppointmentPostAccess_CreateDateTime] DEFAULT (SYSDATETIME()),
        [EditUserId] NVARCHAR(450) NULL,
        [EditDateTime] DATETIME2(0) NULL,
        CONSTRAINT [PK_AppointmentPostAccess]
            PRIMARY KEY CLUSTERED ([AccessId]),
        CONSTRAINT [UQ_AppointmentPostAccess_Actor_Target]
            UNIQUE ([ActorPostId], [TargetPostId])
    );

    CREATE INDEX [IX_AppointmentPostAccess_TargetPostId]
        ON [bz].[AppointmentPostAccess] ([TargetPostId], [IsActive]);
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_IsSystemAdmin]
    @UserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CONVERT(BIT, CASE WHEN EXISTS
    (
        SELECT 1
        FROM [dbo].[AspNetUserRoles] AS UR
        INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
        WHERE UR.[UserId] = @UserId
          AND R.[Name] IN (N'Admin', N'a_root')
    ) THEN 1 ELSE 0 END) AS [IsSystemAdmin];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_Lookups]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [dbo].[AspNetUserRoles] AS UR
        INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
        WHERE UR.[UserId] = @ActorUserId
          AND R.[Name] IN (N'Admin', N'a_root')
    )
        THROW 51001, N'فقط مدیر سامانه اجازه مدیریت دسترسی‌های انتصابات را دارد.', 1;

    ;WITH SematLookup AS
    (
        SELECT
            S.[ID],
            MAX(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N'')) AS [Title],
            MAX(S.[Mahal]) AS [MahalId]
        FROM [dbo].[Semats] AS S
        WHERE S.[ID] IS NOT NULL
        GROUP BY S.[ID]
    )
    SELECT
        CONVERT(BIGINT, S.[ID]) AS [Id],
        S.[Title],
        S.[MahalId],
        COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name]) AS [MahalTitle]
    FROM SematLookup AS S
    LEFT JOIN [dbo].[Citys] AS C ON C.[CityId] = S.[MahalId]
    WHERE S.[Title] IS NOT NULL
    ORDER BY S.[Title], S.[ID];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_List]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [dbo].[AspNetUserRoles] AS UR
        INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
        WHERE UR.[UserId] = @ActorUserId
          AND R.[Name] IN (N'Admin', N'a_root')
    )
        THROW 51001, N'فقط مدیر سامانه اجازه مدیریت دسترسی‌های انتصابات را دارد.', 1;

    ;WITH SematLookup AS
    (
        SELECT
            S.[ID],
            MAX(NULLIF(LTRIM(RTRIM(S.[OnvanSemat])), N'')) AS [Title],
            MAX(S.[Mahal]) AS [MahalId]
        FROM [dbo].[Semats] AS S
        WHERE S.[ID] IS NOT NULL
        GROUP BY S.[ID]
    )
    SELECT
        A.[AccessId],
        A.[ActorPostId],
        ActorPost.[Title] AS [ActorPostTitle],
        ActorPost.[MahalId] AS [ActorMahalId],
        COALESCE(NULLIF(LTRIM(RTRIM(ActorCity.[FullName])), N''), ActorCity.[Name]) AS [ActorMahalTitle],
        A.[TargetPostId],
        TargetPost.[Title] AS [TargetPostTitle],
        TargetPost.[MahalId] AS [TargetMahalId],
        COALESCE(NULLIF(LTRIM(RTRIM(TargetCity.[FullName])), N''), TargetCity.[Name]) AS [TargetMahalTitle],
        A.[CreateUserId],
        A.[CreateDateTime],
        A.[EditUserId],
        A.[EditDateTime]
    FROM [bz].[AppointmentPostAccess] AS A
    INNER JOIN SematLookup AS ActorPost ON ActorPost.[ID] = A.[ActorPostId]
    INNER JOIN SematLookup AS TargetPost ON TargetPost.[ID] = A.[TargetPostId]
    LEFT JOIN [dbo].[Citys] AS ActorCity ON ActorCity.[CityId] = ActorPost.[MahalId]
    LEFT JOIN [dbo].[Citys] AS TargetCity ON TargetCity.[CityId] = TargetPost.[MahalId]
    WHERE A.[IsActive] = 1
    ORDER BY ActorPost.[Title], TargetPost.[Title], A.[AccessId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_Save]
    @ActorPostId BIGINT,
    @TargetPostId BIGINT,
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [dbo].[AspNetUserRoles] AS UR
        INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
        WHERE UR.[UserId] = @ActorUserId
          AND R.[Name] IN (N'Admin', N'a_root')
    )
        THROW 51001, N'فقط مدیر سامانه اجازه مدیریت دسترسی‌های انتصابات را دارد.', 1;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Semats] WHERE [ID] = @ActorPostId)
        THROW 51002, N'پست انجام‌دهنده معتبر نیست.', 1;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Semats] WHERE [ID] = @TargetPostId)
        THROW 51003, N'پست مقصد معتبر نیست.', 1;

    DECLARE @AccessId BIGINT;

    BEGIN TRANSACTION;

    SELECT @AccessId = [AccessId]
    FROM [bz].[AppointmentPostAccess] WITH (UPDLOCK, HOLDLOCK)
    WHERE [ActorPostId] = @ActorPostId
      AND [TargetPostId] = @TargetPostId;

    IF @AccessId IS NULL
    BEGIN
        INSERT [bz].[AppointmentPostAccess]
        (
            [ActorPostId], [TargetPostId], [IsActive],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @ActorPostId, @TargetPostId, 1,
            @ActorUserId, SYSDATETIME()
        );

        SET @AccessId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE [bz].[AppointmentPostAccess]
        SET [IsActive] = 1,
            [EditUserId] = @ActorUserId,
            [EditDateTime] = SYSDATETIME()
        WHERE [AccessId] = @AccessId;
    END;

    COMMIT TRANSACTION;

    SELECT @AccessId AS [AccessId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_Delete]
    @AccessId BIGINT,
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [dbo].[AspNetUserRoles] AS UR
        INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
        WHERE UR.[UserId] = @ActorUserId
          AND R.[Name] IN (N'Admin', N'a_root')
    )
        THROW 51001, N'فقط مدیر سامانه اجازه مدیریت دسترسی‌های انتصابات را دارد.', 1;

    UPDATE [bz].[AppointmentPostAccess]
    SET [IsActive] = 0,
        [EditUserId] = @ActorUserId,
        [EditDateTime] = SYSDATETIME()
    WHERE [AccessId] = @AccessId
      AND [IsActive] = 1;

    IF @@ROWCOUNT = 0
        THROW 51004, N'دسترسی موردنظر پیدا نشد.', 1;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_CanManage]
    @ActorPostId BIGINT,
    @TargetPostId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CONVERT(BIT, CASE WHEN EXISTS
    (
        SELECT 1
        FROM [bz].[AppointmentPostAccess]
        WHERE [ActorPostId] = @ActorPostId
          AND [TargetPostId] = @TargetPostId
          AND [IsActive] = 1
    ) THEN 1 ELSE 0 END) AS [CanManage];
END;
GO

/* فهرست انتصاب‌های جاری نیز دقیقاً از همین نگاشت استفاده می‌کند. */
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

/* افزودن وضعیت مدیر سامانه به اطلاعات ورود و نشست */
CREATE OR ALTER PROCEDURE [bz].[SP_Login_GetUser]
    @UserName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CleanUserName NVARCHAR(100) = LTRIM(RTRIM(@UserName));

    SELECT TOP (1)
        U.[Id] AS [UserId], U.[UserName], U.[FullName], U.[MahalId], U.[Semat],
        S.[OnvanSemat], U.[PasswordHash], U.[IsDelete], U.[IsActive],
        U.[ChangePassword], U.[LockoutEnd],
        ISNULL(U.[AccessFailedCount], 0) AS [AccessFailedCount],
        ISNULL(S.[TabDashboard], 0) AS [TabDashboard],
        ISNULL(S.[TabArzeshyabi], 0) AS [TabArzeshyabi],
        ISNULL(S.[TabEntesabat], 0) AS [TabEntesabat],
        ISNULL(S.[TabPersonnel], 0) AS [TabPersonnel],
        ISNULL(S.[TabEstelam], 0) AS [TabEstelam],
        CONVERT(BIT, CASE WHEN EXISTS
        (
            SELECT 1
            FROM [dbo].[AspNetUserRoles] AS UR
            INNER JOIN [dbo].[AspNetRoles] AS R ON R.[Id] = UR.[RoleId]
            WHERE UR.[UserId] = U.[Id]
              AND R.[Name] IN (N'Admin', N'a_root')
        ) THEN 1 ELSE 0 END) AS [IsSystemAdmin]
    FROM [dbo].[AspNetUsers] AS U
    LEFT JOIN [dbo].[Semats] AS S ON S.[ID] = U.[Semat]
    WHERE U.[UserName] = @CleanUserName
       OR U.[NormalizedUserName] = UPPER(@CleanUserName);
END;
GO
