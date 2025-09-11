import React, { useRef, useEffect } from "react";
import { Drawer, IconButton, Divider } from "react-native-paper";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeProvider";

import { useStyles } from "./styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MENU_WIDTH = 280;
const ANIMATION_DURATION = 250;

export default function SideMenu({
  visible,
  onClose,
  style,
}: {
  visible: boolean;
  onClose: () => void;
  style?: any;
}) {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleNavigation = (route: string) => {
    onClose();
    navigation.navigate(route as never);
  };

  const handleLogout = () => {
    onClose();
    navigation.navigate("Login" as never);
  };

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, style && StyleSheet.flatten(style)]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <Animated.View
          style={[
            styles.overlay,
            { opacity: visible ? 0.4 : 0, backgroundColor: "#000" },
          ]}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.container,
          {
            right: slideAnim,
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            marginTop: insets.top,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.header,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <Text style={styles.title}>Menu</Text>
            <IconButton
              icon="arrow-right"
              size={24}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>
          <Divider />
          <Drawer.Section>
            <Drawer.Item
              label={t("navbar.subMenu.items.account")}
              onPress={() => handleNavigation("Account")}
              style={styles.drawerItem}
            />
            <Drawer.Item
              label={t("navbar.subMenu.items.settings")}
              onPress={() => handleNavigation("Settings")}
              style={styles.drawerItem}
            />
          </Drawer.Section>
          <Drawer.Item
            label={t("navbar.subMenu.items.back")}
            onPress={handleLogout}
            style={styles.drawerItem}
            icon="logout"
          />
        </View>
      </Animated.View>
    </View>
  );
}
