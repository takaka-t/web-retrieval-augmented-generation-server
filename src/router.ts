import { Router } from "express";
const router = Router();

// testController
import testController from "./controllers/testController";
router.use("/test", testController);

// chatRoomController
import chatRoomController from "./controllers/chatRoomController";
router.use("/chat-room", chatRoomController);

// chatRoomMessageController
import chatRoomMessageController from "./controllers/chatRoomMessageController";
router.use("/chat-room-message", chatRoomMessageController);

export default router;
