import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (
  theme: MD3Theme & {
    customColors: Record<string, string>;
    customTypography: Record<string, any>;
  }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    header: {
      fontSize: theme.customTypography.title.fontSize, // Tamanho dinâmico
      fontWeight: theme.customTypography.title.fontWeight,
      marginBottom: 16,
      color: theme.customColors.titleText,
    },
    flagIcon: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
  });
