import { Router } from "express";
const router = Router();

// testController
import testController from "./controllers/testController";
router.use("/test", testController);

export default router;
