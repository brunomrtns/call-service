import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { AuthPayload, UserType } from "@/types";
import logger from "@/utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid token." });
  }
};

export const authorize = (...roles: UserType[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Access denied. Not authenticated." });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.type)) {
      res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
      return;
    }

    next();
  };
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    next();
  }
};
