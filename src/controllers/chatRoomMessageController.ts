import { Router } from "express";
const router = Router();

/**
 * 対象チャットルームのチャットルームメッセージ取得
 */
router.get("/get-all", async (request, response, next): Promise<void> => {
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
      const rows = await connection.query("SELECT chat_room_id, chat_room_message_id, is_sender_bot, message_content, send_datetime, is_logical_delete FROM chat_room_message WHERE chat_room_id = ?", [
        targetChatRoomId,
      ]);

      // 変換
      const chatRoomMessages = rows.map((row: any) => {
        return {
          chatRoomId: row.chat_room_id,
          chatRoomMessageId: row.chat_room_message_id,
          isSenderBot: row.is_sender_bot,
          messageContent: row.message_content,
          sendDatetime: row.send_datetime,
          isLogicalDelete: row.is_logical_delete,
        };
      });

      // response
      response.status(200).json({ chatRoomMessages: chatRoomMessages });
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
 * 対象チャットルームのチャットルームメッセージ取得
 * ※論理削除されていないもののみ取得
 */
router.get("/get-all-not-logical-deleted", async (request, response, next): Promise<void> => {
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
        "SELECT chat_room_id, chat_room_message_id, is_sender_bot, message_content, send_datetime FROM chat_room_message WHERE chat_room_id = ? AND is_logical_delete = ?",
        [targetChatRoomId, false]
      );

      // 変換
      const chatRoomMessages = rows.map((row: any) => {
        return {
          chatRoomId: row.chat_room_id,
          chatRoomMessageId: row.chat_room_message_id,
          isSenderBot: row.is_sender_bot,
          messageContent: row.message_content,
          sendDatetime: row.send_datetime,
        };
      });

      // response
      response.status(200).json({ chatRoomMessages: chatRoomMessages });
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
 * 対象チャットルームのチャットルームメッセージ送信
 */
router.post("/send-new", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (
      request.body.targetChatRoomId === undefined ||
      request.body.targetChatRoomId === null ||
      String(request.body.targetChatRoomId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.body.targetChatRoomId)) === false ||
      request.body.newChatRoomMessage === undefined ||
      request.body.newChatRoomMessage === null ||
      String(request.body.newChatRoomMessage) === "" ||
      String(request.body.newChatRoomMessage).length > 300
    ) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 対象チャットルームID */
    const targetChatRoomId = Number(request.body.targetChatRoomId);
    /** 新規チャットルームメッセージ */
    const newChatRoomMessage = String(request.body.newChatRoomMessage);

    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();

    try {
      // TODO:新規ID取得時にロックしないとPK違反が起きる恐れあり

      /** 新規チャットルームメッセージID */
      const newChatRoomMessageId = Number(
        (await connection.query("SELECT IFNULL(MAX(chat_room_message_id), 0) + 1 AS new_chat_room_message_id FROM chat_room_message WHERE chat_room_id = ?", [targetChatRoomId]))[0]
          .new_chat_room_message_id
      );

      // 新規チャットルームメッセージ登録
      await connection.query("INSERT INTO chat_room_message (chat_room_id, chat_room_message_id, is_sender_bot, message_content, send_datetime, is_logical_delete) VALUES (?, ?, ?, ?, NOW(), ?)", [
        targetChatRoomId,
        newChatRoomMessageId,
        false,
        newChatRoomMessage,
        false,
      ]);

      // TODO:ボット側メッセージ作成 OPENAI API呼び出し
      // チャットルームメッセージ履歴取得
      await global.createThreadAndRun();

      // チャットボット回答取得
      const chatBotResponse = "TODO:チャットボット回答";

      // チャットボット回答チャットルームメッセージ登録
      await connection.query("INSERT INTO chat_room_message (chat_room_id, chat_room_message_id, is_sender_bot, message_content, send_datetime, is_logical_delete) VALUES (?, ?, ?, ?, NOW(), ?)", [
        targetChatRoomId,
        newChatRoomMessageId + 1,
        true,
        chatBotResponse,
        false,
      ]);

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
 * チャットルームメッセージ論理削除
 * ※対象のチャットルームメッセージ以降を論理削除する
 */
router.post("/logical-delete-target", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (
      request.body.targetChatRoomId === undefined ||
      request.body.targetChatRoomId === null ||
      String(request.body.targetChatRoomId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.body.targetChatRoomId)) === false ||
      request.body.targetChatRoomMessageId === undefined ||
      request.body.targetChatRoomMessageId === null ||
      String(request.body.targetChatRoomMessageId) === "" ||
      new RegExp("^[1-9]+[0-9]*$").test(String(request.body.targetChatRoomMessageId)) === false
    ) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 対象チャットルームID */
    const targetChatRoomId = Number(request.body.targetChatRoomId);
    /** 対象チャットルームメッセージID */
    const targetChatRoomMessageId = Number(request.body.targetChatRoomMessageId);

    /** DB接続 */
    const connection = await global.databaseConnectionPool.getConnection();
    try {
      // 対象のチャットルームメッセージ以降のチャットルームメッセージ論理削除
      await connection.query("UPDATE chat_room_message SET is_logical_delete = ? WHERE chat_room_id = ? AND chat_room_message_id >= ?", [true, targetChatRoomId, targetChatRoomMessageId]);

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
