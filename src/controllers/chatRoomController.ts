import { Router } from "express";
const router = Router();

/**
 * チャットルーム取得
 */
router.get("/get-all", async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // データ取得
      const rows = await connection.query("SELECT chat_room_id, chat_room_name, create_datetime, is_logical_delete FROM chat_room");

      // 変換
      const chatRooms = rows.map((row: any) => {
        return {
          chatRoomId: row.chat_room_id,
          chatRoomName: row.chat_room_name,
          createDatetime: row.create_datetime,
          isLogicalDelete: row.is_logical_delete,
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
 * チャットルーム取得
 * ※論理削除されていないもののみ取得
 */
router.get("/get-all-not-logical-deleted", async (request, response, next): Promise<void> => {
  try {
    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // データ取得
      const rows = await connection.query("SELECT chat_room_id, chat_room_name, create_datetime FROM chat_room WHERE is_logical_delete = ?", [false]);

      // 変換
      const chatRooms = rows.map((row: any) => {
        return {
          chatRoomId: row.chat_room_id,
          chatRoomName: row.chat_room_name,
          createDatetime: row.create_datetime,
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
      const rows = await connection.query("SELECT chat_room_id, chat_room_name, create_datetime, is_logical_delete FROM chat_room WHERE chat_room_id = ?", [targetChatRoomId]);

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
        isLogicalDelete: row.is_logical_delete,
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
      const newChatRoomId = Number((await connection.query("SELECT IFNULL(MAX(chat_room_id), 0) + 1 AS new_chat_room_id FROM chat_room"))[0].new_chat_room_id);

      // チャットルーム登録
      await connection.query("INSERT INTO chat_room (chat_room_id, chat_room_name, create_datetime, is_logical_delete) VALUES (?, ?, NOW(), ?)", [
        newChatRoomId,
        `チャットルーム ${newChatRoomId}`,
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
      await connection.query("UPDATE chat_room SET chat_room_name = ? WHERE chat_room_id = ?", [newChatRoomName, targetChatRoomId]);

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
      await connection.query("UPDATE chat_room SET is_logical_delete = ? WHERE chat_room_id = ?", [true, targetChatRoomId]);

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