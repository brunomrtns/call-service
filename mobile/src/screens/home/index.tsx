import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, Text } from "react-native-paper";

import { useAppNavigation } from "../../hooks/useAppNavigation";

import Navbar from "../../components/navbar";
import { useTheme } from "../../theme/ThemeProvider";
import ProtectedRoute from "../../components/protected-route";

import { useStyles } from "./styles";

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);
  const navigation = useAppNavigation();

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar />
        <View style={styles.content}>
          <View style={styles.spacer} />
          <Text style={styles.title}>{t("myConversations")}</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("ChatRooms")}
            style={styles.button}
          >
            {t("seeChatRooms")}
          </Button>
        </View>
      </View>
    </ProtectedRoute>
  );
}
