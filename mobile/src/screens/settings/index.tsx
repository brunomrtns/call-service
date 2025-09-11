import React, { useState } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { List, Menu } from "react-native-paper";

import Navbar from "../../components/navbar";
import { useTheme } from "../../theme/ThemeProvider";
import { changeLanguage } from "../../i18n";

import { useStyles } from "./styles";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "pt-BR");
  const [menuVisible, setMenuVisible] = useState(false);
  const styles = useStyles(theme);

  const languages = [
    {
      value: "pt-BR",
      label: t("settings.languages.portuguese"),
    },
    {
      value: "en",
      label: t("settings.languages.english"),
    },
    {
      value: "es",
      label: t("settings.languages.spanish"),
    },
  ];

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    changeLanguage(value);
    setMenuVisible(false);
  };

  return (
    <>
      <Navbar showBackButton />
      <View style={styles.container}>
        <Text style={styles.header}>{t("settings.screenTitle")}</Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <List.Item
              title={t("settings.languageLabel")}
              description={
                languages.find((lang) => lang.value === language)?.label
              }
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          {languages.map(({ value, label }) => (
            <List.Item
              key={value}
              onPress={() => handleLanguageChange(value)}
              title={label}
            />
          ))}
        </Menu>
      </View>
    </>
  );
}
