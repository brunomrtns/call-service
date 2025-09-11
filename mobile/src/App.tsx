import React, { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View, Platform } from "react-native";

import CallServiceScreen from "./screens/CallServiceScreen";

import { Provider as PaperProvider } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export type RootStackParamList = {
  Home: undefined;
  ChatRooms: undefined;
  ChatScreen: { conversationId: number };
  Login: undefined;
  Register: undefined;
  Settings: undefined;
  Account: undefined;
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") {
      (MaterialCommunityIcons as any).loadFont();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View
          style={
            Platform.OS === "web"
              ? {
                  minHeight:
                    typeof window !== "undefined" ? window.innerHeight : 0,
                  justifyContent: "center",
                  flex: 1,
                }
              : { flex: 1 }
          }
        >
          <PaperProvider
            settings={{
              icon: (props) => <MaterialCommunityIcons {...props} />,
            }}
          >
            <CallServiceScreen />
          </PaperProvider>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
