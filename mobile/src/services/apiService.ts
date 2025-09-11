import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { CONSTANTS } from "../constants";

const API_BASE_URL = CONSTANTS.AUTH.AUTH_SERVER;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
    }
    console.log("[API REQUEST]", config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("[API REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(
      "[API RESPONSE]",
      response.config.method?.toUpperCase(),
      response.config.url,
      {
        status: response.status,
        data: response.data,
      }
    );
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem("authToken");
    }
    if (error.response) {
      console.error(
        "[API RESPONSE ERROR]",
        error.config?.method?.toUpperCase(),
        error.config?.url,
        {
          status: error.response.status,
          data: error.response.data,
        }
      );
    } else {
      console.error("[API RESPONSE ERROR]", error);
    }
    return Promise.reject(error);
  }
);

export interface CreateChatRoomData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  maxUsers?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model_used?: string;
  conversationId?: number;
  userId?: number;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface Conversation {
  id: number;
  title: string;
  userId: number;
  isActive: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface CreateConversationData {
  title: string;
}

export interface AuthCredentials {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

export class APIService {
  static async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/authenticate", credentials);
    if (response.data.token) {
      await AsyncStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem("authToken");
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem("authToken");
    return !!token;
  }

  static async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get("/conversations");
    return response.data;
  }

  static async createConversation(
    data: CreateConversationData
  ): Promise<Conversation> {
    const response = await apiClient.post("/conversations", data);
    return response.data;
  }

  static async createChatRoom(data: CreateChatRoomData): Promise<any> {
    const response = await apiClient.post("/chatrooms", data);
    return response.data;
  }

  static async getConversation(id: number): Promise<Conversation> {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  }

  static async updateConversation(
    id: number,
    data: Partial<CreateConversationData>
  ): Promise<Conversation> {
    const response = await apiClient.put(`/conversations/${id}`, data);
    return response.data;
  }

  static async deleteConversation(id: number): Promise<void> {
    await apiClient.delete(`/conversations/${id}`);
  }

  static async getMessages(
    conversationId: number,
    page = 1,
    limit = 50,
    before?: string
  ): Promise<{
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(before && { before }),
    });

    const response = await apiClient.get(
      `/conversations/${conversationId}/messages?${params}`
    );
    return response.data;
  }

  static async deleteChatMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  }

  static async editChatMessage(
    messageId: string,
    content: string
  ): Promise<ChatMessage> {
    const response = await apiClient.put(`/messages/${messageId}`, {
      content,
    });
    return response.data.chatMessage;
  }

  static async sendMessage(
    messages: Omit<ChatMessage, "id" | "timestamp">[],
    conversationId?: number
  ): Promise<any> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await apiClient.post("/ai/chat", {
      messages: formattedMessages,
      ...(conversationId && { conversationId }),
    });

    return response.data;
  }

  static async getAIStatus(): Promise<any> {
    const response = await apiClient.get("/ai/status");
    return response.data;
  }

  static async checkUserAccess(): Promise<any> {
    const response = await apiClient.get("/");
    return response.data;
  }
}

export default APIService;
