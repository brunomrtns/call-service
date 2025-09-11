import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  Card,
  Chip,
  Portal,
  Dialog,
  TextInput,
  Surface,
  IconButton,
  Snackbar,
  Modal,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { sipService } from "../services/sipService";
import { requestMicrophonePermission } from "../utils/permissions";
import { API_BASE_URL, WS_BASE_URL } from "../config/urls";
import {
  SIP_STATUS,
  SIP_REALM,
  type User,
  type Contact,
  type AuthResponse,
  type LoginForm,
  type RegisterForm,
  type SIPCall,
  type IncomingCall,
  type Message,
  type SIPStatus,
  type WebSocketMessage,
} from "../types";

// Configure axios base URL
axios.defaults.baseURL = API_BASE_URL;

const getStatusColor = (status: string): "success" | "error" | "default" => {
  switch (status) {
    case "online":
      return "success";
    case "offline":
    case "unavailable":
      return "error";
    default:
      return "default";
  }
};

interface StatusBadgeProps {
  contact: Contact;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ contact }) => {
  const status = contact.sipStatus || "unknown";
  const color = getStatusColor(status);

  return (
    <Chip
      mode="outlined"
      textStyle={{ fontSize: 10, fontWeight: "600" }}
      style={{
        minWidth: 70,
        backgroundColor:
          color === "success"
            ? "#4caf50"
            : color === "error"
            ? "#f44336"
            : "#9e9e9e",
      }}
    >
      {status.toUpperCase()}
    </Chip>
  );
};

