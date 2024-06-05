import { Router } from "express";
import { verifyPassword } from "../password";
import { Consts } from "../consts";
const router = Router();

/**
 * 認証を行うAPIのパス
 * ※認証されているかの検証を行わないようにするため
 */
const authenticatePath = "/authenticate";

/**
 * 認証されているか検証する middleware
 */
router.use((request, response, next) => {
  // 認証を行うAPIのみ検証を行わない
  if (request.path.includes(authenticatePath)) {
    next();
    return;
  }

  // 認証されているか検証
  if (request.session.isAdminAuthenticated !== undefined && request.session.isAdminAuthenticated === true) {
    // 検証OK
    next();
    return;
  } else {
    // 検証NG
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
});

/**
 * 認証を行う
 */
router.post(authenticatePath, async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (request.body.inputedPassword === undefined || request.body.inputedPassword === null || String(request.body.inputedPassword).length > 100) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }
    /** 入力されたパスワード */
    const inputedPassword = String(request.body.inputedPassword);

    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // アプリケーション設定から管理者パスワードのハッシュ値とソルト値を取得
      const configs = await connection.query(
        `SELECT application_config_key, application_config_value FROM application_config WHERE application_config_key IN ('${Consts.ApplicationConfigKey.AdminPasswordSalt}', '${Consts.ApplicationConfigKey.AdminPasswordHash}')`
      );
      /** 管理者パスワードのソルト値 */
      const AdminPasswordSalt = String(configs.find((config: any) => String(config.application_config_key) === Consts.ApplicationConfigKey.AdminPasswordSalt).application_config_value);
      /** 管理者パスワードのハッシュ値 */
      const AdminPasswordHash = String(configs.find((config: any) => String(config.application_config_key) === Consts.ApplicationConfigKey.AdminPasswordHash).application_config_value);

      // パスワードの検証
      const isValid = verifyPassword({
        inputedPassword: inputedPassword,
        passwordSalt: AdminPasswordSalt,
        passwordHash: AdminPasswordHash,
      });

      // 検証結果で処理分岐
      if (isValid === true) {
        // 認証OK
        request.session.isAdminAuthenticated = true;
        response.status(200).json();
        return;
      } else {
        // 認証NG
        request.session.isAdminAuthenticated = false;
        response.status(401).json();
        return;
      }
    } finally {
      // DB接続終了
      await connection.end();
    }

    // 入力されたパスワードの検証を行う
  } catch (error) {
    next(error);
  }
});

/**
 * 回答できなかった内容を取得
 */
router.get("/get-unanswered-contents", async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // データ取得
      const rows = await connection.query("SELECT unanswered_content_id, unanswered_content_text, target_chat_room_id, create_datetime FROM unanswered_content");

      // 変換
      const unansweredContents = rows.map((row: any) => {
        return {
          unanswered_content_id: row.unanswered_content_id,
          unanswered_content_text: row.unanswered_content_text,
          target_chat_room_id: row.target_chat_room_id,
          create_datetime: row.create_datetime,
        };
      });

      // response
      response.status(200).json({ unansweredContents: unansweredContents });
      return;
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

export default router;
