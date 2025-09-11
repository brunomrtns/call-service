import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from "@react-navigation/native";
import { validateToken } from "../utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../App";

const LOGIN_SCREEN = "Login";

const useSessionExpired = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionHandled, setSessionHandled] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();

  const currentRoute = route.name;
  console.log("Current Route:", currentRoute);

  const handleSessionExpired = useCallback(async () => {
    if (sessionHandled || modalVisible || currentRoute === LOGIN_SCREEN) {
      return;
    }
    setSessionHandled(true);
    await AsyncStorage.removeItem("authToken");
    setModalVisible(true);
  }, [sessionHandled, modalVisible, currentRoute]);

  const closeModal = () => {
    setModalVisible(false);
    setSessionHandled(false);
    navigation.reset({
      index: 0,
      routes: [{ name: LOGIN_SCREEN }],
    });
  };

  useEffect(() => {
    const validateAndHandleToken = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        await handleSessionExpired();
      }
    };

    validateAndHandleToken();

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response?.status === 401 &&
          error.response?.data?.err === "token inválido"
        ) {
          await handleSessionExpired();
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [modalVisible, sessionHandled, currentRoute, handleSessionExpired]);

  return {
    modalVisible,
    closeModal,
  };
};

export default useSessionExpired;
