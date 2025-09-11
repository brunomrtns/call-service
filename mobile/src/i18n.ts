import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import ptBR from "./locales/pt-BR/translation.json";

let deviceLanguage = "en";
try {
  const locales = getLocales();
  deviceLanguage = locales[0]?.languageTag || "en";
} catch (error) {
  console.error("Erro ao obter idioma do dispositivo:", error);
}

if (deviceLanguage.startsWith("pt")) {
  deviceLanguage = "pt-BR";
} else if (deviceLanguage.startsWith("es")) {
  deviceLanguage = "es";
} else {
  deviceLanguage = "en";
}

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng: deviceLanguage,
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
    es: { translation: es },
  },
  interpolation: {
    escapeValue: false,
  },
  debug: false,
});

export const changeLanguage = async (lng: string) => {
  try {
    await AsyncStorage.setItem("language", lng);
    i18n.changeLanguage(lng);
  } catch (error) {
    console.error("Erro ao alterar idioma:", error);
  }
};

export const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem("language");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error("Erro ao carregar idioma salvo:", error);
  }
};

export default i18n;
