import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      paddingVertical: 16,
      marginBottom: 8,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    emptySubtext: {
      textAlign: "center",
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 24,
      color: theme.colors.onSurface,
    },
    listContainer: {
      paddingBottom: 100,
    },
    conversationCard: {
      marginBottom: 16,
      borderRadius: 16,
      elevation: 3,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    cardContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    conversationInfo: {
      flex: 1,
    },
    conversationTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    conversationDate: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.6,
    },
    actionButton: {
      marginLeft: 8,
    },
  });
