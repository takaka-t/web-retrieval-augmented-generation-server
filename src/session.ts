import expressSession, { SessionData, Store } from "express-session";

class CustomStore extends Store {
  constructor() {
    super();
  }

  async get(sid: string, callback: (err: any, session?: SessionData | null) => void): Promise<void> {
    console.log("get");
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
    console.log("set");
    try {
      /** DB接続 */
      const connection = await global.databaseConnectionPool.getConnection();
      try {
        // セッション初期化に必要な情報がない場合はエラー
        if (session.sessionUserName === undefined || String(session.sessionUserName).trim() === "") {
          throw new Error("sessionUserName is required");
        }

        // セッションに必要な情報を設定
        session.sessionUserLastAccessDatetime = new Date();
        session.isAdminAuthenticated = false;

        // セッションデータを保存
        await this.saveSessionData(sid, session);

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
    console.log("destroy");
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
    console.log("touch");
    try {
      /** DB接続 */
      const connection = await global.databaseConnectionPool.getConnection();
      try {
        // セッションユーザーの最終アクセス日時を更新
        session.sessionUserLastAccessDatetime = new Date();

        // セッションデータを保存
        await this.saveSessionData(sid, session);

        if (callback !== undefined) callback();
      } finally {
        // DB接続終了
        await connection.end();
      }
    } catch (err) {
      if (callback !== undefined) callback();
    }
  }

  /**
   * セッションデータを保存
   * @param sid
   * @param session
   */
  private async saveSessionData(sid: string, session: SessionData): Promise<void> {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // セッションデータをJson形式の文字列に変換
      const sessionData = JSON.stringify(session);
      // セッションユーザー登録
      await connection.query("REPLACE INTO session_user (session_user_id, session_user_data, is_logical_delete) VALUES (?, ?, ?)", [sid, sessionData, false]);
      // is_logical_delete は初期値のために false固定 とする
      // もし true となっている場合は get で取得できないのでここで false に更新させることはない
    } finally {
      // DB接続終了
      await connection.end();
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
