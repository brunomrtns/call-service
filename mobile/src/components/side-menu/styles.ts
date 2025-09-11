import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const useStyles = (
  theme: MD3Theme & {
    customColors: Record<string, string>;
    customTypography: Record<string, any>;
  }
) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: theme.customColors.overlay,
    },
    container: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: 280,
      backgroundColor:
        theme.colors.elevation?.level2 || theme.colors.background,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      elevation: 8,
      shadowColor: theme.colors.shadow || "#000",
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      zIndex: 1100,
      paddingBottom: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    closeButton: {
      marginRight: 8,
    },
    title: {
      color: theme.colors.onBackground,
      fontSize: theme.customTypography.title.fontSize,
      fontWeight: theme.customTypography.title.fontWeight,
    },
    drawerItem: {
      marginVertical: 8,
    },
  });
