import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import {
  Text,
  Button,
  IconButton,
  TouchableRipple,
  FAB,
  Portal,
  Dialog,
  TextInput,
} from "react-native-paper";

import { useConversations } from "../../contexts/ConversationsContext";
import APIService from "../../services/apiService";
import Navbar from "../../components/navbar";
import { useTheme } from "../../theme/ThemeProvider";

import { useStyles } from "./styles";
import { useAppNavigation } from "../../hooks/useAppNavigation";

export default function ChatRoomsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);
  const navigation = useAppNavigation();
  const { conversations, loading, loadConversations } = useConversations();

  const [creating, setCreating] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");

  const createRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert(t("error"), t("roomNameRequired"));
      return;
    }

    setCreating(true);
    try {
      await APIService.createConversation({
        title: roomName.trim(),
      });

      setIsModalVisible(false);
      setRoomName("");
      loadConversations();
    } catch (error: any) {
      console.error("Erro ao criar sala:", error);
      Alert.alert(
        t("error"),
        error?.response?.data?.error || t("errorCreatingRoom")
      );
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openChat = (conversationId: number) => {
    navigation.navigate("ChatScreen", { conversationId });
  };

  return (
    <View style={styles.container}>
      <Navbar showBackButton />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineSmall">{t("chatRooms")}</Text>
          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
            {t("manageYourChatRooms")}
          </Text>
        </View>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{t("noRoomsFound")}</Text>
            <Text style={styles.emptySubtext}>
              {t("createNewRoomToStartChatting")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableRipple
                style={styles.conversationCard}
                onPress={() => openChat(item.id)}
                rippleColor={theme.colors.primary + "33"}
              >
                <View style={styles.cardContent}>
                  <View style={styles.avatar}>
                    <IconButton icon="chat" size={24} />
                  </View>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationTitle}>
                      {item.title || t("untitledRoom")}
                    </Text>
                    <Text style={styles.conversationDate}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : t("unavailableDate")}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={() => openChat(item.id)}
                    style={styles.actionButton}
                  />
                </View>
              </TouchableRipple>
            )}
            contentContainerStyle={styles.listContainer}
            refreshing={Platform.OS !== "web" ? loading : undefined}
            onRefresh={Platform.OS !== "web" ? loadConversations : undefined}
          />
        )}
        {Platform.OS === "web" && (
          <Button
            mode="outlined"
            style={{ marginTop: 12, marginBottom: 30 }}
            onPress={loadConversations}
          >
            {t("reload")}
          </Button>
        )}
        <Portal>
          <Dialog
            visible={isModalVisible}
            onDismiss={() => setIsModalVisible(false)}
          >
            <Dialog.Title>{t("createChatRoom")}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t("roomName")}
                value={roomName}
                onChangeText={setRoomName}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsModalVisible(false)}>
                {t("cancel")}
              </Button>
              <Button
                onPress={createRoom}
                loading={creating}
                disabled={creating}
              >
                {t("create")}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <FAB
          icon="plus"
          onPress={() => setIsModalVisible(true)}
          loading={creating}
          disabled={creating}
          style={{
            position: "absolute",
            right: 24,
            bottom: 100,
            zIndex: 10,
            backgroundColor: theme.colors.primary,
          }}
          color={theme.colors.onPrimary}
          size="medium"
          accessibilityLabel={t("createRoom")}
        />
      </View>
    </View>
  );
}
