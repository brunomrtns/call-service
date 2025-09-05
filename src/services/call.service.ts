import { PrismaClient } from "@prisma/client";
import Database from "@/config/database";
import logger from "@/utils/logger";
import { CallHistory, CallStatus, CallType } from "@/types";

export class CallService {
  private db: PrismaClient;

  constructor() {
    this.db = Database.getInstance();
  }

  public async createCallHistory(
    callId: string,
    initiatorId: number,
    receiverId: number,
    initiatorDevice: string,
    receiverDevice: string,
    callType: CallType = CallType.INTERNAL
  ): Promise<CallHistory> {
    try {
      const callHistory = await this.db.callHistory.create({
        data: {
          callId,
          initiatorId,
          receiverId,
          initiatorDevice,
          receiverDevice,
          status: CallStatus.INITIATED,
          callType,
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
      });

      logger.info(`Call history created: ${callId}`);
      return callHistory as any;
    } catch (error) {
      logger.error("Error creating call history:", error);
      throw error;
    }
  }

  public async updateCallStatus(
    callId: string,
    status: CallStatus,
    endTime?: Date,
    duration?: number
  ): Promise<CallHistory> {
    try {
      const updateData: any = { status };

      if (endTime) updateData.endTime = endTime;
      if (duration) updateData.duration = duration;

      const callHistory = await this.db.callHistory.update({
        where: { callId },
        data: updateData,
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
      });

      logger.info(`Call status updated: ${callId} -> ${status}`);
      return callHistory as any;
    } catch (error) {
      logger.error("Error updating call status:", error);
      throw error;
    }
  }

  public async transferCall(
    callId: string,
    transferredTo: string,
    transferredBy: string
  ): Promise<CallHistory> {
    try {
      const callHistory = await this.db.callHistory.update({
        where: { callId },
        data: {
          status: CallStatus.TRANSFERRED,
          transferredTo,
          transferredBy,
          endTime: new Date(),
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
      });

      logger.info(`Call transferred: ${callId} -> ${transferredTo}`);
      return callHistory as any;
    } catch (error) {
      logger.error("Error transferring call:", error);
      throw error;
    }
  }

  public async getCallHistory(
    userId?: number,
    limit = 50,
    offset = 0
  ): Promise<CallHistory[]> {
    try {
      const where = userId
        ? {
            OR: [{ initiatorId: userId }, { receiverId: userId }],
          }
        : {};

      const callHistory = await this.db.callHistory.findMany({
        where,
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      return callHistory as any;
    } catch (error) {
      logger.error("Error getting call history:", error);
      throw error;
    }
  }

  public async getCallById(callId: string): Promise<CallHistory | null> {
    try {
      const callHistory = await this.db.callHistory.findUnique({
        where: { callId },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
      });

      return callHistory as any;
    } catch (error) {
      logger.error("Error getting call by ID:", error);
      throw error;
    }
  }

  public async getActiveCallsByUser(userId: number): Promise<CallHistory[]> {
    try {
      const activeCalls = await this.db.callHistory.findMany({
        where: {
          OR: [{ initiatorId: userId }, { receiverId: userId }],
          status: {
            in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.ANSWERED],
          },
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return activeCalls as any;
    } catch (error) {
      logger.error("Error getting active calls:", error);
      throw error;
    }
  }

  public async addCallNotes(
    callId: string,
    notes: string
  ): Promise<CallHistory> {
    try {
      const callHistory = await this.db.callHistory.update({
        where: { callId },
        data: { notes },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              device: true,
            },
          },
        },
      });

      logger.info(`Notes added to call: ${callId}`);
      return callHistory as any;
    } catch (error) {
      logger.error("Error adding call notes:", error);
      throw error;
    }
  }

  public async getCallStatistics(userId?: number): Promise<any> {
    try {
      const where = userId
        ? {
            OR: [{ initiatorId: userId }, { receiverId: userId }],
          }
        : {};

      const totalCalls = await this.db.callHistory.count({ where });

      const answeredCalls = await this.db.callHistory.count({
        where: {
          ...where,
          status: CallStatus.ANSWERED,
        },
      });

      const missedCalls = await this.db.callHistory.count({
        where: {
          ...where,
          status: CallStatus.MISSED,
        },
      });

      const averageDuration = await this.db.callHistory.aggregate({
        where: {
          ...where,
          duration: { not: null },
        },
        _avg: {
          duration: true,
        },
      });

      return {
        totalCalls,
        answeredCalls,
        missedCalls,
        averageDuration: averageDuration._avg.duration || 0,
      };
    } catch (error) {
      logger.error("Error getting call statistics:", error);
      throw error;
    }
  }
}

export default new CallService();
