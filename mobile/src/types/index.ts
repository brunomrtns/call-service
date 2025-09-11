export interface JsSIPSession {
  direction: "incoming" | "outgoing";
  remote_identity: {
    uri?: {
      user?: string;
    };
    display_name?: string;
  };
  answer: (_options: CallOptions) => void;
  terminate: () => void;
  on: (_event: string, _callback: (_data?: any) => void) => void;
}

export interface JsSIPUA {
  call: (_uri: string, _options: CallOptions) => JsSIPSession;
  stop: () => void;
  start: () => void;
  on: (_event: string, _callback: (_data?: any) => void) => void;
}

export interface User {
  id: number;
  name: string;
  username: string;
  device: string;
  sipStatus?: "online" | "offline" | "unavailable" | "unknown";
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact extends User {
  sipStatus: "online" | "offline" | "unavailable" | "unknown";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  username: string;
  password: string;
  email: string;
}

export interface SIPCall {
  session: JsSIPSession;
  direction: "incoming" | "outgoing";
  peerLabel: string;
}

export interface IncomingCall {
  session: JsSIPSession;
  fromDevice: string;
  fromName: string;
}

export interface Message {
  type: "success" | "error" | "info" | "warning" | "";
  text: string;
}

export interface AudioDevices {
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}

export interface MediaConstraintsConfig {
  audio: boolean | { deviceId: { exact: string } };
  video: boolean;
}

export interface RTCOfferConstraints {
  offerToReceiveAudio: boolean;
  offerToReceiveVideo: boolean;
}

export interface RTCConfiguration {
  iceServers: { urls: string }[];
}

export interface CallOptions {
  mediaConstraints: MediaConstraintsConfig;
  rtcOfferConstraints: RTCOfferConstraints;
  rtcConfiguration: RTCConfiguration;
}

export interface WebSocketMessage {
  type: "users-with-sip-status" | "users-with-sip-status-update" | string;
  data: Contact[];
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

export interface StatusBadgeProps {
  contact: Contact;
}

export interface UseSipConnectionReturn {
  ua: JsSIPUA | null;
  status: SIPStatus;
  connect: () => void;
  disconnect: () => void;
}

export interface StoredUserData {
  user: User;
  token: string;
}

export const SIP_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
} as const;

export type SIPStatus = (typeof SIP_STATUS)[keyof typeof SIP_STATUS];

export const ASTERISK_HOST = "192.168.15.176";
export const SIP_WS_URI = `ws://${ASTERISK_HOST}:8088/asterisk/ws`;
export const SIP_REALM = ASTERISK_HOST;
export const SIP_PASSWORD_DEFAULT = "Teste123";
