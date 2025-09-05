import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import userService from "@/services/user.service";
import logger from "@/utils/logger";
import { CreateUserRequest, UpdateUserRequest, UserType } from "@/types";

export class UserController {
  public async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await userService.login(req.body);
      res.json(result);
    } catch (error: any) {
      logger.error("Login error:", error);
      res.status(401).json({ error: error.message });
    }
  }

  public async register(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const result = await userService.createUser(
        req.body as CreateUserRequest
      );
      res.status(201).json(result);
    } catch (error: any) {
      logger.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  public async createUser(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const result = await userService.createUser(
        req.body as CreateUserRequest
      );
      res.status(201).json(result);
    } catch (error: any) {
      logger.error("Create user error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  public async updateUser(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.updateUser(
        userId,
        req.body as UpdateUserRequest
      );
      res.json(result);
    } catch (error: any) {
      logger.error("Update user error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  public async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const result = await userService.getUserById(req.user.userId);
      res.json(result);
    } catch (error: any) {
      logger.error("Get profile error:", error);
      res.status(404).json({ error: error.message });
    }
  }

  public async getUserById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getUserById(userId);
      res.json(result);
    } catch (error: any) {
      logger.error("Get user by ID error:", error);
      res.status(404).json({ error: error.message });
    }
  }

  public async getAllUsers(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const result = await userService.getAllUsers();
      res.json(result);
    } catch (error: any) {
      logger.error("Get all users error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getOnlineUsers(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { getSocketService } = await import("@/services/socket.service");
      const socketService = getSocketService();
      
      if (!socketService) {
        res.json([]);
        return;
      }
      
      const onlineUsers = socketService.getOnlineUsers();
      res.json(onlineUsers);
    } catch (error: any) {
      logger.error("Get online users error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async deleteUser(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      await userService.deleteUser(userId);
      res.status(204).send();
    } catch (error: any) {
      logger.error("Delete user error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  public async updateProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const result = await userService.updateUser(
        req.user.userId,
        req.body as UpdateUserRequest
      );
      res.json(result);
    } catch (error: any) {
      logger.error("Update profile error:", error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();
