import type { Conversation } from "../../services/apiService";

import React, { useRef, useState } from "react";
import { Animated, TextStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { Appbar, IconButton, Text } from "react-native-paper";

import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../theme/ThemeProvider";

import SideMenu from "../side-menu";

type HomeScreenNavigationProp = StackNavigationProp<any>;

interface INavbar {
  showBackButton?: boolean;
  isChatHeader?: boolean;
  currentConversation?: Conversation | null;
  classTitle?: TextStyle;
  classSubtitle?: TextStyle;
}

export default function Navbar({
  showBackButton = false,
  isChatHeader = false,
  currentConversation,
  classTitle,
  classSubtitle,
}: INavbar) {
  const { toggleTheme, isDarkMode, theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const rotation = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);

  const handleToggleTheme = () => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      rotation.setValue(0);
    });
    toggleTheme();
  };

  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <>
      <Appbar.Header
        style={{
          minHeight: 56,
          height: 56,
          justifyContent: "center",
          alignItems: "center",
          elevation: 4,
          zIndex: 10,
        }}
      >
        {showBackButton && (
          <Appbar.BackAction
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Home" as never);
              }
            }}
          />
        )}
        {isChatHeader ? (
          <React.Fragment>
            <Animated.View
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                flex: 1,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  color: theme.colors.onPrimary,
                  ...(classTitle || {}),
                }}
              >
                {currentConversation?.title || t("chatWithAI")}
              </Text>
              <Text
                style={{
                  color: "#888",
                  fontSize: 14,
                  marginTop: 2,
                  ...(classSubtitle || {}),
                }}
              >
                {currentConversation?.createdAt
                  ? `${t("startedOn")} ${new Date(
                      currentConversation.createdAt
                    ).toLocaleDateString("pt-BR")}`
                  : ""}
              </Text>
            </Animated.View>
          </React.Fragment>
        ) : (
          <Appbar.Content
            title={t("applicationName")}
            onPress={() => navigation.navigate("Home" as never)}
          />
        )}

        <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
          <IconButton
            icon={isDarkMode ? "moon-waning-crescent" : "white-balance-sunny"}
            size={24}
            onPress={handleToggleTheme}
          />
        </Animated.View>

        <IconButton icon="menu" size={24} onPress={handleMenuToggle} />
      </Appbar.Header>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        style={{
          zIndex: 9999,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </>
  );
}
