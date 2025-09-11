import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

import LoginScreen from "../screens/auth/login";
import RegisterScreen from "../screens/auth/register/register";
import HomeScreen from "../screens/home";
import ChatRoomsScreen from "../screens/chat-rooms";
import ChatScreen from "../screens/chat-rooms/chat-screen";
import AccountScreen from "../screens/account";
import SettingsScreen from "../screens/settings";

interface AppRoutesProps {
  isAuthenticated: boolean;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppRoutes({ isAuthenticated }: AppRoutesProps) {
  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "Login"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ChatRooms" component={ChatRoomsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
