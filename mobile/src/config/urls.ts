import { Platform } from "react-native";

// Função para detectar IP da rede automaticamente
const detectNetworkIP = async (): Promise<string> => {
  try {
    if (Platform.OS === "web") {
      // No web, usa o hostname atual
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "localhost";
      }
      return hostname;
    } else {
      // Para mobile, tenta detectar IPs comuns da rede local
      // Você pode expandir esta lista com IPs específicos da sua rede
      const commonIPs = [
        "192.168.15.165", // IP atual configurado
        "192.168.15.176", // IP do Asterisk
        "192.168.1.100", // IPs comuns
        "192.168.0.100",
        "10.0.0.100",
      ];

      // Tenta fazer um teste de conectividade básico
      for (const ip of commonIPs) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);

          const response = await fetch(`http://${ip}:3001/`, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`IP detectado automaticamente: ${ip}`);
            return ip;
          }
        } catch {
          // Continua tentando próximo IP
        }
      }

      // Fallback para IP padrão se nenhum funcionar
      return "192.168.15.165";
    }
  } catch {
    console.warn("Erro ao detectar IP da rede, usando fallback");
    return "192.168.15.165";
  }
};

// Cache do IP detectado
let cachedIP: string | null = null;

// Configuração de URLs baseada no ambiente
export const getBaseURL = async (): Promise<string> => {
  if (!cachedIP) {
    cachedIP = await detectNetworkIP();
  }

  if (Platform.OS === "web") {
    // Para web, detecta automaticamente o protocolo e host
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    return `${protocol}//${cachedIP}:3001`;
  } else if (__DEV__) {
    // Para desenvolvimento mobile, usa IP detectado
    return `http://${cachedIP}:3001`;
  } else {
    // Para produção, use o servidor real
    return "https://your-production-server.com";
  }
};

export const getWebSocketURL = async (): Promise<string> => {
  const baseURL = await getBaseURL();
  return baseURL.replace("http", "ws") + "/ws/device-status";
};

// Versões síncronas para compatibilidade (usando IP em cache ou fallback)
export const getBaseURLSync = (): string => {
  const ip = cachedIP || "192.168.15.165";

  if (Platform.OS === "web") {
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    return `${protocol}//${ip}:3001`;
  } else if (__DEV__) {
    return `http://${ip}:3001`;
  } else {
    return "https://your-production-server.com";
  }
};

export const getWebSocketURLSync = (): string => {
  const baseURL = getBaseURLSync();
  return baseURL.replace("http", "ws") + "/ws/device-status";
};

// URLs específicas (inicializadas de forma síncrona, mas atualizadas dinamicamente)
export let API_BASE_URL = getBaseURLSync();
export let WS_BASE_URL = getWebSocketURLSync();

// Função para inicializar URLs dinamicamente
export const initializeURLs = async (): Promise<void> => {
  try {
    API_BASE_URL = await getBaseURL();
    WS_BASE_URL = await getWebSocketURL();

    console.log("URLs inicializadas:");
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("WS_BASE_URL:", WS_BASE_URL);

    // Atualiza o axios baseURL
    const axios = require("axios").default;
    if (axios && axios.defaults) {
      axios.defaults.baseURL = API_BASE_URL;
    }
  } catch (error) {
    console.error("Erro ao inicializar URLs:", error);
  }
};