export default function CallServiceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [sipStatus, setSipStatus] = useState<SIPStatus>(
    SIP_STATUS.DISCONNECTED
  );
  const [currentCall, setCurrentCall] = useState<SIPCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [dialerOpen, setDialerOpen] = useState<boolean>(false);
  const [dialedNumber, setDialedNumber] = useState<string>("");

  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: "",
    username: "",
    password: "",
    email: "",
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const wsRef = useRef<WebSocket | null>(null);

  const handleLogin = async (): Promise<void> => {
    setMessage({ type: "", text: "" });

    try {
      const { data } = await axios.post<AuthResponse>(
        "/api/users/login",
        loginForm
      );
      await AsyncStorage.setItem("callSystemUser", JSON.stringify(data));
      setUser(data.user);
      setFeedbackModal({
        visible: true,
        type: "success",
        title: "Login realizado!",
        message: `Bem-vindo(a), ${data.user.name}! Você foi conectado com sucesso ao sistema de chamadas.`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro no login";
      const errorDetails =
        error.response?.data?.details ||
        error.response?.statusText ||
        "Verifique suas credenciais e tente novamente.";
      setFeedbackModal({
        visible: true,
        type: "error",
        title: "Erro no Login",
        message: `${errorMessage}\n\nDetalhes: ${errorDetails}`,
      });
    }
  };

  const handleRegister = async (): Promise<void> => {
    setMessage({ type: "", text: "" });

    try {
      await axios.post("/api/users/register", registerForm);
      setRegisterForm({ name: "", username: "", password: "", email: "" });
      setIsRegistering(false);
      setFeedbackModal({
        visible: true,
        type: "success",
        title: "Registro realizado!",
        message: `Olá ${registerForm.name}! Seu registro foi realizado com sucesso. Agora você pode fazer login com suas credenciais.`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao registrar";
      const errorDetails =
        error.response?.data?.details ||
        error.response?.statusText ||
        "Verifique os dados informados e tente novamente.";
      setFeedbackModal({
        visible: true,
        type: "error",
        title: "Erro no Registro",
        message: `${errorMessage}\n\nDetalhes: ${errorDetails}`,
      });
    }
  };

  const handleLogout = useCallback((): void => {
    sipService.disconnect();
    setCurrentCall(null);
    setIncomingCall(null);
    setUser(null);
    setContacts([]);
    setSipStatus(SIP_STATUS.DISCONNECTED);
    setMessage({ type: "", text: "" });
    AsyncStorage.removeItem("callSystemUser");

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const placeCall = (target: Contact): void => {
    if (sipStatus !== SIP_STATUS.CONNECTED) {
      setMessage({ type: "error", text: "SIP não conectado" });
      return;
    }

    if (target.sipStatus !== "online") {
      setMessage({ type: "error", text: `${target.name} não está online` });
      return;
    }

    const uri = `sip:${target.device}@${SIP_REALM}`;
    const options = {
      mediaConstraints: {
        audio: true,
        video: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    try {
      const session = sipService.call(uri, options);
      if (session) {
        setCurrentCall({
          session,
          direction: "outgoing",
          peerLabel: `${target.name} (${target.device})`,
        });
        setMessage({ type: "", text: "" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao iniciar chamada" });
    }
  };

  const answerCall = (): void => {
    if (!incomingCall?.session) return;

    try {
      // JsSIP answer method only needs options object
      (incomingCall.session as any).answer({
        mediaConstraints: {
          audio: true,
          video: false,
        },
      });

      setCurrentCall({
        session: incomingCall.session,
        direction: "incoming",
        peerLabel: `${incomingCall.fromName} (${incomingCall.fromDevice})`,
      });
      setIncomingCall(null);
    } catch {
      setMessage({ type: "error", text: "Erro ao atender chamada" });
    }
  };

  const hangupCall = (): void => {
    const session = currentCall?.session || incomingCall?.session;
    if (session) {
      session.terminate();
    }
    setCurrentCall(null);
    setIncomingCall(null);
  };

  const dialNumber = (): void => {
    if (!dialedNumber.trim()) {
      setMessage({ type: "error", text: "Digite um número para discar" });
      return;
    }

    if (sipStatus !== SIP_STATUS.CONNECTED) {
      setMessage({ type: "error", text: "SIP não conectado" });
      return;
    }

    const uri = `sip:${dialedNumber}@${SIP_REALM}`;
    const options = {
      mediaConstraints: {
        audio: true,
        video: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    try {
      const session = sipService.call(uri, options);
      if (session) {
        setCurrentCall({
          session,
          direction: "outgoing",
          peerLabel: `Ramal ${dialedNumber}`,
        });
        setDialerOpen(false);
        setDialedNumber("");
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao discar número" });
    }
  };

  // Load stored user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("callSystemUser");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed.user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
    requestMicrophonePermission();
  }, []);

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const userData = await AsyncStorage.getItem("callSystemUser");
        if (userData) {
          const { token } = JSON.parse(userData);
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error: any) => {
        if ([401, 403].includes(error.response?.status)) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [handleLogout]);

  // Load contacts
  useEffect(() => {
    if (!user) return;

    const loadContacts = async (retryCount = 0): Promise<void> => {
      const maxRetries = 3;

      try {
        const { data } = await axios.get<Contact[]>(
          "/api/users/with-sip-status"
        );
        setContacts(data);
      } catch (error: any) {
        if (retryCount < maxRetries && error.response?.status !== 401) {
          setTimeout(
            () => loadContacts(retryCount + 1),
            1000 * (retryCount + 1)
          );
        }
      }
    };

    loadContacts();
  }, [user]);

  // Setup SIP connection
  useEffect(() => {
    if (!user) return;

    sipService.setCallbacks({
      onStatusChange: setSipStatus,
      onIncomingCall: (session: any) => {
        const fromUri = session.remote_identity?.uri;
        const fromDisplay = session.remote_identity?.display_name;
        const fromDevice = fromUri?.user || "Unknown";
        const fromName = fromDisplay || "Unknown";

        setIncomingCall({
          session,
          fromDevice,
          fromName,
        });
      },
      onCallEnded: () => {
        setCurrentCall(null);
        setIncomingCall(null);
      },
      onCallFailed: () => {
        setCurrentCall(null);
        setIncomingCall(null);
        setMessage({ type: "error", text: "Chamada falhou" });
      },
    });

    sipService.connect(user);

    return () => {
      sipService.disconnect();
    };
  }, [user]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = async () => {
      try {
        const userData = await AsyncStorage.getItem("callSystemUser");
        if (!userData) return;

        const { token } = JSON.parse(userData);
        const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            if (
              message.type === "users-with-sip-status" ||
              message.type === "users-with-sip-status-update"
            ) {
              setContacts(message.data);
            }
          } catch (error) {
            console.error("WebSocket message parse error:", error);
          }
        };

        ws.onclose = () => {
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("WebSocket connection error:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContainer}>
          <Surface style={styles.loginCard} elevation={4}>
            <Text variant="headlineMedium" style={styles.title}>
              {isRegistering ? "Registro" : "Login"}
            </Text>

            {!isRegistering ? (
              <>
                <TextInput
                  label="Usuário"
                  value={loginForm.username}
                  onChangeText={(text) =>
                    setLoginForm({ ...loginForm, username: text })
                  }
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Senha"
                  value={loginForm.password}
                  onChangeText={(text) =>
                    setLoginForm({ ...loginForm, password: text })
                  }
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  style={styles.button}
                >
                  Entrar
                </Button>
                <Button
                  mode="text"
                  onPress={() => setIsRegistering(true)}
                  style={styles.button}
                >
                  Não tem conta? Registre-se
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label="Nome"
                  value={registerForm.name}
                  onChangeText={(text) =>
                    setRegisterForm({ ...registerForm, name: text })
                  }
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Usuário"
                  value={registerForm.username}
                  onChangeText={(text) =>
                    setRegisterForm({ ...registerForm, username: text })
                  }
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Senha"
                  value={registerForm.password}
                  onChangeText={(text) =>
                    setRegisterForm({ ...registerForm, password: text })
                  }
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Email"
                  value={registerForm.email}
                  onChangeText={(text) =>
                    setRegisterForm({ ...registerForm, email: text })
                  }
                  keyboardType="email-address"
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  style={styles.button}
                >
                  Registrar
                </Button>
                <Button
                  mode="text"
                  onPress={() => setIsRegistering(false)}
                  style={styles.button}
                >
                  Já tem conta? Faça login
                </Button>
              </>
            )}
          </Surface>
        </View>

        {/* Modal de Feedback */}
        <Portal>
          <Modal
            visible={feedbackModal.visible}
            onDismiss={() =>
              setFeedbackModal({ ...feedbackModal, visible: false })
            }
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modalContent} elevation={5}>
              <Text
                variant="headlineSmall"
                style={[
                  styles.modalTitle,
                  {
                    color:
                      feedbackModal.type === "success" ? "#4caf50" : "#f44336",
                  },
                ]}
              >
                {feedbackModal.title}
              </Text>

              <Text variant="bodyMedium" style={styles.modalMessage}>
                {feedbackModal.message}
              </Text>

              <Button
                mode="contained"
                onPress={() =>
                  setFeedbackModal({ ...feedbackModal, visible: false })
                }
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      feedbackModal.type === "success" ? "#4caf50" : "#f44336",
                  },
                ]}
              >
                OK
              </Button>
            </Surface>
          </Modal>
        </Portal>

        <Snackbar
          visible={!!message.text}
          onDismiss={() => setMessage({ type: "", text: "" })}
          duration={3000}
          style={{
            backgroundColor: message.type === "error" ? "#f44336" : "#4caf50",
          }}
        >
          {message.text}
        </Snackbar>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall">{user.name}</Text>
          <View style={styles.headerActions}>
            <Chip
              mode="outlined"
              icon={
                sipStatus === SIP_STATUS.CONNECTED
                  ? "check-circle"
                  : "close-circle"
              }
              style={{
                backgroundColor:
                  sipStatus === SIP_STATUS.CONNECTED ? "#4caf50" : "#f44336",
              }}
            >
              {sipStatus === SIP_STATUS.CONNECTED
                ? "Conectado"
                : "Desconectado"}
            </Chip>
            <IconButton icon="logout" onPress={handleLogout} />
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="phone"
            onPress={() => setDialerOpen(true)}
            style={styles.actionButton}
            disabled={sipStatus !== SIP_STATUS.CONNECTED}
          >
            Discar
          </Button>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Contatos ({contacts.length})
        </Text>

        {contacts.map((contact) => (
          <Card key={contact.id} style={styles.contactCard}>
            <Card.Content>
              <View style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <Text variant="titleMedium">{contact.name}</Text>
                  <Text variant="bodySmall" style={styles.deviceText}>
                    {contact.device}
                  </Text>
                </View>
                <View style={styles.contactActions}>
                  <StatusBadge contact={contact} />
                  <IconButton
                    icon="phone"
                    mode="contained"
                    onPress={() => placeCall(contact)}
                    disabled={
                      sipStatus !== SIP_STATUS.CONNECTED ||
                      contact.sipStatus !== "online"
                    }
                    style={styles.callButton}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Current Call Display */}
      {currentCall && (
        <Surface style={styles.callOverlay} elevation={4}>
          <Text variant="titleLarge" style={styles.callTitle}>
            {currentCall.direction === "outgoing"
              ? "Ligando para"
              : "Em chamada com"}
          </Text>
          <Text variant="bodyLarge" style={styles.callPeer}>
            {currentCall.peerLabel}
          </Text>
          <Button
            mode="contained"
            icon="phone-hangup"
            onPress={hangupCall}
            buttonColor="#f44336"
            style={styles.hangupButton}
          >
            Desligar
          </Button>
        </Surface>
      )}

      {/* Incoming Call Dialog */}
      <Portal>
        <Dialog visible={!!incomingCall} dismissable={false}>
          <Dialog.Title>Chamada Recebida</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">
              {incomingCall?.fromName} ({incomingCall?.fromDevice})
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hangupCall} textColor="#f44336">
              Recusar
            </Button>
            <Button mode="contained" onPress={answerCall}>
              Atender
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialer Dialog */}
      <Portal>
        <Dialog visible={dialerOpen} onDismiss={() => setDialerOpen(false)}>
          <Dialog.Title>Discar Número</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Número"
              value={dialedNumber}
              onChangeText={setDialedNumber}
              keyboardType="numeric"
              style={styles.dialerInput}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialerOpen(false)}>Cancelar</Button>
            <Button mode="contained" onPress={dialNumber}>
              Ligar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!message.text}
        onDismiss={() => setMessage({ type: "", text: "" })}
        duration={3000}
        style={{
          backgroundColor: message.type === "error" ? "#f44336" : "#4caf50",
        }}
      >
        {message.text}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 350,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "700",
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    minWidth: 100,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "700",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  contactCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
  },
  deviceText: {
    color: "#666",
    marginTop: 4,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callButton: {
    backgroundColor: "#4caf50",
  },
  callOverlay: {
    position: "absolute",
    top: "30%",
    left: 20,
    right: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  callTitle: {
    marginBottom: 8,
  },
  callPeer: {
    marginBottom: 24,
    textAlign: "center",
  },
  hangupButton: {
    minWidth: 120,
  },
  dialerInput: {
    marginBottom: 16,
  },
});
