import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import logger from "@/utils/logger";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      logger.error("Validation error:", errorMessage);
      res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  login: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6),
  }),

  createUser: Joi.object({
    name: Joi.string().required().min(2).max(100),
    username: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    type: Joi.string().valid("client", "attendant", "admin").optional(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    device: Joi.string()
      .pattern(/^\d{4}$/)
      .optional(),
  }),

  makeCall: Joi.object({
    callerDevice: Joi.string()
      .pattern(/^\d{4}$/)
      .when('targetUserId', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
    calleeDevice: Joi.string()
      .pattern(/^\d{4}$/)
      .when('targetUserId', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
    targetUserId: Joi.number().optional(),
    callType: Joi.string()
      .valid("internal", "external", "conference", "transfer")
      .optional(),
  }),

  transferCall: Joi.object({
    callId: Joi.string().required(),
    targetDevice: Joi.string()
      .required()
      .pattern(/^\d{4}$/),
    transferType: Joi.string().valid("attended", "blind").optional(),
  }),

  callNotes: Joi.object({
    notes: Joi.string().required().max(500),
  }),
};
