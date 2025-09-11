import React, { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { isAxiosError } from "axios";

import { APIService } from "../../../services/apiService";
import { useTheme } from "../../../theme/ThemeProvider";
import { CONSTANTS } from "../../../constants";

import { useStyles } from "./styles";
import { useAppNavigation } from "../../../hooks/useAppNavigation";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);
  const navigation = useAppNavigation();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      setError(t("allFieldsRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    try {
      const data = await APIService.login({ emailOrUsername, password });
      const { token } = data;
      await AsyncStorage.setItem(CONSTANTS.AUTH.AUTH_TOKEN_KEY, token);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status || "Sem status";
        const errMessage = error.response?.data?.err || error.message;
        const responseData = error.response?.data || "Sem dados de resposta";
        setError(
          t("errorAuthenticating", {
            status,
            message: errMessage,
          })
        );
        setDebugInfo(
          `DEBUG: Status: ${status}\nMensagem: ${errMessage}\nDados completos: ${JSON.stringify(
            responseData,
            null,
            2
          )}`
        );
      } else {
        setError(t("unknownError"));
        setDebugInfo(`DEBUG: ${JSON.stringify(error, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {debugInfo && (
        <Text style={[styles.error, { fontSize: 10, marginTop: 10 }]}>
          {debugInfo}
        </Text>
      )}
      <TextInput
        mode="outlined"
        label={t("emailOrUsername")}
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label={t("password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
      >
        {loading ? <ActivityIndicator size="small" /> : t("signIn")}
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate("Register")}
        style={styles.button}
      >
        {t("createAccount")}
      </Button>
    </View>
  );
}
