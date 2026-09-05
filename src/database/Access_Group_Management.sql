/* ============================================================================
   DBBazresi - Group based access management
   گروه دسترسی -> دسترسی فرم‌ها -> عضویت هر کاربر در یک گروه
   قابل اجرای مجدد
   ============================================================================ */
USE [DBBazresi];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* --------------------------------------------------------------------------
   Tables
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'[bz].[AccessGroups]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AccessGroups]
    (
        [GroupId]        INT IDENTITY(1,1) NOT NULL,
        [GroupTitle]     NVARCHAR(150) NOT NULL,
        [IsSystem]       BIT NOT NULL CONSTRAINT [DF_AccessGroups_IsSystem] DEFAULT(0),
        [IsActive]       BIT NOT NULL CONSTRAINT [DF_AccessGroups_IsActive] DEFAULT(1),
        [CreateUserId]   NVARCHAR(450) NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_AccessGroups_CreateDateTime] DEFAULT(SYSDATETIME()),
        [EditUserId]     NVARCHAR(450) NULL,
        [EditDateTime]   DATETIME2(0) NULL,
        CONSTRAINT [PK_AccessGroups] PRIMARY KEY CLUSTERED ([GroupId]),
        CONSTRAINT [UQ_AccessGroups_GroupTitle] UNIQUE ([GroupTitle])
    );
END;
GO

IF OBJECT_ID(N'[bz].[AccessMenus]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[AccessMenus]
    (
        [MenuId]      INT IDENTITY(1,1) NOT NULL,
        [MenuCode]    NVARCHAR(80) NOT NULL,
        [MenuTitle]   NVARCHAR(150) NOT NULL,
        [MenuRoute]   NVARCHAR(300) NOT NULL,
        [MenuSection] NVARCHAR(100) NOT NULL,
        [SortOrder]   INT NOT NULL,
        [IsActive]    BIT NOT NULL CONSTRAINT [DF_AccessMenus_IsActive] DEFAULT(1),
        CONSTRAINT [PK_AccessMenus] PRIMARY KEY CLUSTERED ([MenuId]),
        CONSTRAINT [UQ_AccessMenus_MenuCode] UNIQUE ([MenuCode]),
        CONSTRAINT [UQ_AccessMenus_MenuRoute] UNIQUE ([MenuRoute])
    );
END;
GO

IF OBJECT_ID(N'[bz].[UserAccessGroups]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[UserAccessGroups]
    (
        [UserId]         NVARCHAR(450) NOT NULL,
        [GroupId]        INT NOT NULL,
        [CreateUserId]   NVARCHAR(450) NULL,
        [CreateDateTime] DATETIME2(0) NOT NULL CONSTRAINT [DF_UserAccessGroups_CreateDateTime] DEFAULT(SYSDATETIME()),
        [EditUserId]     NVARCHAR(450) NULL,
        [EditDateTime]   DATETIME2(0) NULL,
        CONSTRAINT [PK_UserAccessGroups] PRIMARY KEY CLUSTERED ([UserId]),
        CONSTRAINT [FK_UserAccessGroups_AspNetUsers]
            FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]),
        CONSTRAINT [FK_UserAccessGroups_AccessGroups]
            FOREIGN KEY ([GroupId]) REFERENCES [bz].[AccessGroups]([GroupId])
    );
    CREATE INDEX [IX_UserAccessGroups_GroupId]
        ON [bz].[UserAccessGroups]([GroupId], [UserId]);
END;
GO

IF OBJECT_ID(N'[bz].[GroupMenuAccess]', N'U') IS NULL
BEGIN
    CREATE TABLE [bz].[GroupMenuAccess]
    (
        [GroupId]      INT NOT NULL,
        [MenuId]       INT NOT NULL,
        [IsAllowed]    BIT NOT NULL,
        [EditUserId]   NVARCHAR(450) NULL,
        [EditDateTime] DATETIME2(0) NULL,
        CONSTRAINT [PK_GroupMenuAccess] PRIMARY KEY CLUSTERED ([GroupId], [MenuId]),
        CONSTRAINT [FK_GroupMenuAccess_AccessGroups]
            FOREIGN KEY ([GroupId]) REFERENCES [bz].[AccessGroups]([GroupId]),
        CONSTRAINT [FK_GroupMenuAccess_AccessMenus]
            FOREIGN KEY ([MenuId]) REFERENCES [bz].[AccessMenus]([MenuId])
    );
    CREATE INDEX [IX_GroupMenuAccess_MenuId]
        ON [bz].[GroupMenuAccess]([MenuId], [GroupId], [IsAllowed]);
