/**
 * Configurações específicas para HTTPS em desenvolvimento
 */
export const httpsConfig = {
  // Para desenvolvimento, configurar axios para aceitar certificados auto-assinados
  configureAxiosForDevelopment: () => {
    if (__DEV__) {
      // Para React Native, essas configurações não são aplicáveis diretamente
      // pois o React Native usa sua própria implementação de rede.
      // O Android usa a configuração network_security_config.xml
      // O iOS pode precisar de configurações específicas no Info.plist

      console.log("HTTPS configurado para desenvolvimento");
      console.log(
        "Certificados auto-assinados permitidos via network_security_config.xml (Android)"
      );
    }
  },

  // Função para testar conectividade HTTPS
  testHttpsConnection: async (baseURL: string): Promise<boolean> => {
    try {
      const axios = require("axios").default;
      const response = await axios.get(`${baseURL}/`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn("Erro ao testar conexão HTTPS:", error);
      return false;
    }
  },
};
