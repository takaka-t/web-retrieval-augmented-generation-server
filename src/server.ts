import path from "path";

// dotenv
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// database
import { createDatabaseConnectionPool, closeDatabaseConnectionPool } from "./database";
// データベース接続プールを初期化する
createDatabaseConnectionPool();

// openai
import { initializeOpenAI } from "./openai";
// OpenAI を初期化する
initializeOpenAI();
// TODO:専用APIを作成する
global.uploadFilesAndCreateAssistant();

// express
import express from "express";
const app = express();

// settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// helmet
import helmet from "helmet";
app.use(helmet());

// session
import { session } from "./session";
app.use(session);

// logger
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});

// front app version
app.use(async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // DBから現在のフロントアプリバージョンを取得
      const frontAppVersion = (await connection.query("SELECT application_config_value FROM application_config WHERE application_config_key = 'FrontAppVersion'"))[0].application_config_value;
      // response header に設定
      response.setHeader("Front-APP-Version", String(frontAppVersion));

      next();
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

// router
import router from "./router";
app.use("/api", router);

// error handler
// なぜか型予測してくれないので明記
app.use((error: Error, request: express.Request, response: express.Response, next: express.NextFunction) => {
  console.error(error.message);
  console.error(error.stack);
  response.status(500).json({ message: error.message });
});

// static
app.use(express.static(path.join(__dirname, "public")));

// catch all route
app.get("*", (request, response) => {
  // APIのリクエストでパスがマッチしなかった場合は 404
  if (request.path.startsWith("/api/")) {
    response.status(404).send("Not found 404");
  }

  // それ以外はindex.htmlを返す
  response.sendFile(path.resolve(path.join(__dirname, "public", "index.html")));
});

try {
  // listen
  app.listen(process.env.LISTEN_PORT, (): void => {
    console.log(`Start on port ${process.env.LISTEN_PORT}.`);
  });
} catch (e) {
  console.error(e);
}

// process SIGINT
// 異常終了時は実行されない
process.on("SIGINT", async (): Promise<void> => {
  try {
    console.log("process SIGINT");

    // データベース接続プールを終了する
    await closeDatabaseConnectionPool();

    process.exit(0);
  } catch (e) {
    console.error(e);
  }
});
// process exit
// 非同期処理を行えない
process.on("exit", (): void => {
  try {
    console.log("process exit");
  } catch (e) {
    console.error(e);
  }
});