END;
GO

/* --------------------------------------------------------------------------
   Registry of actual Bazresi forms
   -------------------------------------------------------------------------- */
MERGE [bz].[AccessMenus] AS T
USING
(
    VALUES
        (N'DASHBOARD',                 N'داشبورد',                 N'/Admin/Dashboard',                  N'اصلی',                 10),
        (N'PERSONS',                   N'اشخاص و پرونده‌ها',       N'/Admin/Persons',                    N'اشخاص و پرونده‌ها',     20),
        (N'APPOINTMENTS_WORKFLOW',     N'فرایند انتصابات',         N'/Admin/Appointments/Workflow',      N'فرآیندها',              30),
        (N'APPOINTMENTS_CURRENT',      N'انتصاب‌های جاری',         N'/Admin/Appointments/Current',       N'فرآیندها',              40),
        (N'APPOINTMENTS_CANCELLATIONS',N'لغو انتصاب',              N'/Admin/Appointments/Cancellations', N'فرآیندها',              50),
        (N'EVALUATION',                N'ارزشیابی',                 N'/Admin/Evaluation',                 N'فرآیندها',              60),
        (N'ORGANIZATION',              N'ساختار سازمانی',          N'/Admin/OrganizationStructure',      N'ساختار سازمان',         70),
        (N'USERS',                     N'فهرست کاربران',           N'/Admin/Users',                      N'مدیریت سامانه',         80),
        (N'ACCESS_MANAGEMENT',         N'مدیریت دسترسی',           N'/Admin/AccessManagement',           N'مدیریت سامانه',         90),
        (N'SETTINGS',                  N'تنظیمات سامانه',          N'/Admin/Settings',                   N'مدیریت سامانه',        100)
) AS S([MenuCode],[MenuTitle],[MenuRoute],[MenuSection],[SortOrder])
ON T.[MenuCode] = S.[MenuCode]
WHEN MATCHED THEN UPDATE SET
    T.[MenuTitle] = S.[MenuTitle],
    T.[MenuRoute] = S.[MenuRoute],
    T.[MenuSection] = S.[MenuSection],
    T.[SortOrder] = S.[SortOrder],
    T.[IsActive] = 1
WHEN NOT MATCHED THEN
    INSERT([MenuCode],[MenuTitle],[MenuRoute],[MenuSection],[SortOrder],[IsActive])
    VALUES(S.[MenuCode],S.[MenuTitle],S.[MenuRoute],S.[MenuSection],S.[SortOrder],1);
GO

/* --------------------------------------------------------------------------
   Bootstrap groups. Existing access is migrated conservatively.
   -------------------------------------------------------------------------- */
DECLARE @FullId INT, @BaseId INT, @ApptId INT, @EvalId INT, @ApptEvalId INT;
DECLARE @BaseWasNew BIT=0, @ApptWasNew BIT=0, @EvalWasNew BIT=0, @ApptEvalWasNew BIT=0;

IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'دسترسی کامل')
    INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem]) VALUES(N'دسترسی کامل',1);
IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'دسترسی پایه')
BEGIN
    INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem]) VALUES(N'دسترسی پایه',1);
    SET @BaseWasNew=1;
END;
IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + انتصابات')
BEGIN
    INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem]) VALUES(N'پایه + انتصابات',0);
    SET @ApptWasNew=1;
END;
IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + ارزشیابی')
BEGIN
    INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem]) VALUES(N'پایه + ارزشیابی',0);
    SET @EvalWasNew=1;
END;
IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + انتصابات و ارزشیابی')
BEGIN
    INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem]) VALUES(N'پایه + انتصابات و ارزشیابی',0);
    SET @ApptEvalWasNew=1;
