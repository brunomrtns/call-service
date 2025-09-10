import { Router } from "express";
import userRoutes from "./users";
import asteriskRoutes from "./asterisk";

const router = Router();

router.use("/users", userRoutes);
router.use("/asterisk", asteriskRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

export default router;
