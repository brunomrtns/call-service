import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (
  theme: MD3Theme & { customColors: Record<string, string> }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: theme.colors.onBackground,
    },
    input: {
      marginBottom: 10,
      backgroundColor: theme.colors.surface,
    },
    button: {
      marginVertical: 10,
    },
    error: {
      color: theme.colors.error,
      marginBottom: 10,
      textAlign: "center",
    },
  });
