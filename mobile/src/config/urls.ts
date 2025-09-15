// ========================================
// CONFIGURAÇÕES DE REDE - IPs FIXOS
// ========================================

// IP do servidor backend (autenticação, API, proxy)
const BACKEND_IP = "192.168.15.165";
const BACKEND_PORT = "3443"; // Você pode ajustar a porta se necessário

// IP do servidor Asterisk (SIP)
const ASTERISK_IP = "192.168.15.176";
const ASTERISK_PORT = "8089"; // Porta WebSocket do Asterisk

// ========================================
// URLs DO BACKEND
// ========================================

export const API_BASE_URL = `https://${BACKEND_IP}:${BACKEND_PORT}`;
export const WS_BASE_URL = `wss://${BACKEND_IP}:${BACKEND_PORT}/ws/device-status`;

// ========================================
// URLs DO ASTERISK (SIP)
// ========================================

export const ASTERISK_HOST = ASTERISK_IP;
export const SIP_WS_URI = `wss://${ASTERISK_IP}:${ASTERISK_PORT}/asterisk/ws`;
export const SIP_REALM = ASTERISK_IP;
export const SIP_PASSWORD_DEFAULT = "Teste123";

// ========================================
// FUNÇÕES DE COMPATIBILIDADE
// ========================================

// Para compatibilidade com código existente que espera funções assíncronas
export const getBaseURL = async (): Promise<string> => {
  return API_BASE_URL;
};

export const getWebSocketURL = async (): Promise<string> => {
  return WS_BASE_URL;
};

// Para compatibilidade com código existente que espera funções síncronas
export const getBaseURLSync = (): string => {
  return API_BASE_URL;
};

export const getWebSocketURLSync = (): string => {
  return WS_BASE_URL;
};

// Para compatibilidade com código que espera funções para SIP
export const getAsteriskHost = (): string => {
  return ASTERISK_HOST;
};

export const getSipWsUri = (): string => {
  return SIP_WS_URI;
};

export const getSipRealm = (): string => {
  return SIP_REALM;
};

// ========================================
// FUNÇÕES DE INICIALIZAÇÃO (SIMPLIFICADAS)
// ========================================

export const initializeURLs = async (): Promise<void> => {
  try {
    console.log("🚀 URLs configuradas:");
    console.log("📡 API_BASE_URL:", API_BASE_URL);
    console.log("� WS_BASE_URL:", WS_BASE_URL);
    console.log("� SIP_WS_URI:", SIP_WS_URI);

    // Atualiza o axios baseURL se estiver disponível
    try {
      const axios = require("axios").default;
      if (axios && axios.defaults) {
        axios.defaults.baseURL = API_BASE_URL;
      }
    } catch {
      // Axios não está disponível, não tem problema
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar URLs:", error);
  }
};

export const rediscoverBackend = async (): Promise<void> => {
  console.log("🔄 URLs estão fixas, não há necessidade de redescoberta");
  await initializeURLs();
};

// ========================================
// FUNÇÕES DE CONFIGURAÇÃO DINÂMICA
// ========================================

// Se no futuro você quiser alterar os IPs dinamicamente
export const updateBackendConfig = (
  newIP: string,
  newPort: string = BACKEND_PORT
): void => {
  console.log(`🔄 Atualizando backend para ${newIP}:${newPort}`);
  // Para implementar: atualizar as constantes dinamicamente se necessário
};

export const updateAsteriskConfig = (
  newIP: string,
  newPort: string = ASTERISK_PORT
): void => {
  console.log(`🔄 Atualizando Asterisk para ${newIP}:${newPort}`);
  // Para implementar: atualizar as constantes dinamicamente se necessário
};
