import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APIService, Conversation } from "../services/apiService";

const CONVERSATIONS_CACHE_KEY = "@conversations_cache";
const CACHE_TIMESTAMP_KEY = "@conversations_cache_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  addConversation: (_conversation: Conversation) => Promise<void>;
  removeConversation: (_conversationId: number) => Promise<void>;
  updateConversation: (
    _conversationId: number,
    _updates: Partial<Conversation>
  ) => Promise<void>;
  getConversationById: (_conversationId: number) => Conversation | undefined;
  clearCache: () => Promise<void>;
}

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const saveToCache = useCallback(async (conversations: Conversation[]) => {
    try {
      await AsyncStorage.setItem(
        CONVERSATIONS_CACHE_KEY,
        JSON.stringify(conversations)
      );
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  }, []);

  const loadFromCache = useCallback(async (): Promise<
    Conversation[] | null
  > => {
    try {
      const cached = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
      return null;
    }
  }, []);

  const loadConversationsWithCache = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar carregar do cache primeiro
      const cachedData = await loadFromCache();
      if (cachedData && cachedData.length > 0) {
        setConversations(cachedData);
        setLoading(false);

        // Verificar se o cache não está muito antigo
        const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
        const now = Date.now();
        const isStale =
          !cacheTimestamp || now - parseInt(cacheTimestamp) > CACHE_DURATION;

        if (!isStale) {
          return; // Cache ainda válido
        }
      }

      // Carregar dados atualizados da API
      const data = await APIService.getConversations();
      setConversations(data);
      await saveToCache(data);
    } catch (error: any) {
      console.error("Erro ao carregar conversas:", error);
      setError("Erro ao carregar conversas");

      // Se falhou, tentar usar cache mesmo que antigo
      const cachedData = await loadFromCache();
      if (cachedData && cachedData.length > 0) {
        setConversations(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getConversations();
      setConversations(data);
      await saveToCache(data);
    } catch (error: any) {
      console.error("Erro ao carregar conversas:", error);
      setError("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, [saveToCache]);

  const refreshConversations = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await APIService.getConversations();
      setConversations(data);
      await saveToCache(data);
    } catch (error: any) {
      console.error("Erro ao atualizar conversas:", error);
      setError("Erro ao atualizar conversas");
    } finally {
      setRefreshing(false);
    }
  }, [saveToCache]);

  const addConversation = useCallback(
    async (conversation: Conversation) => {
      const newConversations = [conversation, ...conversations];
      setConversations(newConversations);
      await saveToCache(newConversations);
    },
    [conversations, saveToCache]
  );

  const removeConversation = useCallback(
    async (conversationId: number) => {
      const filteredConversations = conversations.filter(
        (c) => c.id !== conversationId
      );
      setConversations(filteredConversations);
      await saveToCache(filteredConversations);
    },
    [conversations, saveToCache]
  );

  const updateConversation = useCallback(
    async (conversationId: number, updates: Partial<Conversation>) => {
      const updatedConversations = conversations.map((c) =>
        c.id === conversationId ? { ...c, ...updates } : c
      );
      setConversations(updatedConversations);
      await saveToCache(updatedConversations);
    },
    [conversations, saveToCache]
  );

  const getConversationById = useCallback(
    (conversationId: number): Conversation | undefined => {
      return conversations.find((c) => c.id === conversationId);
    },
    [conversations]
  );

  const clearCache = useCallback(async () => {
    setConversations([]);
    setError(null);
    setIsInitialized(false);
    try {
      await AsyncStorage.removeItem(CONVERSATIONS_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  }, []);

  // Carregar conversas pela primeira vez
  useEffect(() => {
    const initializeConversations = async () => {
      try {
        const authenticated = await APIService.isAuthenticated();
        if (authenticated && !isInitialized) {
          await loadConversationsWithCache();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Erro ao inicializar conversas:", error);
      }
    };

    initializeConversations();
  }, [isInitialized, loadConversationsWithCache]);

  const value: ConversationsContextType = {
    conversations,
    loading,
    refreshing,
    error,
    loadConversations,
    refreshConversations,
    addConversation,
    removeConversation,
    updateConversation,
    getConversationById,
    clearCache,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = (): ConversationsContextType => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error(
      "useConversations deve ser usado dentro de um ConversationsProvider"
    );
  }
  return context;
};
