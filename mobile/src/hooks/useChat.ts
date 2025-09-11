import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "bad-words";
import BadWordBr from "../constants/bad-word/bad-word-br.json";
import { APIService, ChatMessage, Conversation } from "../services/apiService";

export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (_content: string, _conversationId?: number) => Promise<void>;
  clearChat: () => void;
  error: string | null;
  currentConversation: Conversation | null;
  setCurrentConversation: (_conversation: Conversation | null) => void;
  loadMessages: (_conversationId: number) => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const messageIdCounter = useRef(0);

  const filter = useMemo(() => {
    const f = new Filter();
    f.addWords(...BadWordBr.words);
    return f;
  }, []);

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setLoading(true);
      const response = await APIService.getMessages(conversationId);
      const loadedMessages = response.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(loadedMessages);
      setError(null);
    } catch (error: any) {
      console.error("Erro ao carregar mensagens:", error);
      setError("Erro ao carregar mensagens da conversa");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, conversationId?: number) => {
      if (!content.trim()) return;

      setLoading(true);
      setError(null);

      try {
        if (filter.isProfane(content)) {
          setError(t("aiResponse.badWord"));
          return;
        }

        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: "user",
          content: content.trim(),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        const currentMessages = [...messages, userMessage];
        const messagesToSend = currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        if (currentMessages.length === 1) {
          messagesToSend.unshift({
            role: "system",
            content:
              t("aiResponse.systemPrompt") ||
              "Você é um assistente de IA útil e amigável.",
          });
        }

        const response = await APIService.sendMessage(
          messagesToSend,
          conversationId
        );

        const aiContent =
          response.choices?.[0]?.message?.content ||
          response.content ||
          "Desculpe, não consegui processar sua solicitação.";

        const aiMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
          model_used: response.model_used,
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error: any) {
        console.error("Erro ao enviar mensagem:", error);

        let errorMessage = "Erro ao processar a solicitação. Tente novamente.";

        if (error.response?.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error.response?.status === 503) {
          errorMessage = "Serviço de IA temporariamente indisponível.";
        } else if (error.code === "NETWORK_ERROR") {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        } else if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          errorMessage =
            "A IA está demorando para responder. Aguarde um momento e tente novamente.";
        }

        setError(errorMessage);

        const errorAiMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: `❌ ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorAiMessage]);

        // Se foi timeout ou demora, tentar recarregar as mensagens da conversa
        // para ver se a resposta foi salva no backend
        if (
          conversationId &&
          (error.code === "ECONNABORTED" || error.message?.includes("timeout"))
        ) {
          setTimeout(async () => {
            try {
              await loadMessages(conversationId);
            } catch (reloadError) {
              console.error("Erro ao recarregar mensagens:", reloadError);
            }
          }, 5000); // Aguarda 5 segundos antes de tentar recarregar
        }
      } finally {
        setLoading(false);
      }
    },
    [messages, t, filter, generateMessageId, loadMessages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    messageIdCounter.current = 0;
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearChat,
    error,
    currentConversation,
    setCurrentConversation,
    loadMessages,
  };
};

export default useChat;