END;

/* اگر عنوان‌های سیستمی قبلاً به‌صورت دستی ساخته شده باشند، ماهیت سیستمی آنها تثبیت می‌شود. */
UPDATE [bz].[AccessGroups]
SET [IsSystem]=1, [IsActive]=1
WHERE [GroupTitle] IN (N'دسترسی کامل',N'دسترسی پایه');

SELECT @FullId=[GroupId] FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'دسترسی کامل';
SELECT @BaseId=[GroupId] FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'دسترسی پایه';
SELECT @ApptId=[GroupId] FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + انتصابات';
SELECT @EvalId=[GroupId] FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + ارزشیابی';
SELECT @ApptEvalId=[GroupId] FROM [bz].[AccessGroups] WHERE [GroupTitle]=N'پایه + انتصابات و ارزشیابی';

/* ensure every group has a row for every menu */
MERGE [bz].[GroupMenuAccess] AS T
USING
(
    SELECT G.[GroupId], M.[MenuId],
           CONVERT(BIT, CASE WHEN G.[GroupId]=@FullId THEN 1 ELSE 0 END) AS [IsAllowed]
    FROM [bz].[AccessGroups] G
    CROSS JOIN [bz].[AccessMenus] M
    WHERE G.[IsActive]=1 AND M.[IsActive]=1
) AS S
ON T.[GroupId]=S.[GroupId] AND T.[MenuId]=S.[MenuId]
WHEN NOT MATCHED THEN
    INSERT([GroupId],[MenuId],[IsAllowed]) VALUES(S.[GroupId],S.[MenuId],S.[IsAllowed]);

/* full access is always kept full */
UPDATE GA SET [IsAllowed]=1
FROM [bz].[GroupMenuAccess] GA
WHERE GA.[GroupId]=@FullId;

/* فقط هنگام اولین ساخت، دسترسی‌های پیشنهادی گروه‌های اولیه تنظیم می‌شوند؛
   اجرای مجدد Patch تنظیمات مدیر سامانه را بازنویسی نمی‌کند. */
IF @BaseWasNew=1
    UPDATE GA SET [IsAllowed]=CASE WHEN M.[MenuCode] IN (N'DASHBOARD',N'PERSONS',N'ORGANIZATION') THEN 1 ELSE 0 END
    FROM [bz].[GroupMenuAccess] GA
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId]
    WHERE GA.[GroupId]=@BaseId;

IF @ApptWasNew=1
    UPDATE GA SET [IsAllowed]=CASE WHEN M.[MenuCode] IN
    (N'DASHBOARD',N'PERSONS',N'ORGANIZATION',N'APPOINTMENTS_WORKFLOW',N'APPOINTMENTS_CURRENT',N'APPOINTMENTS_CANCELLATIONS') THEN 1 ELSE 0 END
    FROM [bz].[GroupMenuAccess] GA
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId]
    WHERE GA.[GroupId]=@ApptId;

IF @EvalWasNew=1
    UPDATE GA SET [IsAllowed]=CASE WHEN M.[MenuCode] IN
    (N'DASHBOARD',N'PERSONS',N'ORGANIZATION',N'EVALUATION') THEN 1 ELSE 0 END
    FROM [bz].[GroupMenuAccess] GA
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId]
    WHERE GA.[GroupId]=@EvalId;

IF @ApptEvalWasNew=1
    UPDATE GA SET [IsAllowed]=CASE WHEN M.[MenuCode] IN
    (N'DASHBOARD',N'PERSONS',N'ORGANIZATION',N'APPOINTMENTS_WORKFLOW',N'APPOINTMENTS_CURRENT',N'APPOINTMENTS_CANCELLATIONS',N'EVALUATION') THEN 1 ELSE 0 END
    FROM [bz].[GroupMenuAccess] GA
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId]
    WHERE GA.[GroupId]=@ApptEvalId;

