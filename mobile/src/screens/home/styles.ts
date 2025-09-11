import { StyleSheet } from "react-native";

interface Theme {
  colors: {
    background: string;
    onBackground: string;
  };
  customTypography: Record<string, any>;
  customColors: Record<string, string>;
}

export const useStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    title: {
      fontSize: theme.customTypography.title?.fontSize,
      fontWeight: theme.customTypography.title?.fontWeight as any,
      marginBottom: 10,
      color: theme.customColors.titleText,
    },
    text: {
      fontSize: 18,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 10,
      color: theme.customColors.text,
    },
    button: {
      backgroundColor: theme.customColors.buttonBackground,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginVertical: 8,
    },
    buttonText: {
      color: theme.customColors.buttonText,
      fontSize: 16,
      fontWeight: "600",
    },
    spacer: {
      height: 20,
    },
    labelButton: {
      color: theme.colors.onBackground,
    },
  });
