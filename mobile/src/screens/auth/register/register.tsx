import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import axios, { isAxiosError } from "axios";

import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";

import { CONSTANTS } from "../../../constants";
import { useTheme } from "../../../theme/ThemeProvider";

import { useAppNavigation } from "../../../hooks/useAppNavigation";

import { useStyles } from "./styles";

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const navigation = useAppNavigation();
  const { t } = useTranslation();

  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async () => {
    if (!name || !username || !email || !password) {
      setError(t("allFieldsRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${CONSTANTS.AUTH.AUTH_SERVER}/users/create`,
        {
          name,
          username,
          email,
          password,
        }
      );

      console.log("Usuário criado com sucesso:", response.data);
      navigation.navigate("Login");
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.err || "Erro ao criar conta.");
      } else {
        setError("Erro desconhecido.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("createAccount")}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        mode="outlined"
        label={t("authenticate.register.name")}
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label={t("authenticate.register.username")}
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label={t("authenticate.register.email")}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label={t("authenticate.register.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleCreateUser}
        disabled={loading}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          t("authenticate.login.register")
        )}
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate("Login")}
        style={styles.button}
      >
        {t("authenticate.register.backToLogin")}
      </Button>
    </View>
  );
}
