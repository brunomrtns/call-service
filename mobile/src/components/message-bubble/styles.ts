import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    messageBubble: {
      marginVertical: 4,
      maxWidth: "95%",
      borderRadius: 16,
      padding: 10,
      alignSelf: "flex-start",
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    messageBubbleUser: {
      backgroundColor: theme.colors.primary,
      alignSelf: "flex-end",
    },
    messageBubbleAI: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    messageText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    messageTextUser: {
      color: theme.colors.onPrimary,
    },
    timestamp: {
      fontSize: 10,
      color: theme.colors.outline,
      alignSelf: "flex-end",
      marginTop: 4,
    },
  });
