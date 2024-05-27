import expressSession, { SessionData, Store } from "express-session";

class CustomStore extends Store {
  constructor() {
    super();
  }

  async get(sid: string, callback: (err: any, session?: SessionData | null) => void): Promise<void> {
    try {
      /** DB接続 */
      const connection = await global.databaseConnectionPool.getConnection();
      try {
        // セッションユーザー取得
        const rows = await connection.query("SELECT session_user_data FROM session_user WHERE session_user_id = ? AND is_logical_delete = ?", [sid, false]);

        // 取得できない場合はセッションなし
        if (rows.length === 0) {
          return callback(null, null);
        }

        // セッションデータをJson形式の文字列からオブジェクトに変換
        const session = JSON.parse(rows[0].session_user_data);

        callback(null, session);
      } finally {
        // DB接続終了
        await connection.end();
      }
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      /** DB接続 */
      const connection = await global.databaseConnectionPool.getConnection();
      try {
        // セッションデータをJson形式の文字列に変換
        const sessionData = JSON.stringify(session);

        // セッションユーザー登録
        await connection.query("REPLACE INTO session_user (session_user_id, session_user_data, session_user_last_access_datetime, session_user_name, is_logical_delete) VALUES (?, ?, ?, ?, ?)", [
          sid,
          sessionData,
          new Date(),
          null,
          false,
        ]);

        if (callback !== undefined) callback(null);
      } finally {
        // DB接続終了
        await connection.end();
      }
    } catch (err) {
      if (callback !== undefined) callback(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // セッションユーザー削除
      await connection.query("UPDATE session_user SET is_logical_delete = ? WHERE session_user_id = ?", [true, sid]);

      if (callback !== undefined) callback(null);
    } catch (err) {
      if (callback !== undefined) callback(err);
    }
  }

  async touch(sid: string, session: SessionData, callback?: () => void): Promise<void> {
    try {
      /** DB接続 */
      const connection = await global.databaseConnectionPool.getConnection();
      try {
        // セッションユーザーの最終アクセス日時を更新
        await connection.query("UPDATE session_user SET session_user_last_access_datetime = ? WHERE session_user_id = ?", [new Date(), sid]);

        if (callback !== undefined) callback();
      } finally {
        // DB接続終了
        await connection.end();
      }
    } catch (err) {
      if (callback !== undefined) callback();
    }
  }
}

export const session = expressSession({
  secret: process.env.SESSION_SECRET!,
  name: "session-id",
  store: new CustomStore(),
  resave: false,
  saveUninitialized: false,
  rolling: false,
  proxy: false,
  unset: "destroy",
  cookie: {
    path: "/",
    httpOnly: true,
    secure: false,
    maxAge: undefined,
    sameSite: "lax",
  },
});