/* Existing users: keep current effective appointment/evaluation access. */
INSERT [bz].[UserAccessGroups]([UserId],[GroupId])
SELECT U.[Id],
       CASE
         WHEN EXISTS
              (SELECT 1 FROM [dbo].[AspNetUserRoles] UR
               JOIN [dbo].[AspNetRoles] R ON R.[Id]=UR.[RoleId]
               WHERE UR.[UserId]=U.[Id] AND R.[Name] IN (N'Admin',N'a_root')) THEN @FullId
         WHEN (ISNULL(S.[TabEntesabat],0)=1 OR ISNULL(S.[IsReciceviedRequest],0)=1) AND ISNULL(S.[TabArzeshyabi],0)=1 THEN @ApptEvalId
         WHEN (ISNULL(S.[TabEntesabat],0)=1 OR ISNULL(S.[IsReciceviedRequest],0)=1) THEN @ApptId
         WHEN ISNULL(S.[TabArzeshyabi],0)=1 THEN @EvalId
         ELSE @BaseId
       END
FROM [dbo].[AspNetUsers] U
LEFT JOIN [dbo].[Semats] S ON S.[ID]=U.[Semat]
WHERE ISNULL(U.[IsDelete],0)=0
  AND NOT EXISTS(SELECT 1 FROM [bz].[UserAccessGroups] UG WHERE UG.[UserId]=U.[Id]);
GO

