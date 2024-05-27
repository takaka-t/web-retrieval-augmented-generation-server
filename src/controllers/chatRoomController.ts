import { Router } from "express";
const router = Router();

/**
 * チャットルーム全取得
 */
router.get("/get-all", async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // データ取得
      const rows = await connection.query(
        "SELECT chat_room.chat_room_id, chat_room.chat_room_name, chat_room.create_datetime, (SELECT MAX(chat_room_message.send_datetime) FROM chat_room_message WHERE chat_room_message.chat_room_id = chat_room.chat_room_id) AS last_chat_room_message_datetime FROM chat_room WHERE chat_room.create_session_user_id = ? AND chat_room.is_logical_delete = ?",
        [request.session.id, false]
      );

      // 変換
      const chatRooms = rows.map((row: any) => {
        return {
          chatRoomId: row.chat_room_id,
          chatRoomName: row.chat_room_name,
          createDatetime: row.create_datetime,
          lastChatRoomMessageDatetime: row.last_chat_room_message_datetime, // nullable
        };
      });

      // response
      response.status(200).json({ chatRooms: chatRooms });
      return;
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * 対象のチャットルーム取得
 */
router.get("/get-target", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (
      request.query.targetChatRoomId === undefined ||
      request.query.targetChatRoomId === null ||
      String(request.query.targetChatRoomId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.query.targetChatRoomId)) === false
    ) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 対象チャットルームID */
    const targetChatRoomId = Number(request.query.targetChatRoomId);

    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // データ取得
      const rows = await connection.query(
        "SELECT chat_room.chat_room_id, chat_room.chat_room_name, chat_room.create_datetime FROM chat_room WHERE chat_room.chat_room_id = ? AND chat_room.create_session_user_id = ? AND chat_room.is_logical_delete = ?",
        [targetChatRoomId, request.session.id, false]
      );

      // 取得結果が1件以外の場合は不正
      if (rows.length !== 1) {
        throw new Error("データを正しく取得できませんでした");
      }

      // 変換
      const row = rows[0];
      const chatRoom = {
        chatRoomId: row.chat_room_id,
        chatRoomName: row.chat_room_name,
        createDatetime: row.create_datetime,
      };

      // response
      response.status(200).json({ chatRoom: chatRoom });
      return;
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * チャットルーム作成
 */
router.post("/create-new", async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();

    try {
      // TODO:新規ID取得時にロックしないとPK違反が起きる恐れあり

      /** 新規チャットルームID */
      const newChatRoomId = Number((await connection.query("SELECT IFNULL(MAX(chat_room.chat_room_id), 0) + 1 AS new_chat_room_id FROM chat_room"))[0].new_chat_room_id);

      // チャットルーム登録
      await connection.query("INSERT INTO chat_room (chat_room_id, chat_room_name, create_session_user_id, create_datetime, is_logical_delete) VALUES (?, ?, ?, NOW(), ?)", [
        newChatRoomId,
        `チャットルーム ${newChatRoomId}`,
        request.session.id,
        false,
      ]);

      // response
      response.status(200).json({ newChatRoomId: newChatRoomId });
      return;
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * チャットルーム名更新
 */
router.post("/update-chat-room-name", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (
      request.body.targetChatRoomId === undefined ||
      request.body.targetChatRoomId === null ||
      String(request.body.targetChatRoomId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.body.targetChatRoomId)) === false ||
      request.body.newChatRoomName === undefined ||
      request.body.newChatRoomName === null ||
      String(request.body.newChatRoomName).length > 100
    ) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 対象チャットルームID */
    const targetChatRoomId = Number(request.body.targetChatRoomId);
    /** チャットルーム名 */
    const newChatRoomName = String(request.body.newChatRoomName);

    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // 対象チャットルーム名更新
      const result = await connection.query("UPDATE chat_room SET chat_room_name = ? WHERE chat_room_id = ? AND create_session_user_id = ?", [newChatRoomName, targetChatRoomId, request.session.id]);
      console.log("update", "id", targetChatRoomId, "affectedRows", result.affectedRows);

      // response
      response.status(200).json();
      return;
    } finally {
      // DB接続終了
      await connection.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * チャットルーム論理削除
 */
router.post("/logical-delete-target", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (
      request.body.targetChatRoomId === undefined ||
      request.body.targetChatRoomId === null ||
      String(request.body.targetChatRoomId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.body.targetChatRoomId)) === false
    ) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 対象チャットルームID */
    const targetChatRoomId = Number(request.body.targetChatRoomId);

    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // チャットルーム論理削除
      const result = await connection.query("UPDATE chat_room SET is_logical_delete = ? WHERE chat_room_id = ? AND create_session_user_id = ?", [true, targetChatRoomId, request.session.id]);
      console.log("delete", "id", targetChatRoomId, "affectedRows", result.affectedRows);

      // response
      response.status(200).json();
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
