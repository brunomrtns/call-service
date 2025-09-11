import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import JsSIP from "jssip";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  Container,
  Paper,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Phone,
  PhoneDisabled,
  ExitToApp,
  Person,
  PersonAdd,
  CallEnd,
  Call,
  Dialpad,
  Backspace,
  Settings,
  Mic,
  VolumeUp,
} from "@mui/icons-material";
import "./App.css";

import {
  User,
  AuthResponse,
  LoginForm,
  RegisterForm,
  SIPCall,
  IncomingCall,
  Message,
  AudioDevices,
  SIP_STATUS,
  SIPStatus,
  SIP_WS_URI,
  SIP_REALM,
  SIP_PASSWORD_DEFAULT,
} from "./types";

axios.defaults.baseURL = "http://localhost:3001";

const getStatusColor = (status: SIPStatus): "success" | "error" | "default" => {
  switch (status) {
    case SIP_STATUS.CONNECTED:
      return "success";
    case SIP_STATUS.DISCONNECTED:
      return "error";
    default:
      return "default";
  }
};

interface Contact extends User {
  sipStatus: "online" | "offline" | "unavailable" | "unknown";
}

interface StatusBadgeProps {
  contact: Contact;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ua, setUa] = useState<any>(null);
  const [sipStatus, setSipStatus] = useState<SIPStatus>(
    SIP_STATUS.DISCONNECTED
  );
  const [currentCall, setCurrentCall] = useState<SIPCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [dialerOpen, setDialerOpen] = useState<boolean>(false);
  const [dialedNumber, setDialedNumber] = useState<string>("");
  const [audioConfigOpen, setAudioConfigOpen] = useState<boolean>(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: "",
    username: "",
    password: "",
    device: "",
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [audioDevices, setAudioDevices] = useState<AudioDevices>({
    inputs: [],
    outputs: [],
  });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const { data } = await axios.post<AuthResponse>(
        "/api/users/login",
        loginForm
      );
      localStorage.setItem("callSystemUser", JSON.stringify(data));
      setUser(data.user);
      setMessage({ type: "success", text: "Login realizado com sucesso" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Erro no login",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      await axios.post("/api/users/register", registerForm);
      setMessage({ type: "success", text: "Registrado! Faça login." });
      setRegisterForm({ name: "", username: "", password: "", device: "" });
      setIsRegistering(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Erro ao registrar",
      });
    }
  };

  const handleLogout = useCallback((): void => {
    if (ua) ua.stop();
    setUa(null);
    setCurrentCall(null);
    setIncomingCall(null);
    setUser(null);
    setContacts([]);
    setSipStatus(SIP_STATUS.DISCONNECTED);
    setMessage({ type: "", text: "" });
    localStorage.removeItem("callSystemUser");
  }, [ua]);

  const placeCall = (target: Contact): void => {
    if (!ua || sipStatus !== SIP_STATUS.CONNECTED) {
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
        audio: selectedAudioInput
          ? { deviceId: { exact: selectedAudioInput } }
          : true,
        video: false,
      },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    try {
      const session = ua.call(uri, options);
      setCurrentCall({
        session,
        direction: "outgoing",
        peerLabel: `${target.name} (${target.device})`,
      });
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao iniciar chamada" });
    }
  };

  const answerCall = (): void => {
    if (!incomingCall?.session) return;

    incomingCall.session.answer({
      mediaConstraints: {
        audio: selectedAudioInput
          ? { deviceId: { exact: selectedAudioInput } }
          : true,
        video: false,
      },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    });

    setCurrentCall({
      session: incomingCall.session,
      direction: "incoming",
      peerLabel: `${incomingCall.fromName} (${incomingCall.fromDevice})`,
    });
    setIncomingCall(null);
  };

  const hangupCall = (): void => {
    const session = currentCall?.session || incomingCall?.session;
    if (session) session.terminate();
    setCurrentCall(null);
    setIncomingCall(null);
  };

  const openDialer = (): void => {
    setDialerOpen(true);
    setDialedNumber("");
  };

  const closeDialer = (): void => {
    setDialerOpen(false);
    setDialedNumber("");
  };

  const addDigit = (digit: string): void => {
    if (dialedNumber.length < 10) setDialedNumber((prev) => prev + digit);
  };

  const removeDigit = (): void => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const dialNumber = (): void => {
    if (!dialedNumber.trim()) {
      setMessage({ type: "error", text: "Digite um número para discar" });
      return;
    }

    if (!ua || sipStatus !== SIP_STATUS.CONNECTED) {
      setMessage({ type: "error", text: "SIP não conectado" });
      return;
    }

    const uri = `sip:${dialedNumber}@${SIP_REALM}`;
    const options = {
      mediaConstraints: {
        audio: selectedAudioInput
          ? { deviceId: { exact: selectedAudioInput } }
          : true,
        video: false,
      },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    try {
      const session = ua.call(uri, options);
      setCurrentCall({
        session,
        direction: "outgoing",
        peerLabel: `Ramal ${dialedNumber}`,
      });
      closeDialer();
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao discar número" });
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("callSystemUser");
    if (userData) {
      try {
        const parsedData: AuthResponse = JSON.parse(userData);
        setUser(parsedData.user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const userData = localStorage.getItem("callSystemUser");
      if (userData) {
        try {
          const { token }: AuthResponse = JSON.parse(userData);
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error("Error parsing token:", error);
        }
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error: any) => {
        if ([401, 403].includes(error.response?.status)) {
          handleLogout();
          setMessage({
            type: "error",
            text: "Sessão expirada. Faça login novamente.",
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [handleLogout]);

  useEffect(() => {
    if (!user) return;

    const loadContacts = async (retryCount = 0): Promise<void> => {
      const maxRetries = 3;
      const retryDelay = Math.min(1000 * 2 ** retryCount, 10000);

      try {
        const res = await axios.get<Contact[]>("/api/users/with-sip-status");
        const filteredContacts = (res?.data || [])
          .filter((u) => u.device !== user.device)
          .sort((a, b) => {
            if (a.sipStatus === "online" && b.sipStatus !== "online") return -1;
            if (a.sipStatus !== "online" && b.sipStatus === "online") return 1;
            return a.name.localeCompare(b.name);
          });

        setContacts(filteredContacts);
        setMessage({ type: "", text: "" });
      } catch (error: any) {
        if (retryCount < maxRetries) {
          setMessage({
            type: "error",
            text: `Tentando reconectar... (${retryCount + 1}/${maxRetries})`,
          });
          setTimeout(() => loadContacts(retryCount + 1), retryDelay);
        } else {
          setMessage({
            type: "error",
            text: "Erro ao carregar lista de contatos",
          });
        }
      }
    };

    loadContacts();
  }, [user]);

  useEffect(() => {
    if (!user || ua) return;

    let sipInstance: any = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    let isActive = true;

    const createSipConnection = (): void => {
      if (!isActive) return;

      try {
        setSipStatus(SIP_STATUS.CONNECTING);
        const socket = new JsSIP.WebSocketInterface(SIP_WS_URI);

        const config = {
          sockets: [socket],
          uri: `sip:${user.device}@${SIP_REALM}`,
          authorization_user: user.device,
          password: SIP_PASSWORD_DEFAULT,
          display_name: user.name,
          session_timers: false,
          register: true,
          register_expires: 300,
          realm: SIP_REALM,
        };

        sipInstance = new JsSIP.UA(config);

        sipInstance.on("connected", () => {
          if (isActive) {
            setSipStatus(SIP_STATUS.CONNECTED);
            reconnectAttempts = 0;
            setMessage({ type: "", text: "" });
          }
        });

        sipInstance.on("disconnected", () => {
          if (isActive) handleSipDisconnect();
        });

        sipInstance.on("registered", () => {
          if (isActive) setSipStatus(SIP_STATUS.CONNECTED);
        });

        sipInstance.on("registrationFailed", () => {
          if (isActive) {
            setSipStatus(SIP_STATUS.DISCONNECTED);
            setMessage({ type: "error", text: "Falha na autenticação SIP" });
          }
        });

        sipInstance.on("newRTCSession", handleNewRTCSession);

        sipInstance.start();
        if (isActive) setUa(sipInstance);
      } catch (error) {
        if (isActive) handleSipDisconnect();
      }
    };

    const handleSipDisconnect = (): void => {
      if (!isActive) return;

      setSipStatus(SIP_STATUS.DISCONNECTED);

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectAttempts++;

        setMessage({
          type: "error",
          text: `Reconectando SIP... (${reconnectAttempts}/${maxReconnectAttempts})`,
        });
        reconnectTimeout = setTimeout(() => {
          if (isActive) {
            createSipConnection();
          }
        }, delay);
      } else {
        setMessage({ type: "error", text: "Falha na conexão SIP" });
      }
    };

    const handleNewRTCSession = (e: any): void => {
      const session = e.session;

      session.on("peerconnection", (ev: any) => {
        ev.peerconnection.addEventListener("track", (t: any) => {
          const stream = t.streams?.[0];
          if (stream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
          }
        });
      });

      session.on("ended", () => {
        if (isActive) {
          setCurrentCall(null);
          setIncomingCall(null);
        }
      });

      session.on("failed", () => {
        if (isActive) {
          setCurrentCall(null);
          setIncomingCall(null);
        }
      });

      if (session.direction === "incoming" && isActive) {
        const from = session.remote_identity;
        setIncomingCall({
          session,
          fromDevice: from?.uri?.user || "?",
          fromName: from?.display_name || from?.uri?.user || "Desconhecido",
        });
      }
    };

    setTimeout(createSipConnection, 100);

    return () => {
      isActive = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (sipInstance) sipInstance.stop();
      setUa(null);
      setSipStatus(SIP_STATUS.DISCONNECTED);
    };
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = (): void => {
      try {
        ws = new WebSocket("ws://localhost:3001/ws/device-status");

        ws.onopen = () => {
          reconnectAttempts = 0;
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type.includes("users-with-sip-status")) {
              const filteredUsers = message.data.filter(
                (u: Contact) => u.device !== user.device
              );
              const sortedUsers = filteredUsers.sort(
                (a: Contact, b: Contact) => {
                  if (a.sipStatus === "online" && b.sipStatus !== "online")
                    return -1;
                  if (a.sipStatus !== "online" && b.sipStatus === "online")
                    return 1;
                  return a.name.localeCompare(b.name);
                }
              );
              setContacts(sortedUsers);
            }
          } catch (error) {
            console.error("Erro ao processar mensagem WebSocket:", error);
          }
        };

        ws.onclose = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };

        ws.onerror = (error: Event) => {
          console.error("Erro no WebSocket:", error);
        };
      } catch (error) {
        console.error("Erro ao criar WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws?.readyState === WebSocket.OPEN) ws.close();
    };
  }, [user]);

  useEffect(() => {
    const loadDevices = async (): Promise<void> => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        const outputs = devices.filter((d) => d.kind === "audiooutput");

        setAudioDevices({ inputs, outputs });
        if (!selectedAudioInput && inputs.length > 0)
          setSelectedAudioInput(inputs[0]?.deviceId || "");
        if (!selectedAudioOutput && outputs.length > 0)
          setSelectedAudioOutput(outputs[0]?.deviceId || "");
      } catch (error) {
        setMessage({
          type: "error",
          text: "Erro ao carregar dispositivos de áudio",
        });
      }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, [selectedAudioInput, selectedAudioOutput]);

  useEffect(() => {
    if (selectedAudioOutput && remoteAudioRef.current?.setSinkId) {
      remoteAudioRef.current.setSinkId(selectedAudioOutput).catch((error) => {
        console.error("Erro ao configurar saída de áudio:", error);
      });
    }
  }, [selectedAudioOutput]);

  const StatusBadge: React.FC<StatusBadgeProps> = ({ contact }) => {
    const status = contact.sipStatus || "unknown";
    const color =
      status === "online"
        ? "success"
        : status === "offline" || status === "unavailable"
        ? "error"
        : "default";

    return (
      <Chip
        label={status}
        color={color}
        size="small"
        sx={{
          minWidth: 70,
          fontWeight: 600,
          textTransform: "uppercase",
          fontSize: 11,
        }}
      />
    );
  };

  const DialPad: React.FC = () => (
    <Grid container spacing={1}>
      {[
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["*", "0", "#"],
      ].map((row, i) => (
        <Grid item xs={12} key={i}>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            {row.map((digit) => (
              <Button
                key={digit}
                variant="contained"
                onClick={() => addDigit(digit)}
                sx={{
                  minWidth: 70,
                  height: 70,
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  borderRadius: 2,
                  background:
                    "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                  },
                }}
              >
                {digit}
              </Button>
            ))}
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  if (!user) {
    return (
      <div className="login-container">
        <Card
          sx={{ maxWidth: 450, width: "100%", borderRadius: 3, boxShadow: 4 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              className="gradient-text"
              sx={{ mb: 3 }}
            >
              CallSystem
            </Typography>
            <Typography
              variant="subtitle2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Sistema de chamadas WebRTC
            </Typography>

            {message.text && (
              <Alert
                severity={
                  message.type as "success" | "error" | "info" | "warning"
                }
                sx={{ mb: 2 }}
                onClose={() => setMessage({ type: "", text: "" })}
              >
                {message.text}
              </Alert>
            )}

            {!isRegistering ? (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Usuário"
                  margin="normal"
                  required
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Senha"
                  margin="normal"
                  required
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background:
                      "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                    },
                  }}
                >
                  Entrar
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setIsRegistering(true)}
                  startIcon={<PersonAdd />}
                >
                  Criar conta
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Nome"
                  margin="normal"
                  required
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Usuário"
                  margin="normal"
                  required
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Senha"
                  margin="normal"
                  required
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Ramal (ex: 3005)"
                  margin="normal"
                  required
                  value={registerForm.device}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, device: e.target.value })
                  }
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background:
                      "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  }}
                >
                  Registrar
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setIsRegistering(false)}
                >
                  Voltar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Container maxWidth="lg" className="main-content">
        <Box sx={{ py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper className="header-card" sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  Bem-vindo, {user.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ramal {user.device}
                  </Typography>
                  <Chip
                    label={`SIP ${sipStatus}`}
                    color={getStatusColor(sipStatus)}
                    size="small"
                    icon={
                      sipStatus === SIP_STATUS.CONNECTED ? (
                        <Phone />
                      ) : (
                        <PhoneDisabled />
                      )
                    }
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={openDialer}
                  startIcon={<Dialpad />}
                  disabled={sipStatus !== SIP_STATUS.CONNECTED}
                  sx={{
                    background:
                      sipStatus === SIP_STATUS.CONNECTED
                        ? "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)"
                        : undefined,
                    "&:hover": {
                      background:
                        sipStatus === SIP_STATUS.CONNECTED
                          ? "linear-gradient(45deg, #43a047 30%, #5cb85c 90%)"
                          : undefined,
                    },
                  }}
                >
                  Discador
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setAudioConfigOpen(true)}
                  startIcon={<Settings />}
                  sx={{
                    borderColor: "#667eea",
                    color: "#667eea",
                    "&:hover": {
                      borderColor: "#5a6fd8",
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                    },
                  }}
                >
                  Áudio
                </Button>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    background:
                      "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                    },
                  }}
                >
                  <ExitToApp />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {message.text && (
            <Alert
              severity={
                message.type as "success" | "error" | "info" | "warning"
              }
              onClose={() => setMessage({ type: "", text: "" })}
            >
              {message.text}
            </Alert>
          )}

          {(currentCall || incomingCall) && (
            <Paper className="content-card" sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {currentCall
                      ? `${
                          currentCall.direction === "outgoing"
                            ? "Falando com"
                            : "Chamada de"
                        } ${currentCall.peerLabel}`
                      : `Chamada de ${incomingCall?.fromName} (${incomingCall?.fromDevice})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentCall ? "Chamada ativa" : "Chamada recebida"}
                  </Typography>
                </Box>
                <Box className="call-controls">
                  {incomingCall && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={answerCall}
                      startIcon={<Call />}
                      size="large"
                      sx={{ mr: 2 }}
                    >
                      Atender
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="error"
                    onClick={hangupCall}
                    startIcon={<CallEnd />}
                    size="large"
                  >
                    Encerrar
                  </Button>
                </Box>
              </Box>
              <audio ref={remoteAudioRef} autoPlay />
            </Paper>
          )}

          <Paper className="content-card" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
              Contatos ({contacts.length})
            </Typography>
            <List>
              {contacts.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar className="contact-avatar">
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "medium" }}
                        >
                          {contact.name}
                        </Typography>
                      }
                      secondary={`Ramal ${contact.device}`}
                    />
                    <ListItemSecondaryAction>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <StatusBadge contact={contact} />
                        <Button
                          variant="contained"
                          disabled={
                            sipStatus !== SIP_STATUS.CONNECTED ||
                            contact.sipStatus !== "online"
                          }
                          onClick={() => placeCall(contact)}
                          startIcon={<Phone />}
                          sx={{
                            background:
                              sipStatus === SIP_STATUS.CONNECTED &&
                              contact.sipStatus === "online"
                                ? "linear-gradient(45deg, #667eea 30%, #764ba2 90%)"
                                : undefined,
                          }}
                        >
                          Chamar
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < contacts.length - 1 && (
                    <Box sx={{ ml: 9, mr: 2 }}>
                      <Divider />
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>

      <Dialog
        open={audioConfigOpen}
        onClose={() => setAudioConfigOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          },
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: "bold", color: "#333" }}
          >
            <Settings sx={{ mr: 1, verticalAlign: "middle" }} />
            Configurações de Áudio
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Mic sx={{ mr: 1, color: "#667eea" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Microfone (Entrada de Áudio)
                </Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Selecione o Microfone</InputLabel>
                <Select
                  value={selectedAudioInput}
                  onChange={(e) => setSelectedAudioInput(e.target.value)}
                  label="Selecione o Microfone"
                >
                  {audioDevices.inputs.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label ||
                        `Microfone ${device.deviceId.substr(0, 5)}...`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <VolumeUp sx={{ mr: 1, color: "#667eea" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Alto-falante (Saída de Áudio)
                </Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Selecione o Alto-falante</InputLabel>
                <Select
                  value={selectedAudioOutput}
                  onChange={(e) => setSelectedAudioOutput(e.target.value)}
                  label="Selecione o Alto-falante"
                  disabled={!("setSinkId" in HTMLAudioElement.prototype)}
                >
                  {audioDevices.outputs.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label ||
                        `Alto-falante ${device.deviceId.substr(0, 5)}...`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!("setSinkId" in HTMLAudioElement.prototype) && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  Seleção de saída de áudio não suportada neste navegador
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: 2,
                p: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Dica:</strong> As configurações de áudio serão aplicadas
                às próximas chamadas. Para chamadas ativas, as configurações
                serão aplicadas automaticamente quando possível.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setAudioConfigOpen(false)}
            variant="contained"
            sx={{
              flex: 1,
              height: 50,
              background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
              },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialerOpen}
        onClose={closeDialer}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          },
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: "bold", color: "#333" }}
          >
            <Dialpad sx={{ mr: 1, verticalAlign: "middle" }} />
            Discador
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              p: 2,
              mb: 3,
              textAlign: "center",
              minHeight: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #e0e0e0",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: "monospace",
                color: dialedNumber ? "#333" : "#999",
                letterSpacing: 2,
              }}
            >
              {dialedNumber || "Digite o ramal"}
            </Typography>
          </Box>

          <DialPad />

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={removeDigit}
              disabled={!dialedNumber}
              startIcon={<Backspace />}
              sx={{
                minWidth: 150,
                height: 50,
                borderColor: "#667eea",
                color: "#667eea",
                "&:hover": {
                  borderColor: "#5a6fd8",
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                },
              }}
            >
              Apagar
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={closeDialer}
            variant="outlined"
            sx={{
              flex: 1,
              mr: 1,
              height: 50,
              borderColor: "#999",
              color: "#666",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={dialNumber}
            variant="contained"
            disabled={!dialedNumber.trim()}
            startIcon={<Phone />}
            sx={{
              flex: 2,
              height: 50,
              background: "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #43a047 30%, #5cb85c 90%)",
              },
              "&:disabled": {
                background: "#ccc",
              },
            }}
          >
            Ligar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