/* --------------------------------------------------------------------------
   Runtime context & assert
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [bz].[SP_Access_UserMenuContext]
    @UserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsSystemAdmin BIT=0, @IsActive BIT=0, @GroupId INT=NULL, @GroupTitle NVARCHAR(150)=NULL;

    SELECT @IsActive=CONVERT(BIT,CASE WHEN ISNULL(U.[IsDelete],0)=0 AND ISNULL(U.[IsActive],0)=1 THEN 1 ELSE 0 END)
    FROM [dbo].[AspNetUsers] U WHERE U.[Id]=@UserId;

    IF ISNULL(@IsActive,0)=0
        THROW 52101, N'کاربر فعال نیست یا وجود ندارد.', 1;

    SELECT @IsSystemAdmin=CONVERT(BIT,CASE WHEN EXISTS
    (
        SELECT 1 FROM [dbo].[AspNetUserRoles] UR
        JOIN [dbo].[AspNetRoles] R ON R.[Id]=UR.[RoleId]
        WHERE UR.[UserId]=@UserId AND R.[Name] IN (N'Admin',N'a_root')
    ) THEN 1 ELSE 0 END);

    SELECT @GroupId=G.[GroupId], @GroupTitle=G.[GroupTitle]
    FROM [bz].[UserAccessGroups] UG
    JOIN [bz].[AccessGroups] G ON G.[GroupId]=UG.[GroupId] AND G.[IsActive]=1
    WHERE UG.[UserId]=@UserId;

    SELECT @IsSystemAdmin AS [IsSystemAdmin], @GroupId AS [GroupId], @GroupTitle AS [GroupTitle];

    IF @IsSystemAdmin=1
    BEGIN
        SELECT [MenuId],[MenuCode],[MenuTitle],[MenuRoute],[MenuSection],[SortOrder]
        FROM [bz].[AccessMenus] WHERE [IsActive]=1 ORDER BY [SortOrder],[MenuId];
        RETURN;
    END;

    SELECT M.[MenuId],M.[MenuCode],M.[MenuTitle],M.[MenuRoute],M.[MenuSection],M.[SortOrder]
    FROM [bz].[UserAccessGroups] UG
    JOIN [bz].[AccessGroups] G ON G.[GroupId]=UG.[GroupId] AND G.[IsActive]=1
    JOIN [bz].[GroupMenuAccess] GA ON GA.[GroupId]=UG.[GroupId] AND GA.[IsAllowed]=1
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId] AND M.[IsActive]=1
    WHERE UG.[UserId]=@UserId
    ORDER BY M.[SortOrder],M.[MenuId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_Access_AssertMenu]
    @UserId NVARCHAR(450),
    @MenuCode NVARCHAR(80)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM [dbo].[AspNetUsers] WHERE [Id]=@UserId AND ISNULL([IsDelete],0)=0 AND ISNULL([IsActive],0)=1)
        THROW 52101, N'کاربر فعال نیست یا وجود ندارد.', 1;

    IF EXISTS
    (
        SELECT 1 FROM [dbo].[AspNetUserRoles] UR
        JOIN [dbo].[AspNetRoles] R ON R.[Id]=UR.[RoleId]
        WHERE UR.[UserId]=@UserId AND R.[Name] IN (N'Admin',N'a_root')
    ) RETURN;

    IF EXISTS
    (
        SELECT 1
        FROM [bz].[UserAccessGroups] UG
        JOIN [bz].[AccessGroups] G ON G.[GroupId]=UG.[GroupId] AND G.[IsActive]=1
        JOIN [bz].[GroupMenuAccess] GA ON GA.[GroupId]=UG.[GroupId] AND GA.[IsAllowed]=1
        JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId] AND M.[IsActive]=1
        WHERE UG.[UserId]=@UserId AND M.[MenuCode]=@MenuCode
    ) RETURN;

    THROW 52103, N'دسترسی به این بخش برای کاربر مجاز نیست.', 1;
END;
GO

/* --------------------------------------------------------------------------
   Group CRUD
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [bz].[SP_AccessGroup_List]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'ACCESS_MANAGEMENT';

    SELECT G.[GroupId],G.[GroupTitle],G.[IsSystem],G.[IsActive],
           ISNULL(U.[UserCount],0) AS [UserCount], ISNULL(A.[AccessCount],0) AS [AccessCount]
    FROM [bz].[AccessGroups] G
    OUTER APPLY(SELECT COUNT_BIG(1) [UserCount] FROM [bz].[UserAccessGroups] UG WHERE UG.[GroupId]=G.[GroupId]) U
    OUTER APPLY(SELECT COUNT_BIG(1) [AccessCount] FROM [bz].[GroupMenuAccess] GA WHERE GA.[GroupId]=G.[GroupId] AND GA.[IsAllowed]=1) A
    WHERE G.[IsActive]=1
    ORDER BY G.[IsSystem] DESC,G.[GroupId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AccessGroup_Save]
    @ActorUserId NVARCHAR(450),
    @GroupId INT=NULL,
    @GroupTitle NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'ACCESS_MANAGEMENT';
    SET @GroupTitle=NULLIF(LTRIM(RTRIM(ISNULL(@GroupTitle,N''))),N'');
    IF @GroupTitle IS NULL THROW 52110,N'عنوان گروه الزامی است.',1;
    IF EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupTitle]=@GroupTitle AND [IsActive]=1 AND (@GroupId IS NULL OR [GroupId]<>@GroupId))
        THROW 52111,N'گروهی با این عنوان قبلاً ثبت شده است.',1;

    IF @GroupId IS NULL
    BEGIN
        BEGIN TRAN;
        INSERT [bz].[AccessGroups]([GroupTitle],[IsSystem],[CreateUserId]) VALUES(@GroupTitle,0,@ActorUserId);
        SET @GroupId=CONVERT(INT,SCOPE_IDENTITY());
        INSERT [bz].[GroupMenuAccess]([GroupId],[MenuId],[IsAllowed],[EditUserId],[EditDateTime])
        SELECT @GroupId,[MenuId],0,@ActorUserId,SYSDATETIME() FROM [bz].[AccessMenus] WHERE [IsActive]=1;
        COMMIT;
    END
    ELSE
    BEGIN
        IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsActive]=1)
            THROW 52112,N'گروه موردنظر یافت نشد.',1;
        IF EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsSystem]=1 AND [GroupTitle]<>@GroupTitle)
            THROW 52115,N'عنوان گروه سیستمی قابل تغییر نیست.',1;
        UPDATE [bz].[AccessGroups] SET [GroupTitle]=@GroupTitle,[EditUserId]=@ActorUserId,[EditDateTime]=SYSDATETIME() WHERE [GroupId]=@GroupId;
    END;

    SELECT [GroupId],[GroupTitle],[IsSystem],[IsActive] FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_AccessGroup_Delete]
    @ActorUserId NVARCHAR(450),
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'ACCESS_MANAGEMENT';

    DECLARE @IsSystem BIT;
    SELECT @IsSystem=[IsSystem] FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsActive]=1;
    IF @IsSystem IS NULL THROW 52112,N'گروه موردنظر یافت نشد.',1;
    IF @IsSystem=1 THROW 52113,N'گروه سیستمی قابل حذف نیست.',1;
    IF EXISTS(SELECT 1 FROM [bz].[UserAccessGroups] WHERE [GroupId]=@GroupId)
        THROW 52114,N'این گروه دارای کاربر است؛ ابتدا کاربران را به گروه دیگری منتقل کنید.',1;

    BEGIN TRAN;
    DELETE [bz].[GroupMenuAccess] WHERE [GroupId]=@GroupId;
    DELETE [bz].[AccessGroups] WHERE [GroupId]=@GroupId;
    COMMIT;
    SELECT CONVERT(BIT,1) AS [Ok];
END;
GO

/* --------------------------------------------------------------------------
   User -> group
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [bz].[SP_UserAccessGroup_List]
    @ActorUserId NVARCHAR(450),
    @Search NVARCHAR(250)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'ACCESS_MANAGEMENT';
    SET @Search=NULLIF(LTRIM(RTRIM(ISNULL(@Search,N''))),N'');

    SELECT U.[Id] AS [UserId],U.[UserName],U.[FullName] AS [DisplayName],
           CONVERT(BIT,CASE WHEN EXISTS
           (SELECT 1 FROM [dbo].[AspNetUserRoles] UR JOIN [dbo].[AspNetRoles] R ON R.[Id]=UR.[RoleId]
            WHERE UR.[UserId]=U.[Id] AND R.[Name] IN(N'Admin',N'a_root')) THEN 1 ELSE 0 END) AS [IsSystemAdmin],
           ISNULL(U.[IsActive],0) AS [IsActive],
           UG.[GroupId],G.[GroupTitle]
    FROM [dbo].[AspNetUsers] U
    LEFT JOIN [bz].[UserAccessGroups] UG ON UG.[UserId]=U.[Id]
    LEFT JOIN [bz].[AccessGroups] G ON G.[GroupId]=UG.[GroupId]
    WHERE ISNULL(U.[IsDelete],0)=0
      AND (@Search IS NULL OR U.[FullName] LIKE N'%'+@Search+N'%' OR U.[UserName] LIKE N'%'+@Search+N'%' OR U.[NationalCode] LIKE N'%'+@Search+N'%' OR ISNULL(G.[GroupTitle],N'') LIKE N'%'+@Search+N'%')
    ORDER BY ISNULL(U.[IsActive],0) DESC,U.[FullName],U.[UserName];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_UserAccessGroup_Set]
    @ActorUserId NVARCHAR(450),
    @UserId NVARCHAR(450),
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'ACCESS_MANAGEMENT';
    IF NOT EXISTS(SELECT 1 FROM [dbo].[AspNetUsers] WHERE [Id]=@UserId AND ISNULL([IsDelete],0)=0)
        THROW 52120,N'کاربر موردنظر یافت نشد.',1;
    IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsActive]=1)
        THROW 52112,N'گروه موردنظر یافت نشد.',1;

    MERGE [bz].[UserAccessGroups] AS T
    USING(SELECT @UserId AS [UserId],@GroupId AS [GroupId]) S
    ON T.[UserId]=S.[UserId]
    WHEN MATCHED THEN UPDATE SET T.[GroupId]=S.[GroupId],T.[EditUserId]=@ActorUserId,T.[EditDateTime]=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT([UserId],[GroupId],[CreateUserId]) VALUES(S.[UserId],S.[GroupId],@ActorUserId);

    SELECT U.[Id] AS [UserId],U.[UserName],U.[FullName] AS [DisplayName],UG.[GroupId],G.[GroupTitle]
    FROM [dbo].[AspNetUsers] U JOIN [bz].[UserAccessGroups] UG ON UG.[UserId]=U.[Id]
    JOIN [bz].[AccessGroups] G ON G.[GroupId]=UG.[GroupId]
    WHERE U.[Id]=@UserId;
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_UserAccessGroup_AssignDefault]
    @ActorUserId NVARCHAR(450)=NULL,
    @UserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT 1 FROM [bz].[UserAccessGroups] WHERE [UserId]=@UserId) RETURN;
    IF NOT EXISTS(SELECT 1 FROM [dbo].[AspNetUsers] WHERE [Id]=@UserId AND ISNULL([IsDelete],0)=0) RETURN;

    DECLARE @GroupId INT;
    SELECT TOP(1) @GroupId=[GroupId] FROM [bz].[AccessGroups]
    WHERE [IsActive]=1 AND [GroupTitle]=N'دسترسی پایه';
    IF @GroupId IS NULL SELECT TOP(1) @GroupId=[GroupId] FROM [bz].[AccessGroups] WHERE [IsActive]=1 ORDER BY [IsSystem] DESC,[GroupId];
    IF @GroupId IS NOT NULL
        INSERT [bz].[UserAccessGroups]([UserId],[GroupId],[CreateUserId]) VALUES(@UserId,@GroupId,@ActorUserId);
END;
GO

/* --------------------------------------------------------------------------
   Group menu permissions
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [bz].[SP_GroupMenuAccess_Get]
    @ActorUserId NVARCHAR(450),
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId,N'ACCESS_MANAGEMENT';
    IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsActive]=1)
        THROW 52112,N'گروه موردنظر یافت نشد.',1;

    SELECT [GroupId],[GroupTitle],[IsSystem] FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId;
    SELECT M.[MenuId],M.[MenuCode],M.[MenuTitle],M.[MenuRoute],M.[MenuSection],M.[SortOrder],
           CONVERT(BIT,ISNULL(GA.[IsAllowed],0)) AS [IsAllowed]
    FROM [bz].[AccessMenus] M
    LEFT JOIN [bz].[GroupMenuAccess] GA ON GA.[MenuId]=M.[MenuId] AND GA.[GroupId]=@GroupId
    WHERE M.[IsActive]=1 ORDER BY M.[SortOrder],M.[MenuId];
END;
GO

CREATE OR ALTER PROCEDURE [bz].[SP_GroupMenuAccess_Save]
    @ActorUserId NVARCHAR(450),
    @GroupId INT,
    @AccessJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId,N'ACCESS_MANAGEMENT';
    IF NOT EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [IsActive]=1)
        THROW 52112,N'گروه موردنظر یافت نشد.',1;
    IF ISJSON(@AccessJson)<>1 THROW 52130,N'فهرست دسترسی‌ها معتبر نیست.',1;

    /* گروه دسترسی کامل، مسیر بازیابی مدیریت سامانه است و نباید ناقص شود. */
    IF EXISTS(SELECT 1 FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId AND [GroupTitle]=N'دسترسی کامل')
    BEGIN
        UPDATE GA
        SET GA.[IsAllowed]=1, GA.[EditUserId]=@ActorUserId, GA.[EditDateTime]=SYSDATETIME()
        FROM [bz].[GroupMenuAccess] GA
        JOIN [bz].[AccessMenus] M ON M.[MenuId]=GA.[MenuId] AND M.[IsActive]=1
        WHERE GA.[GroupId]=@GroupId;

        INSERT [bz].[GroupMenuAccess]([GroupId],[MenuId],[IsAllowed],[EditUserId],[EditDateTime])
        SELECT @GroupId,M.[MenuId],1,@ActorUserId,SYSDATETIME()
        FROM [bz].[AccessMenus] M
        WHERE M.[IsActive]=1
          AND NOT EXISTS
              (SELECT 1 FROM [bz].[GroupMenuAccess] GA WHERE GA.[GroupId]=@GroupId AND GA.[MenuId]=M.[MenuId]);

        SELECT [GroupId],[GroupTitle],[IsSystem] FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId;
        SELECT M.[MenuId],M.[MenuCode],M.[MenuTitle],M.[MenuRoute],M.[MenuSection],M.[SortOrder],CONVERT(BIT,1) AS [IsAllowed]
        FROM [bz].[AccessMenus] M WHERE M.[IsActive]=1 ORDER BY M.[SortOrder],M.[MenuId];
        RETURN;
    END;

    DECLARE @A TABLE([MenuId] INT NOT NULL PRIMARY KEY,[IsAllowed] BIT NOT NULL);
    INSERT @A([MenuId],[IsAllowed])
    SELECT J.[MenuId],J.[IsAllowed]
    FROM OPENJSON(@AccessJson) WITH([MenuId] INT '$.menuId',[IsAllowed] BIT '$.isAllowed') J
    JOIN [bz].[AccessMenus] M ON M.[MenuId]=J.[MenuId] AND M.[IsActive]=1
    WHERE J.[MenuId] IS NOT NULL;

    BEGIN TRAN;
    MERGE [bz].[GroupMenuAccess] AS T
    USING
    (
      SELECT @GroupId AS [GroupId],M.[MenuId],CONVERT(BIT,ISNULL(A.[IsAllowed],0)) AS [IsAllowed]
      FROM [bz].[AccessMenus] M LEFT JOIN @A A ON A.[MenuId]=M.[MenuId] WHERE M.[IsActive]=1
    ) S
    ON T.[GroupId]=S.[GroupId] AND T.[MenuId]=S.[MenuId]
    WHEN MATCHED THEN UPDATE SET T.[IsAllowed]=S.[IsAllowed],T.[EditUserId]=@ActorUserId,T.[EditDateTime]=SYSDATETIME()
    WHEN NOT MATCHED THEN INSERT([GroupId],[MenuId],[IsAllowed],[EditUserId],[EditDateTime]) VALUES(S.[GroupId],S.[MenuId],S.[IsAllowed],@ActorUserId,SYSDATETIME());
    COMMIT;

    SELECT [GroupId],[GroupTitle],[IsSystem] FROM [bz].[AccessGroups] WHERE [GroupId]=@GroupId;
    SELECT M.[MenuId],M.[MenuCode],M.[MenuTitle],M.[MenuRoute],M.[MenuSection],M.[SortOrder],CONVERT(BIT,ISNULL(GA.[IsAllowed],0)) AS [IsAllowed]
    FROM [bz].[AccessMenus] M LEFT JOIN [bz].[GroupMenuAccess] GA ON GA.[MenuId]=M.[MenuId] AND GA.[GroupId]=@GroupId
    WHERE M.[IsActive]=1 ORDER BY M.[SortOrder],M.[MenuId];
