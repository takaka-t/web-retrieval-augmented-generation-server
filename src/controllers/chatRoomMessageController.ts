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
      // 対象のチャットルームが正常か確認
      const result = await connection.query("SELECT COUNT(*) AS count FROM chat_room WHERE chat_room.chat_room_id = ? AND chat_room.create_session_user_id = ? AND chat_room.is_logical_delete = ?", [
        targetChatRoomId,
        request.session.id,
        false,
      ]);
      // 取得結果が1件以外の場合は不正なリクエスト
      if (Number(result[0].count) !== 1) {
        response.status(400).json({ message: "対象のチャットルームが不正です" });
        return;
      }

      // チャットルームメッセージ取得
      const rows = await connection.query(
        "SELECT chat_room_message.chat_room_id, chat_room_message.chat_room_message_id, chat_room_message.is_sender_bot, chat_room_message.message_content, chat_room_message.send_datetime FROM chat_room_message WHERE chat_room_message.chat_room_id = ? AND chat_room_message.is_logical_delete = ?",
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
      // 対象のチャットルームが正常か確認
      const result = await connection.query("SELECT COUNT(*) AS count FROM chat_room WHERE chat_room.chat_room_id = ? AND chat_room.create_session_user_id = ? AND chat_room.is_logical_delete = ?", [
        targetChatRoomId,
        request.session.id,
        false,
      ]);
      // 取得結果が1件以外の場合は不正なリクエスト
      if (Number(result[0].count) !== 1) {
        response.status(400).json({ message: "対象のチャットルームが不正です" });
        return;
      }

      /**
       * チャットルームメッセージ履歴
       * ※直近の3往復(6件)を取得
       */
      const chatRoomMessagesHistory: { isSenderBot: boolean; messageContent: string }[] = (
        await connection.query(
          "SELECT chat_room_message.is_sender_bot, chat_room_message.message_content, chat_room_message.send_datetime FROM chat_room_message WHERE chat_room_message.chat_room_id = ? AND chat_room_message.is_logical_delete = ? ORDER BY chat_room_message.chat_room_message_id DESC LIMIT 6",
          [targetChatRoomId, false]
        )
      )
        .reverse() // 昇順に変換
        .map((row: any) => {
          return {
            isSenderBot: Boolean(row.is_sender_bot),
            messageContent: String(row.message_content),
          };
        });

      // 今回の新規チャットルームメッセージを追加
      chatRoomMessagesHistory.push({ isSenderBot: false, messageContent: newChatRoomMessage });

      /** チャットボット回答取得 */
      let replyMessage = await global.createThreadAndRun({
        messages: chatRoomMessagesHistory.map((chatRoomMessage) => {
          return { role: chatRoomMessage.isSenderBot ? "assistant" : "user", content: chatRoomMessage.messageContent };
        }),
      });

      // チャットボットが回答できなかった場合
      if (replyMessage !== "@@FALSE@@") {
        // 回答できなかった内容を作成
        const unanseredContentText = chatRoomMessagesHistory
          .map((chatRoomMessage) => {
            return `- ${chatRoomMessage.isSenderBot ? "ChatBot" : "You"} - \n${chatRoomMessage.messageContent}`;
          })
          .join("\n");

        // 回答できなかった内容IDの最大値を取得
        const maxUnansweredContentId = Number(
          (await connection.query("SELECT IFNULL(MAX(unanswered_content.unanswered_content_id), 0) AS max_unanswered_content_id FROM unanswered_content"))[0].max_unanswered_content_id
        );

        // 回答できなかった内容を登録
        await connection.query("INSERT INTO unanswered_content (unanswered_content_id, unanswered_content_text, unanswered_content_chat_room_id) VALUES (?, ?, ?)", [
          maxUnansweredContentId + 1,
          unanseredContentText,
          targetChatRoomId,
        ]);

        // 回答できなかった場合の返信メッセージを作成
        replyMessage = "申し訳ありませんが回答できませんでした。\n情報が不足しているか関係のない質問です。";
      }

      // TODO:新規ID取得時にロックしないとPK違反が起きる恐れあり

      /** MaxチャットルームメッセージID */
      let maxChatRoomMessageId = Number(
        (
          await connection.query("SELECT IFNULL(MAX(chat_room_message.chat_room_message_id), 0) AS max_chat_room_message_id FROM chat_room_message WHERE chat_room_message.chat_room_id = ?", [
            targetChatRoomId,
          ])
        )[0].max_chat_room_message_id
      );

      // 新規チャットルームメッセージ登録
      await connection.query(
        "INSERT INTO chat_room_message (chat_room_id, chat_room_message_id, is_sender_bot, message_content, send_datetime, is_logical_delete) VALUES (?, ?, ?, ?, NOW(), ?), (?, ?, ?, ?, NOW(), ?)",
        [targetChatRoomId, (maxChatRoomMessageId += 1), false, newChatRoomMessage, false, targetChatRoomId, (maxChatRoomMessageId += 1), true, replyMessage, false]
      );

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
      // 対象のチャットルームが正常か確認
      const result = await connection.query("SELECT COUNT(*) AS count FROM chat_room WHERE chat_room.chat_room_id = ? AND chat_room.create_session_user_id = ? AND chat_room.is_logical_delete = ?", [
        targetChatRoomId,
        request.session.id,
        false,
      ]);
      // 取得結果が1件以外の場合は不正なリクエスト
      if (Number(result[0].count) !== 1) {
        response.status(400).json({ message: "対象のチャットルームが不正です" });
        return;
      }

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
