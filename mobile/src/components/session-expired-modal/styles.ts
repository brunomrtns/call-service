import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (
  theme: MD3Theme & { customColors: Record<string, string> }
) =>
  StyleSheet.create({
    modal: {
      padding: 20,
      margin: 20,
      backgroundColor: theme.colors.background,
      borderRadius: 10,
    },
    text: {
      marginBottom: 20,
      fontSize: 16,
      textAlign: "center",
      color: theme.colors.onBackground,
    },
    button: {
      alignSelf: "center",
      backgroundColor: theme.colors.primary,
    },
  });
