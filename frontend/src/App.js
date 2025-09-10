import React, { useEffect, useRef, useState } from "react";
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
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
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
  Refresh,
} from "@mui/icons-material";
import "./App.css";

axios.defaults.baseURL = "http://localhost:3001";

const ASTERISK_HOST = "192.168.15.176";
const SIP_WS_URI = `ws://${ASTERISK_HOST}:8088/asterisk/ws`;
const SIP_REALM = ASTERISK_HOST;

const SIP_PASSWORD_DEFAULT = "Teste123";

export default function App() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    username: "",
    password: "",
    device: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const [ua, setUa] = useState(null);
  const [sipStatus, setSipStatus] = useState("disconnected");
  const [currentCall, setCurrentCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const remoteAudioRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("callSystemUser");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setUser(data);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const raw = localStorage.getItem("callSystemUser");
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (data.token) {
              config.headers.Authorization = `Bearer ${data.token}`;
            }
          } catch {}
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Token expirado ou inválido, fazendo logout...");

          localStorage.removeItem("callSystemUser");
          setUser(null);
          setContacts([]);
          setSipStatus("disconnected");
          setErr("Sessão expirada. Faça login novamente.");

          if (ua) {
            try {
              ua.stop();
            } catch {}
            setUa(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [ua]);

  useEffect(() => {
    if (!user) return;

    axios
      .get("/api/users/with-sip-status")
      .then((res) => {
        const list = (res?.data || []).filter(
          (u) => u.device !== user.user.device
        );
        setContacts(list);
      })
      .catch((error) => {
        console.error(
          "Erro ao buscar usuários com status SIP:",
          error.response?.data || error.message
        );
        setErr("Erro ao carregar lista de contatos");
        setContacts([]);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (ua) return;

    const socket = new JsSIP.WebSocketInterface(SIP_WS_URI);
    const config = {
      sockets: [socket],
      uri: `sip:${user.user.device}@${SIP_REALM}`,
      authorization_user: user.user.device,
      password: SIP_PASSWORD_DEFAULT,
      display_name: user.user.name,
      session_timers: false,
      register: true,
      register_expires: 300,
      realm: SIP_REALM,
    };

    const _ua = new JsSIP.UA(config);

    _ua.on("connected", () => setSipStatus("connected"));
    _ua.on("disconnected", () => setSipStatus("disconnected"));
    _ua.on("registered", () => setSipStatus("connected"));
    _ua.on("unregistered", () => setSipStatus("disconnected"));

    _ua.on("newRTCSession", (e) => {
      const session = e.session;

      session.on("peerconnection", (ev) => {
        const pc = ev.peerconnection;
        pc.addEventListener("track", (t) => {
          const stream = t.streams && t.streams[0];
          if (stream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
          }
        });
      });

      session.on("ended", () => {
        setCurrentCall(null);
        setIncoming(null);
      });
      session.on("failed", () => {
        setCurrentCall(null);
        setIncoming(null);
      });

      if (session.direction === "incoming") {
        const from = session.remote_identity;
        setIncoming({
          session,
          fromDevice: from?.uri?.user || "?",
          fromName: from?.display_name || from?.uri?.user || "Desconhecido",
        });
      } else {
      }
    });

    setSipStatus("connecting");
    _ua.start();
    setUa(_ua);

    return () => {
      try {
        _ua.stop();
      } catch {}
      setUa(null);
      setSipStatus("disconnected");
    };
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:3001/ws/device-status");

      ws.onopen = () => {
        console.log("WebSocket conectado para status de usuários");
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (
            message.type === "users-with-sip-status" ||
            message.type === "users-with-sip-status-update"
          ) {
            const users = message.data;

            const filteredUsers = users.filter(
              (u) => u.device !== user.user.device
            );
            setContacts(filteredUsers);
            console.log(
              `Recebidos ${filteredUsers.length} contatos via WebSocket`
            );
          }
        } catch (error) {
          console.error("Erro ao processar mensagem WebSocket:", error);
        }
      };

      ws.onclose = () => {
        console.log(
          "WebSocket desconectado. Tentando reconectar em 5 segundos..."
        );
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error("Erro no WebSocket:", error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    try {
      const { data } = await axios.post("/api/users/login", loginForm);
      localStorage.setItem("callSystemUser", JSON.stringify(data));
      setUser(data);
      setInfo("Login ok");
    } catch (error) {
      setErr(error?.response?.data?.message || "Erro no login");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    try {
      await axios.post("/api/users/register", registerForm);
      setInfo("Registrado! Faça login.");
      setRegisterForm({ name: "", username: "", password: "", device: "" });
      setIsRegistering(false);
    } catch (error) {
      setErr(error?.response?.data?.message || "Erro ao registrar");
    }
  };

  const logout = () => {
    try {
      ua?.stop();
    } catch {}
    setUa(null);
    setCurrentCall(null);
    setIncoming(null);
    setUser(null);
    setContacts([]);
    setSipStatus("disconnected");
    localStorage.removeItem("callSystemUser");
  };

  const forceReconnectSip = () => {
    if (!user || !user.user) return;

    setInfo("Tentando reconectar...");

    // Parar UA atual se existir
    if (ua) {
      try {
        ua.stop();
      } catch {}
    }

    // Forçar reset do estado
    setUa(null);
    setSipStatus("connecting");

    // Pequeno delay para garantir que o UA foi limpo
    setTimeout(() => {
      // O useEffect vai detectar que ua é null e criar uma nova conexão
    }, 100);
  };

  const placeCall = (target) => {
    if (!ua || sipStatus !== "connected") {
      setErr("SIP não conectado");
      return;
    }
    setErr("");
    const uri = `sip:${target.device}@${SIP_REALM}`;

    const options = {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    const session = ua.call(uri, options);
    setCurrentCall({
      session,
      direction: "outgoing",
      peerLabel: `${target.name} (${target.device})`,
    });
  };

  const answer = () => {
    if (!incoming?.session) return;
    incoming.session.answer({
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    });
    setCurrentCall({
      session: incoming.session,
      direction: "incoming",
      peerLabel: `${incoming.fromName} (${incoming.fromDevice})`,
    });
    setIncoming(null);
  };

  const hangup = () => {
    const sess = currentCall?.session || incoming?.session;
    if (!sess) return;
    try {
      sess.terminate();
    } catch {}
    setCurrentCall(null);
    setIncoming(null);
  };

  const badgeFor = (contact) => {
    const st = contact.sipStatus || "unknown";
    const color =
      st === "online"
        ? "success"
        : st === "offline" || st === "unavailable"
        ? "error"
        : "default";

    return (
      <Chip
        label={st}
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

  const openDialer = () => {
    setDialerOpen(true);
    setDialedNumber("");
  };

  const closeDialer = () => {
    setDialerOpen(false);
    setDialedNumber("");
  };

  const addDigit = (digit) => {
    if (dialedNumber.length < 10) {
      setDialedNumber((prev) => prev + digit);
    }
  };

  const removeDigit = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const dialNumber = () => {
    if (!dialedNumber.trim()) {
      setErr("Digite um número para discar");
      return;
    }

    if (!ua || sipStatus !== "connected") {
      setErr("SIP não conectado");
      return;
    }

    setErr("");
    const uri = `sip:${dialedNumber}@${SIP_REALM}`;

    const options = {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
      rtcConfiguration: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };

    const session = ua.call(uri, options);
    setCurrentCall({
      session,
      direction: "outgoing",
      peerLabel: `Ramal ${dialedNumber}`,
    });

    closeDialer();
  };

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

            {err && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {err}
              </Alert>
            )}
            {info && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {info}
              </Alert>
            )}

            {!isRegistering ? (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Usuário"
                  margin="normal"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Senha"
                  margin="normal"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  required
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
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Usuário"
                  margin="normal"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Senha"
                  margin="normal"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Ramal (ex: 3005)"
                  margin="normal"
                  value={registerForm.device}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, device: e.target.value })
                  }
                  required
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
                  Bem-vindo, {user.user.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ramal {user.user.device}
                  </Typography>
                  <Chip
                    label={`SIP ${sipStatus}`}
                    color={sipStatus === "connected" ? "success" : "default"}
                    size="small"
                    icon={
                      sipStatus === "connected" ? <Phone /> : <PhoneDisabled />
                    }
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={openDialer}
                  startIcon={<Dialpad />}
                  disabled={sipStatus !== "connected"}
                  sx={{
                    background:
                      sipStatus === "connected"
                        ? "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)"
                        : undefined,
                    "&:hover": {
                      background:
                        sipStatus === "connected"
                          ? "linear-gradient(45deg, #43a047 30%, #5cb85c 90%)"
                          : undefined,
                    },
                  }}
                >
                  Discador
                </Button>
                <IconButton
                  onClick={logout}
                  color="primary"
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

          {err && (
            <Alert severity="error" onClose={() => setErr("")}>
              {err}
            </Alert>
          )}
          {info && (
            <Alert severity="success" onClose={() => setInfo("")}>
              {info}
            </Alert>
          )}

          {(currentCall || incoming) && (
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
                      ? currentCall.direction === "outgoing"
                        ? `Falando com ${currentCall.peerLabel}`
                        : `Chamada de ${currentCall.peerLabel}`
                      : `Chamada de ${incoming.fromName} (${incoming.fromDevice})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentCall ? "Chamada ativa" : "Chamada recebida"}
                  </Typography>
                </Box>
                <Box className="call-controls">
                  {incoming && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={answer}
                      startIcon={<Call />}
                      size="large"
                    >
                      Atender
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="error"
                    onClick={hangup}
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Contatos ({contacts.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ações
              </Typography>
            </Box>
            <List>
              {contacts.map((c, index) => (
                <React.Fragment key={c.id}>
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
                          {c.name}
                        </Typography>
                      }
                      secondary={`Ramal ${c.device}`}
                    />
                    <ListItemSecondaryAction>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        {badgeFor(c)}
                        <Button
                          variant="contained"
                          disabled={
                            sipStatus !== "connected" ||
                            c.sipStatus !== "online"
                          }
                          onClick={() => placeCall(c)}
                          startIcon={<Phone />}
                          sx={{
                            background:
                              sipStatus === "connected" &&
                              c.sipStatus === "online"
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
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>

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

          <Grid container spacing={1}>
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["*", "0", "#"],
            ].map((row, rowIndex) => (
              <Grid item xs={12} key={rowIndex}>
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
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {digit}
                    </Button>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>

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
