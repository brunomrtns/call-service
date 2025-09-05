import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import Database from "@/config/database";
import { config } from "@/config";
import logger from "@/utils/logger";
import {
  AuthPayload,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserType,
} from "@/types";

export class UserService {
  private db: PrismaClient;

  constructor() {
    this.db = Database.getInstance();
  }

  public async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginRequest;

    try {
      const user = await this.db.user.findUnique({
        where: { username },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const payload: AuthPayload = {
        userId: user.id,
        username: user.username,
        type: user.type as UserType,
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      } as any);

      logger.info(`User logged in: ${username}`);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          type: user.type as UserType,
          email: user.email,
          device: user.device || undefined,
        },
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  public async createUser(createUserRequest: CreateUserRequest): Promise<any> {
    const {
      name,
      username,
      email,
      password,
      type = UserType.CLIENT,
    } = createUserRequest;

    try {
      // Check if username or email already exists
      const existingUser = await this.db.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existingUser) {
        throw new Error("Username or email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate device if needed
      let device: string | undefined;
      let devicePassword: string | undefined;

      if (type !== UserType.ADMIN) {
        device = await this.generateUniqueDevice();
        devicePassword = await bcrypt.hash(device, 10);
      }

      const user = await this.db.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
          type,
          device,
          devicePassword,
        },
      });

      logger.info(`User created: ${username} with device: ${device}`);

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        type: user.type,
        device: user.device,
      };
    } catch (error) {
      logger.error("Create user error:", error);
      throw error;
    }
  }

  public async updateUser(
    userId: number,
    updateUserRequest: UpdateUserRequest
  ): Promise<any> {
    const { name, email, password, device } = updateUserRequest;

    try {
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (device) {
        updateData.device = device;
        updateData.devicePassword = await bcrypt.hash(device, 10);
      }
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await this.db.user.update({
        where: { id: userId },
        data: updateData,
      });

      logger.info(`User updated: ${user.username}`);

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        type: user.type,
        device: user.device,
      };
    } catch (error) {
      logger.error("Update user error:", error);
      throw error;
    }
  }

  public async getUserById(userId: number): Promise<any> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        type: user.type,
        device: user.device,
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error("Get user error:", error);
      throw error;
    }
  }

  public async getAllUsers(): Promise<any[]> {
    try {
      const users = await this.db.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          type: true,
          device: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return users;
    } catch (error) {
      logger.error("Get all users error:", error);
      throw error;
    }
  }

  public async deleteUser(userId: number): Promise<void> {
    try {
      await this.db.user.delete({
        where: { id: userId },
      });

      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      logger.error("Delete user error:", error);
      throw error;
    }
  }

  private async generateUniqueDevice(): Promise<string> {
    const { rangeStart, rangeEnd } = config.device;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const device =
        Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
      const deviceStr = device.toString();

      const existingDevice = await this.db.user.findUnique({
        where: { device: deviceStr },
      });

      if (!existingDevice) {
        return deviceStr;
      }

      attempts++;
    }

    throw new Error("Unable to generate unique device number");
  }

  public verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as AuthPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

export default new UserService();
