import { Router } from "express";
const router = Router();

/**
 * GETテスト用
 */
router.get("/get-test", async (request, response, next): Promise<void> => {
  try {
    response.status(200).json({ result: "getTestOK" });
  } catch (error) {
    next(error);
  }
});

/**
 * POSTテスト用
 */
router.post("/post-test", async (request, response, next): Promise<void> => {
  try {
    console.log(request.body);
    const requestBody = { id: Number(request.body.id), name: String(request.body.name) };
    response.status(200).json({ newId: requestBody.id + 1 });
  } catch (error) {
    next(error);
  }
});

export default router;
