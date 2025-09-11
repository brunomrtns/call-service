import { Platform } from "react-native";

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    // Para web, usar navigator.mediaDevices.getUserMedia
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.warn("Microphone permission denied on web:", error);
      return false;
    }
  }

  if (Platform.OS === "android") {
    try {
      // Importação dinâmica apenas para Android
      const { PermissionsAndroid } = require("react-native");
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "This app needs access to your microphone to make calls.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Android permission error:", err);
      return false;
    }
  }

  // Para iOS, assumir que a permissão será solicitada automaticamente
  return true;
};

export const hasMicrophoneSupport = (): boolean => {
  if (Platform.OS === "web") {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  return true;
};
