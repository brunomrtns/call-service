import { Router } from "express";
import userController from "@/controllers/user.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validateRequest, schemas } from "@/middleware/validation";
import { UserType } from "@/types";

const router = Router();

router.post("/login", validateRequest(schemas.login), userController.login);
router.post(
  "/register",
  validateRequest(schemas.createUser),
  userController.register
);

router.use(authenticate);

router.get("/profile", userController.getProfile);

router.get("/online", userController.getOnlineUsers);

router.get("/with-sip-status", userController.getUsersWithSipStatus);
router.put(
  "/profile",
  validateRequest(schemas.updateUser),
  userController.updateProfile
);

router.get(
  "/",
  authorize(UserType.ADMIN, UserType.ATTENDANT),
  userController.getAllUsers
);
router.post(
  "/",
  authorize(UserType.ADMIN),
  validateRequest(schemas.createUser),
  userController.createUser
);
router.get(
  "/:id",
  authorize(UserType.ADMIN, UserType.ATTENDANT),
  userController.getUserById
);
router.put(
  "/:id",
  authorize(UserType.ADMIN),
  validateRequest(schemas.updateUser),
  userController.updateUser
);
router.delete("/:id", authorize(UserType.ADMIN), userController.deleteUser);

export default router;
