import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import asteriskService from "@/services/asterisk.service";
import callService from "@/services/call.service";
import logger from "@/utils/logger";
import { CallRequest, TransferRequest, CallType, CallStatus } from "@/types";

export class CallController {
  public async makeCall(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const callRequest = req.body as CallRequest;

      // Create call history record
      const initiator = await this.getUserByDevice(callRequest.callerDevice);
      const receiver = await this.getUserByDevice(callRequest.calleeDevice);

      if (!initiator || !receiver) {
        res.status(404).json({ error: "Device not found" });
        return;
      }

      // Initiate call through Asterisk
      const channelId = await asteriskService.makeCall(callRequest);

      // Create call history
      const callHistory = await callService.createCallHistory(
        channelId,
        initiator.id,
        receiver.id,
        callRequest.callerDevice,
        callRequest.calleeDevice,
        callRequest.callType || CallType.INTERNAL
      );

      res.json({
        success: true,
        callId: channelId,
        callHistory,
      });
    } catch (error: any) {
      logger.error("Make call error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async answerCall(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { callId } = req.params;

      await asteriskService.answerCall(callId);
      await callService.updateCallStatus(callId, CallStatus.ANSWERED);

      res.json({ success: true, message: "Call answered" });
    } catch (error: any) {
      logger.error("Answer call error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async hangupCall(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { callId } = req.params;

      await asteriskService.hangupCall(callId);

      // Calculate duration if call was answered
      const callHistory = await callService.getCallById(callId);
      const endTime = new Date();
      let duration: number | undefined;

      if (callHistory && callHistory.status === CallStatus.ANSWERED) {
        duration = Math.floor(
          (endTime.getTime() - callHistory.startTime.getTime()) / 1000
        );
      }

      await callService.updateCallStatus(
        callId,
        CallStatus.ENDED,
        endTime,
        duration
      );

      res.json({ success: true, message: "Call ended" });
    } catch (error: any) {
      logger.error("Hangup call error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async transferCall(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const transferRequest = req.body as TransferRequest;
      const { callId } = req.params;

      await asteriskService.transferCall({
        ...transferRequest,
        callId,
      });

      // Update call history
      const currentUser = req.user;
      if (currentUser) {
        await callService.transferCall(
          callId,
          transferRequest.targetDevice,
          currentUser.username
        );
      }

      res.json({ success: true, message: "Call transferred" });
    } catch (error: any) {
      logger.error("Transfer call error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getCallHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const userIdFilter = userId ? parseInt(userId as string) : undefined;

      const callHistory = await callService.getCallHistory(
        userIdFilter,
        limit,
        offset
      );
      res.json(callHistory);
    } catch (error: any) {
      logger.error("Get call history error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getCallById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { callId } = req.params;

      const callHistory = await callService.getCallById(callId);
      if (!callHistory) {
        res.status(404).json({ error: "Call not found" });
        return;
      }

      res.json(callHistory);
    } catch (error: any) {
      logger.error("Get call by ID error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getActiveCalls(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const activeCalls = await callService.getActiveCallsByUser(
        req.user.userId
      );
      res.json(activeCalls);
    } catch (error: any) {
      logger.error("Get active calls error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async addCallNotes(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { callId } = req.params;
      const { notes } = req.body;

      const callHistory = await callService.addCallNotes(callId, notes);
      res.json(callHistory);
    } catch (error: any) {
      logger.error("Add call notes error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getCallStatistics(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.query;
      const userIdFilter = userId ? parseInt(userId as string) : undefined;

      const statistics = await callService.getCallStatistics(userIdFilter);
      res.json(statistics);
    } catch (error: any) {
      logger.error("Get call statistics error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getAsteriskStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const isConnected = asteriskService.isConnected();
      const activeCalls = await asteriskService.getActiveCalls();

      res.json({
        connected: isConnected,
        activeCalls: activeCalls.length,
        calls: activeCalls,
      });
    } catch (error: any) {
      logger.error("Get Asterisk status error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  private async getUserByDevice(device: string): Promise<any> {
    // This would be implemented using the user service
    // For now, we'll return a mock implementation
    return { id: 1, username: device };
  }
}

export default new CallController();
