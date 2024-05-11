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

// logger
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
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
