import { Platform } from "react-native";

// Configuração de URLs baseada no ambiente
export const getBaseURL = (): string => {
  return "http://192.168.15.165:3001";
  //   if (Platform.OS === "web") {
  //     // Para web, use localhost na mesma máquina
  //     return "http://192.168.15.165:3001";
  //   } else if (__DEV__) {
  //     // Para desenvolvimento mobile, use o IP da máquina host
  //     // Substitua pelo seu IP real se necessário
  //     return "http://192.168.15.176:3001";
  //   } else {
  //     // Para produção, use o servidor real
  //     return "https://your-production-server.com";
  //   }
};

export const getWebSocketURL = (): string => {
  const baseURL = getBaseURL();
  return baseURL.replace("http", "ws") + "/ws/device-status";
};

// URLs específicas
export const API_BASE_URL = getBaseURL();
export const WS_BASE_URL = getWebSocketURL();
