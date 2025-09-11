import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { validateToken } from "../../utils/auth";
import { RootStackParamList } from "../../App";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      if (isValid) {
        setAuthenticated(true);
      } else {
        navigation.replace("Login");
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return authenticated ? children : null;
}
