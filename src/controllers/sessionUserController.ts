import { Router } from "express";
const router = Router();

/**
 * セッションユーザー情報を取得
 */
router.get("/get-session-user-info", async (request, response, next): Promise<void> => {
  try {
    // セッションユーザー名取得
    const sessionUserName = request.session.sessionUserName;

    // セッションユーザー情報が未設定の場合
    if (sessionUserName === undefined || sessionUserName === null) {
      // response
      response.status(200).json(null);
      return;
    }

    // response
    response.status(200).json({ sessionUserName: sessionUserName });
    return;
  } catch (error) {
    next(error);
  }
});

/**
 * セッションユーザー情報を設定
 */
router.post("/set-session-user-info", async (request, response, next): Promise<void> => {
  try {
    // requestデータ検証
    if (request.body.newSessionUserName === undefined || request.body.newSessionUserName === null || String(request.body.newSessionUserName).length > 100) {
      response.status(400).json({ message: "リクエストが不正です" });
      return;
    }

    /** 新規セッションユーザー名 */
    const newSessionUserName = String(request.body.newSessionUserName);

    // セッションユーザー名設定
    request.session.sessionUserName = newSessionUserName;

    // response
    response.status(200).json();
    return;
  } catch (error) {
    next(error);
  }
});

export default router;
