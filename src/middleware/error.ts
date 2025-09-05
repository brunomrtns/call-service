import { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Default error
  let error = {
    message: "Internal Server Error",
    status: 500,
  };

  // Prisma errors
  if (err.code === "P2002") {
    error.message = "Duplicate entry found";
    error.status = 409;
  } else if (err.code === "P2025") {
    error.message = "Record not found";
    error.status = 404;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.status = 401;
  } else if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.status = 401;
  }

  // Validation errors
  if (err.name === "ValidationError") {
    error.message = err.message;
    error.status = 400;
  }

  // Custom errors
  if (err.message && typeof err.status === "number") {
    error.message = err.message;
    error.status = err.status;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
