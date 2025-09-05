import { Router } from "express";
import userRoutes from "./users";
import callRoutes from "./calls";

const router = Router();

// API routes
router.use("/users", userRoutes);
router.use("/calls", callRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "call-service",
  });
});

export default router;
