import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  Text,
  TextInput,
  ActivityIndicator,
  Snackbar,
  IconButton,
} from "react-native-paper";

import { useRoute } from "@react-navigation/native";
import { useChat } from "../../../hooks/useChat";
import { useConversations } from "../../../contexts/ConversationsContext";
import Navbar from "../../../components/navbar";
import { useTheme } from "../../../theme/ThemeProvider";
import MessageBubble from "../../../components/message-bubble";

import { useHeaderHeight } from "@react-navigation/elements";

import { useStyles } from "./styles";

export default function ChatScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);
  const route = useRoute<any>();
  const { conversationId } = route.params || {};

  const headerHeight = useHeaderHeight();
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
  const keyboardOffset = headerHeight + statusBarHeight;

  const {
    messages,
    loading,
    sendMessage,
    error,
    currentConversation,
    setCurrentConversation,
    loadMessages,
  } = useChat();
  const { getConversationById, updateConversation } = useConversations();

  const [inputText, setInputText] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadConversation = useCallback(
    async (convId: number) => {
      try {
        const cachedConversation = getConversationById(convId);
        if (cachedConversation) {
          setCurrentConversation(cachedConversation);
          await loadMessages(convId);
        }
      } catch (error) {
        console.error("Erro ao carregar conversa:", error);
      }
    },
    [getConversationById, setCurrentConversation, loadMessages]
  );

  useEffect(() => {
    if (conversationId) {
      loadConversation(Number(conversationId));
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (error) setSnackbarVisible(true);
  }, [error]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const messageToSend = inputText.trim();
    setInputText("");
    setLoadingStartTime(Date.now());
    await sendMessage(messageToSend, Number(conversationId));
    if (currentConversation) {
      await updateConversation(currentConversation.id, {
        lastMessageAt: new Date(),
      });
    }
    setLoadingStartTime(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <View style={styles.content}>
        <Navbar
          showBackButton={true}
          isChatHeader={true}
          currentConversation={currentConversation}
          classTitle={styles.title}
          classSubtitle={styles.subtitle}
        />
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("sendAMessageToStart")}</Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isUser={message.role === "user"}
              />
            ))
          )}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>
                {Date.now() - (loadingStartTime || Date.now()) > 15000
                  ? t("aiIsThinking")
                  : t("waitingForAIResponse")}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            mode="flat"
            placeholder={t("typeYourMessage")}
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            multiline
            maxLength={1000}
            disabled={loading}
            onSubmitEditing={handleSend}
          />
          <IconButton
            icon="send"
            size={28}
            onPress={handleSend}
            disabled={loading || !inputText.trim()}
            style={styles.sendButton}
            iconColor={theme.colors.onPrimary}
          />
        </View>
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: t("close"),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}
