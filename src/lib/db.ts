import * as sql from "mssql";

declare global {
  // eslint-disable-next-line no-var
  var __bazresiSqlPool: Promise<sql.ConnectionPool> | undefined;
  // eslint-disable-next-line no-var
  var __bazresiFilesSqlPool: Promise<sql.ConnectionPool> | undefined;
}

function envFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function requiredEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  throw new Error(`تنظیم محیطی ${names.join(" یا ")} تعریف نشده است.`);
}

function createPool() {
  const parsedPort = Number(process.env.DB_PORT ?? process.env.SQL_PORT ?? 1433);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("مقدار DB_PORT معتبر نیست.");
  }

  const config: sql.config = {
    server: requiredEnv("DB_SERVER", "SQL_SERVER"),
    database: requiredEnv("DB_DATABASE", "SQL_DATABASE"),
    user: requiredEnv("DB_USER", "SQL_USER"),
    password: requiredEnv("DB_PASSWORD", "SQL_PASSWORD"),
    port: parsedPort,
    options: {
      encrypt: envFlag(process.env.DB_ENCRYPT, false),
      trustServerCertificate: envFlag(
        process.env.DB_TRUST_SERVER_CERTIFICATE,
        true,
      ),
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  };

  return new sql.ConnectionPool(config).connect();
}

function createFilesPool() {
  const parsedPort = Number(process.env.DB_PORT ?? process.env.SQL_PORT ?? 1433);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("مقدار DB_PORT معتبر نیست.");
  }

  const config: sql.config = {
    server: requiredEnv("DB_SERVER", "SQL_SERVER"),
    database: process.env.FILES_DB_DATABASE?.trim() || "DBBazresiFiles",
    user: requiredEnv("DB_USER", "SQL_USER"),
    password: requiredEnv("DB_PASSWORD", "SQL_PASSWORD"),
    port: parsedPort,
    options: {
      encrypt: envFlag(process.env.DB_ENCRYPT, false),
      trustServerCertificate: envFlag(
        process.env.DB_TRUST_SERVER_CERTIFICATE,
        true,
      ),
      enableArithAbort: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  };

  return new sql.ConnectionPool(config).connect();
}

export function getDbPool() {
  if (!global.__bazresiSqlPool) {
    global.__bazresiSqlPool = createPool().catch((error) => {
      global.__bazresiSqlPool = undefined;
      throw error;
    });
  }

  return global.__bazresiSqlPool;
}

export function getFilesDbPool() {
  if (!global.__bazresiFilesSqlPool) {
    global.__bazresiFilesSqlPool = createFilesPool().catch((error) => {
      global.__bazresiFilesSqlPool = undefined;
      throw error;
    });
  }

  return global.__bazresiFilesSqlPool;
}

export { sql };
