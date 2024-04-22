import { Router } from "express";
const router = Router();

/**
 * GETテスト用
 */
router.get("/get-test", async (request, response, next): Promise<void> => {
  try {
    response.status(200).json({ result: "getTestOK" });
  } catch (error) {
    next(error);
  }
});

/**
 * POSTテスト用
 */
router.post("/post-test", async (request, response, next): Promise<void> => {
  try {
    console.log(request.body);
    const requestBody = { id: Number(request.body.id), name: String(request.body.name) };
    response.status(200).json({ newId: requestBody.id + 1 });
  } catch (error) {
    next(error);
  }
});

/**
 * データベース接続テスト用
 */
router.get("/database-test", async (request, response, next): Promise<void> => {
  try {
    const connection = await global.databaseConnectionPool.getConnection();
    console.log("Total connections: ", global.databaseConnectionPool.totalConnections());
    console.log("Active connections: ", global.databaseConnectionPool.activeConnections());
    console.log("Idle connections: ", global.databaseConnectionPool.idleConnections());
    try {
      const rows = await connection.query("SELECT * FROM chat_room");
      console.log(rows);
      response.status(200).json({ result: rows });
    } finally {
      // release end どちらも正常にプールに戻されてそうだけど公式に合わせて end を使用する
      // https://mariadb.com/docs/server/connect/programming-languages/nodejs/promise/connection-pools/
      // await connection.release();
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

export default router;
