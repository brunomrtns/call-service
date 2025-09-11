import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (
  theme: MD3Theme & { customColors: Record<string, string> }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "flex-start",
      padding: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.customColors.text,
      paddingTop: 12,
    },
    subtitle: {
      color: "#888",
      fontSize: 12,
      paddingBottom: 8,
    },
    messagesContainer: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    messageBubble: {
      maxWidth: "80%",
      marginVertical: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    messageBubbleUser: {
      alignSelf: "flex-end",
      backgroundColor: theme.colors.primary,
    },
    messageBubbleAI: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.surface,
    },
    messageText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      lineHeight: 22,
    },
    messageTextUser: {
      color: theme.colors.onPrimary,
    },
    timestamp: {
      fontSize: 10,
      color: theme.colors.onSurface,
      opacity: 0.5,
      marginTop: 6,
      alignSelf: "flex-end",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      opacity: 0.6,
      color: theme.colors.onBackground,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      paddingHorizontal: 24,
    },
    loadingText: {
      marginLeft: 12,
      fontSize: 14,
      opacity: 0.7,
      color: theme.colors.onBackground,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      fontSize: 16,
      minHeight: 44,
      maxHeight: 120,
      marginRight: 8,
      lineHeight: 22,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 24,
      padding: 4,
      marginLeft: 0,
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 120,
      backgroundColor: theme.colors.errorContainer,
    },
    backButton: {
      margin: 16,
      backgroundColor: theme.colors.surface,
    },
  });