END;
GO

/* New users always start in the base group. */
CREATE OR ALTER TRIGGER [dbo].[TR_AspNetUsers_AssignDefaultAccessGroup]
ON [dbo].[AspNetUsers]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @GroupId INT;
    SELECT TOP(1) @GroupId=[GroupId] FROM [bz].[AccessGroups] WHERE [IsActive]=1 AND [GroupTitle]=N'دسترسی پایه';
    IF @GroupId IS NULL RETURN;

    INSERT [bz].[UserAccessGroups]([UserId],[GroupId])
    SELECT I.[Id],@GroupId FROM inserted I
    WHERE ISNULL(I.[IsDelete],0)=0
      AND NOT EXISTS(SELECT 1 FROM [bz].[UserAccessGroups] UG WHERE UG.[UserId]=I.[Id]);
END;
GO


/* --------------------------------------------------------------------------
   Bridge existing appointment-access settings to group permission SETTINGS.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE [bz].[SP_AppointmentAccess_Lookups]
    @ActorUserId NVARCHAR(450)
AS
BEGIN
    SET NOCOUNT ON;

    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'SETTINGS';

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

    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'SETTINGS';

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

    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'SETTINGS';

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

    EXEC [bz].[SP_Access_AssertMenu] @ActorUserId, N'SETTINGS';

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

PRINT N'Access Group Management نصب شد.';
SELECT G.[GroupId],G.[GroupTitle],G.[IsSystem],COUNT(UG.[UserId]) AS [UserCount]
FROM [bz].[AccessGroups] G LEFT JOIN [bz].[UserAccessGroups] UG ON UG.[GroupId]=G.[GroupId]
WHERE G.[IsActive]=1 GROUP BY G.[GroupId],G.[GroupTitle],G.[IsSystem] ORDER BY G.[GroupId];
GO
