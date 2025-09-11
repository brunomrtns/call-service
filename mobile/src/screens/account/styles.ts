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
      padding: 16,
    },
    title: {
      marginBottom: 16,
      textAlign: "center",
    },
    input: {
      marginTop: 10,
      backgroundColor: theme.customColors.inputBackground,
      width: "100%",
      minHeight: 48,
    },
    button: {
      marginVertical: 10,
      backgroundColor: theme.customColors.buttonBackground,
      borderRadius: 5,
    },
    buttonDisabled: {
      marginVertical: 10,
      backgroundColor: theme.customColors.buttonDisabledBackground,
      borderRadius: 5,
    },
    buttonText: {
      color: theme.colors.onBackground,
      fontSize: 16,
      fontWeight: "500",
    },
    buttonDisabledText: {
      color: theme.customColors.buttonDisabledText,
      fontSize: 16,
      fontWeight: "500",
    },
  });
