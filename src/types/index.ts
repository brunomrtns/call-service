export interface User {
  id: number;
  name: string;
  username: string;
  type: UserType;
  email: string;
  password: string;
  device?: string;
  devicePassword?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallHistory {
  id: string;
  callId: string;
  initiatorId: number;
  receiverId: number;
  initiatorDevice: string;
  receiverDevice: string;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  callType: CallType;
  transferredTo?: string;
  transferredBy?: string;
  recordingPath?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserType {
  CLIENT = "client",
  ATTENDANT = "attendant",
  ADMIN = "admin",
}

export enum CallStatus {
  INITIATED = "initiated",
  RINGING = "ringing",
  ANSWERED = "answered",
  BUSY = "busy",
  FAILED = "failed",
  ENDED = "ended",
  TRANSFERRED = "transferred",
  MISSED = "missed",
}

export enum CallType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  CONFERENCE = "conference",
  TRANSFER = "transfer",
}

export interface AsteriskCallEvent {
  type: string;
  application: string;
  timestamp: string;
  channel?: {
    id: string;
    name: string;
    state: string;
    caller: {
      name: string;
      number: string;
    };
    connected: {
      name: string;
      number: string;
    };
  };
}

export interface CallRequest {
  callerDevice: string;
  calleeDevice: string;
  callType?: CallType;
}

export interface TransferRequest {
  callId: string;
  targetDevice: string;
  transferType?: "attended" | "blind";
}

export interface SocketCallEvent {
  type:
    | "call_initiated"
    | "call_ringing"
    | "call_answered"
    | "call_ended"
    | "call_transferred";
  callId: string;
  data: any;
}

export interface AuthPayload {
  userId: number;
  username: string;
  type: UserType;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
    type: UserType;
    email: string;
    device?: string;
  };
}

export interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  type?: UserType;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  device?: string;
}
