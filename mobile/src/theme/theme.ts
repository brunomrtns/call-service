import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: "#f7f9fb", // cinza-azulado muito claro
    primary: "#2563eb", // azul profissional, forte, mas não saturado
    onPrimary: "#ffffff",
    surface: "#ffffff", // branco para cards e superfícies
    onSurface: "#23272f", // cinza-azulado escuro para texto
    secondary: "#64748b", // cinza-azulado médio para detalhes
    onSecondary: "#ffffff",
    outline: "#e2e8f0", // cinza claro para bordas
    text: "#23272f", // igual ao onSurface
    error: "#e11d48", // vermelho sóbrio
    onError: "#fff",
    // outros campos do MD3Theme podem ser herdados
  },
  customColors: {
    inputBackground: "#f1f5f9", // cinza-azulado muito claro
    buttonBackground: "#2563eb", // igual ao primary
    buttonText: "#fff",
    buttonDisabledBackground: "#cbd5e1", // cinza claro
    buttonDisabledText: "#64748b", // cinza médio
    titleText: "#2563eb", // igual ao primary
    codeBlockBackground: "#f3f4f6", // cinza claro
    codeBlockText: "#23272f", // texto escuro
    codeBlockBorder: "#e2e8f0", // cinza claro
  },
  customTypography: {
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#2563eb",
    },
    subtitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#64748b",
    },
    body: {
      fontSize: 16,
      fontWeight: "normal",
      color: "#23272f",
    },
  },
} as MD3Theme & {
  customColors: Record<string, string>;
  customTypography: Record<string, any>;
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: "#121212",
    primary: "#bb86fc",
    onPrimary: "#ffffff",
    surface: "#1e1e1e",
    onSurface: "#e0e0e0",
    text: "#e0e0e0",
    outline: "#d0d8e2ff", // cinza claro para bordas
  },
  customColors: {
    inputBackground: "#1c1c1c",
    buttonBackground: "#2a2a2a",
    buttonText: "#e0e0e0",
    buttonDisabledBackground: "#444444",
    buttonDisabledText: "#777777",
    titleText: "#9c86fcff",
    codeBlockBackground: "#1e1e1e",
    codeBlockText: "#e0e0e0",
    codeBlockBorder: "#333333",
  },
  customTypography: {
    title: {
      fontSize: 24,
      fontWeight: "bold",
    },
    subtitle: {
      fontSize: 18,
      fontWeight: "600",
    },
    body: {
      fontSize: 16,
      fontWeight: "normal",
    },
  },
} as MD3Theme & {
  customColors: Record<string, string>;
  customTypography: Record<string, any>;
};
