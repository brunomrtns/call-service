import { Router } from "express";
import callController from "@/controllers/call.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validateRequest, schemas } from "@/middleware/validation";
import { UserType } from "@/types";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Call management routes
router.post(
  "/make",
  validateRequest(schemas.makeCall),
  callController.makeCall
);
router.post("/:callId/answer", callController.answerCall);
router.post("/:callId/hangup", callController.hangupCall);
router.post(
  "/:callId/transfer",
  validateRequest(schemas.transferCall),
  callController.transferCall
);

// Call history routes
router.get("/history", callController.getCallHistory);
router.get("/active", callController.getActiveCalls);
router.get("/statistics", callController.getCallStatistics);
router.get("/:callId", callController.getCallById);
router.post(
  "/:callId/notes",
  validateRequest(schemas.callNotes),
  callController.addCallNotes
);

// Asterisk status (admin only)
router.get(
  "/asterisk/status",
  authorize(UserType.ADMIN, UserType.ATTENDANT),
  callController.getAsteriskStatus
);

export default router;
