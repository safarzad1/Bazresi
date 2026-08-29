USE [DBBazresiFiles];
GO

IF SCHEMA_ID(N'filedb') IS NULL EXEC(N'CREATE SCHEMA filedb');
GO

IF OBJECT_ID(N'filedb.EvaluationFiles', N'U') IS NULL
BEGIN
  CREATE TABLE filedb.EvaluationFiles(
    EvaluationFileId bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_EvaluationFiles PRIMARY KEY,
    EvaluationId nvarchar(150) NOT NULL,
    FileName nvarchar(150) NOT NULL,
    OriginalName nvarchar(260) NOT NULL,
    ContentType nvarchar(100) NOT NULL,
    FileSize bigint NOT NULL,
    FileData varbinary(max) NOT NULL,
    IsDelete bit NOT NULL CONSTRAINT DF_EvaluationFiles_IsDelete DEFAULT(0),
    CreateUserId nvarchar(450) NOT NULL,
    CreateDateTime datetime2(0) NOT NULL CONSTRAINT DF_EvaluationFiles_CreateDate DEFAULT(SYSDATETIME()),
    DeleteUserId nvarchar(450) NULL,
    DeleteDateTime datetime2(0) NULL,
    CONSTRAINT UQ_EvaluationFiles_FileName UNIQUE(FileName),
    CONSTRAINT CK_EvaluationFiles_Size CHECK(FileSize > 0 AND FileSize <= 5242880)
  );
  CREATE INDEX IX_EvaluationFiles_EvaluationId ON filedb.EvaluationFiles(EvaluationId, IsDelete);
END;
GO

CREATE OR ALTER PROCEDURE filedb.SP_EvaluationFile_Save
  @EvaluationId nvarchar(150), @FileName nvarchar(150), @OriginalName nvarchar(260),
  @ContentType nvarchar(100), @FileData varbinary(max), @CreateUserId nvarchar(450)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE filedb.EvaluationFiles SET IsDelete=1,DeleteUserId=@CreateUserId,DeleteDateTime=SYSDATETIME()
    WHERE EvaluationId=@EvaluationId AND IsDelete=0;
  INSERT filedb.EvaluationFiles(EvaluationId,FileName,OriginalName,ContentType,FileSize,FileData,CreateUserId)
  VALUES(@EvaluationId,@FileName,@OriginalName,@ContentType,DATALENGTH(@FileData),@FileData,@CreateUserId);
END;
GO

CREATE OR ALTER PROCEDURE filedb.SP_EvaluationFile_Get @FileName nvarchar(150)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP(1) FileName,OriginalName,ContentType,FileSize,FileData
  FROM filedb.EvaluationFiles WHERE FileName=@FileName AND IsDelete=0;
END;
GO

CREATE OR ALTER PROCEDURE filedb.SP_EvaluationFile_SoftDelete @FileName nvarchar(150), @DeleteUserId nvarchar(450)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE filedb.EvaluationFiles SET IsDelete=1,DeleteUserId=@DeleteUserId,DeleteDateTime=SYSDATETIME()
  WHERE FileName=@FileName AND IsDelete=0;
END;
GO
