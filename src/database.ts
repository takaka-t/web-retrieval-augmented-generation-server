import mariadb from "mariadb";

/**
 * 各ファイルでのimportが煩わしいためglobalThisにデータベース接続プールを保持する
 */

declare global {
  /**
   * データベース接続プール
   * getConnection() で接続を取得する
   * 必ず try-finally で接続を解放すること
   */
  var databaseConnectionPool: mariadb.Pool;
}

/**
 * データベース接続プールを作成する
 */
export const createDatabaseConnectionPool = (): void => {
  global.databaseConnectionPool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 100,
  });
};

/**
 * データベース接続プールを終了する
 */
export const closeDatabaseConnectionPool = async (): Promise<void> => {
  if (global.databaseConnectionPool.closed === false) {
    await global.databaseConnectionPool.end();
    console.log("Database connection pool closed.");
  }
};
