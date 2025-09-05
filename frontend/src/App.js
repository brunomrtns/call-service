import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneOffIcon from "@mui/icons-material/Phone";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PeopleIcon from "@mui/icons-material/People";
import { io } from "socket.io-client";
import axios from "axios";

// Configurar base URL do axios
axios.defaults.baseURL = "http://localhost:3001";

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Debug: monitorar mudanças no connectedUsers
  useEffect(() => {
    console.log("🔍 connectedUsers atualizado:", connectedUsers);
    console.log("🔍 Quantidade de usuários:", connectedUsers.length);
    if (connectedUsers.length > 0) {
      connectedUsers.forEach(user => {
        console.log(`👤 Usuário: ${user.username} (ID: ${user.userId}) - Device: ${user.device}`);
      });
    }
  }, [connectedUsers]);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    username: "",
    password: "",
    device: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callDialog, setCallDialog] = useState({
    open: false,
    targetUser: null,
  });

  // Restaurar usuário do localStorage ao carregar a página
  useEffect(() => {
    const savedUser = localStorage.getItem('callSystemUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔄 Restaurando usuário do localStorage:', userData);
        
        // Verificar se o token não expirou (verificação básica)
        const tokenPayload = JSON.parse(atob(userData.token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp < now) {
          console.log('⚠️ Token expirado, removendo do localStorage');
          localStorage.removeItem('callSystemUser');
          return;
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Erro ao restaurar usuário do localStorage:', error);
        localStorage.removeItem('callSystemUser');
      }
    }
  }, []);

  // Conectar ao Socket.IO quando usuário faz login
  useEffect(() => {
    console.log('🔍 useEffect executado - user:', !!user, 'socket:', !!socket);
    
    if (user && !socket) {
      console.log('=== INICIANDO CONEXÃO SOCKET ===');
      console.log('User data:', user);
      console.log('Token:', user.token);
      
      try {
        const newSocket = io("http://localhost:3001", {
          auth: { token: user.token },
          transports: ['polling'], // Usar apenas polling por enquanto
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          forceNew: true
        });

        console.log('🔌 Socket.IO criado, tentando conectar...');

        newSocket.on("connect", () => {
          console.log("✅ Conectado ao servidor Socket.IO");
          console.log("Socket ID:", newSocket.id);
          setSuccess("Conectado ao servidor de chamadas!");
          
          // Solicitar lista de usuários conectados explicitamente
          console.log("📋 Solicitando lista de usuários conectados...");
        });

        newSocket.on("connect_error", (error) => {
          console.error("❌ Erro de conexão Socket.IO:", error);
          console.error("Detalhes do erro:", error.message, error.description, error.context);
          setError(`Erro ao conectar no servidor: ${error.message}`);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("🔌 Desconectado do Socket.IO:", reason);
          setSuccess("");
        });

        // Logs adicionais para debug
        newSocket.on("connecting", () => {
          console.log("🔄 Conectando ao Socket.IO...");
        });

        newSocket.on("reconnect", (attemptNumber) => {
          console.log("🔄 Reconectado ao Socket.IO após", attemptNumber, "tentativas");
        });

        newSocket.on("reconnect_attempt", (attemptNumber) => {
          console.log("🔄 Tentativa de reconexão", attemptNumber);
        });

        newSocket.on("reconnect_failed", () => {
          console.log("❌ Falha na reconexão ao Socket.IO");
        });

      newSocket.on("userConnected", (data) => {
        console.log("👤 Evento userConnected:", data);
        setConnectedUsers((prev) => {
          const exists = prev.find((u) => u.id === data.user.id);
          if (!exists) {
            console.log("➕ Adicionando usuário:", data.user);
            return [...prev, data.user];
          }
          console.log("⚠️ Usuário já existe na lista:", data.user);
          return prev;
        });
      });

      newSocket.on("userDisconnected", (data) => {
        console.log("👋 Evento userDisconnected:", data);
        setConnectedUsers((prev) => {
          const filtered = prev.filter((u) => u.id !== data.userId);
          console.log("➖ Lista após remoção:", filtered);
          return filtered;
        });
      });

      newSocket.on("connectedUsers", (users) => {
        console.log("📋 Evento connectedUsers:", users);
        console.log("📋 Tipo:", typeof users, "Array:", Array.isArray(users), "Length:", users?.length);
        setConnectedUsers(users || []);
      });

      // Evento correto que o backend envia
      newSocket.on("users_online", (users) => {
        console.log("🟢 Evento users_online recebido:", users);
        console.log("🟢 Tipo:", typeof users, "Array:", Array.isArray(users), "Length:", users?.length);
        if (Array.isArray(users)) {
          console.log("🟢 Definindo connectedUsers com:", users);
          setConnectedUsers(users);
        } else {
          console.error("❌ users_online não é um array:", users);
        }
      });

      newSocket.on("incoming_call", (callData) => {
        console.log("📞 Chamada recebida:", callData);
        setIncomingCall(callData);
      });

      newSocket.on("call_answered", (callData) => {
        console.log("✅ Chamada atendida:", callData);
        setCurrentCall(callData);
        setIncomingCall(null);
        setSuccess("Chamada estabelecida!");
      });

      newSocket.on("call_rejected", (callData) => {
        console.log("❌ Chamada rejeitada:", callData);
        setCurrentCall(null);
        setIncomingCall(null);
        setError("Chamada rejeitada");
      });

      newSocket.on("call_ended", (callData) => {
        console.log("🔚 Chamada encerrada:", callData);
        setCurrentCall(null);
        setIncomingCall(null);
        setSuccess("Chamada encerrada");
      });

      newSocket.on("call_error", (error) => {
        console.error("❌ Erro na chamada:", error);
        setError(`Erro na chamada: ${error.message}`);
        setCurrentCall(null);
        setIncomingCall(null);
      });

      newSocket.on("error", (error) => {
        console.error("Erro do socket:", error);
        setError(`Erro: ${error.message}`);
      });

        setSocket(newSocket);
      } catch (error) {
        console.error('❌ Erro ao criar Socket.IO:', error);
        setError('Erro ao conectar no servidor');
      }
    }

    // Cleanup quando o componente for desmontado ou user mudar
    return () => {
      if (socket) {
        console.log('🧹 Limpando conexão Socket.IO');
        socket.disconnect();
      }
    };
  }, [user]); // Removido socket das dependências para evitar loops

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/api/users/login", loginForm);
      const userData = response.data;

      // Salvar no localStorage
      localStorage.setItem('callSystemUser', JSON.stringify(userData));
      console.log('💾 Usuário salvo no localStorage');

      setUser(userData);
      setSuccess("Login realizado com sucesso!");
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      console.error("Erro no login:", error);
      setError(error.response?.data?.message || "Erro ao fazer login");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/api/users/register", registerForm);
      setSuccess("Usuário registrado com sucesso! Faça login.");
      setRegisterForm({ name: "", username: "", password: "", device: "" });
      setIsRegistering(false);
    } catch (error) {
      console.error("Erro no registro:", error);
      setError(error.response?.data?.message || "Erro ao registrar usuário");
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Limpar localStorage
    localStorage.removeItem('callSystemUser');
    console.log('🗑️ Dados do usuário removidos do localStorage');
    
    setUser(null);
    setConnectedUsers([]);
    setIncomingCall(null);
    setCurrentCall(null);
    setSuccess("Logout realizado com sucesso!");
  };

  const initiateCall = (targetUser) => {
    if (socket && targetUser) {
      console.log("🔥 INICIANDO CHAMADA:");
      console.log("📞 Target user:", targetUser);
      console.log("📞 Target user ID:", targetUser.id || targetUser.userId);
      console.log("📞 Current user ID:", user?.user?.id);
      console.log("📞 Lista atual de conectados:", connectedUsers);
      
      socket.emit("call_user", { targetUserId: targetUser.id || targetUser.userId });
      setCallDialog({ open: false, targetUser: null });
      setSuccess(`Chamando ${targetUser.name}...`);
    } else {
      console.error("❌ Socket ou targetUser inválido:", { socket: !!socket, targetUser });
    }
  };

  const answerCall = () => {
    if (socket && incomingCall) {
      console.log("Atendendo chamada:", incomingCall);
      socket.emit("answer_call", { callId: incomingCall.callId });
    }
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
      console.log("Rejeitando chamada:", incomingCall);
      socket.emit("reject_call", { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (socket && currentCall) {
      console.log("Encerrando chamada:", currentCall);
      socket.emit("hangup_call", { callId: currentCall.callId });
    }
  };

  // Tela de Login/Registro
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6, mb: 4 }}>
        <Paper
          elevation={8}
          sx={{ p: 5, borderRadius: 3, textAlign: "center" }}
        >
          <Box mb={4}>
            <PhoneIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              fontWeight="bold"
              color="primary"
            >
              CallSystem
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Sistema de Chamadas VoIP Profissional
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {!isRegistering ? (
            <Box component="form" onSubmit={handleLogin}>
              <Typography variant="h5" gutterBottom mb={3} fontWeight="bold">
                Entrar na Plataforma
              </Typography>
              <TextField
                fullWidth
                label="Nome de Usuário"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.8,
                  mb: 2,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                Fazer Login
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setIsRegistering(true)}
                sx={{ borderRadius: 2, fontWeight: "bold" }}
              >
                Criar Nova Conta
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister}>
              <Typography variant="h5" gutterBottom mb={3} fontWeight="bold">
                Criar Nova Conta
              </Typography>
              <TextField
                fullWidth
                label="Nome Completo"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Nome de Usuário"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, username: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Ramal SIP (ex: 3005)"
                value={registerForm.device}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, device: e.target.value })
                }
                margin="normal"
                required
                variant="outlined"
                helperText="Digite o número do seu ramal/device SIP configurado no Asterisk"
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.8,
                  mb: 2,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                Criar Conta
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setIsRegistering(false)}
                sx={{ borderRadius: 2, fontWeight: "bold" }}
              >
                Voltar ao Login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    );
  }

  // Interface Principal - Dashboard de Chamadas
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header do Usuário */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🎯 Bem-vindo, {user.user.name}!
            </Typography>
            <Typography variant="h6">
              📞 Ramal: {user.user.device} • ✅ Status: Conectado
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: "bold" }}
          >
            Sair
          </Button>
        </Box>
      </Paper>

      {/* Alertas de Sistema */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2, fontSize: "1.1rem" }}
        >
          ❌ {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2, fontSize: "1.1rem" }}
        >
          ✅ {success}
        </Alert>
      )}

      {/* Área de Chamadas Ativas */}
      {currentCall && (
        <Paper
          elevation={6}
          sx={{
            p: 4,
            mb: 4,
            bgcolor: "success.main",
            color: "white",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📞 CHAMADA ATIVA
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Call ID: {currentCall.callId}
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<PhoneOffIcon />}
            onClick={endCall}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 2,
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}
          >
            Encerrar Chamada
          </Button>
        </Paper>
      )}

      {/* Chamada Recebida */}
      {incomingCall && (
        <Paper
          elevation={6}
          sx={{
            p: 4,
            mb: 4,
            bgcolor: "warning.main",
            color: "white",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            🔔 CHAMADA RECEBIDA!
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            📱 De: {incomingCall.callerName || incomingCall.callerDevice}
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={answerCall}
              sx={{
                mr: 3,
                borderRadius: 3,
                px: 4,
                py: 2,
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              ✅ Atender
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<CancelIcon />}
              onClick={rejectCall}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 2,
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              ❌ Rejeitar
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista de Contatos Online */}
      <Paper elevation={4} sx={{ borderRadius: 3 }}>
        <Box
          sx={{
            p: 3,
            bgcolor: "primary.main",
            color: "white",
            borderRadius: "12px 12px 0 0",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            display="flex"
            alignItems="center"
          >
            <PeopleIcon sx={{ mr: 2, fontSize: 30 }} />
            👥 Contatos Online ({connectedUsers.length})
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {connectedUsers.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="textSecondary">
                😴 Nenhum usuário online no momento
              </Typography>
              <Typography variant="body1" color="textSecondary" mt={1}>
                Aguarde outros usuários se conectarem...
              </Typography>
            </Box>
          ) : (
            <List>
              {connectedUsers.map((connectedUser) => (
                <Paper
                  key={connectedUser.id}
                  elevation={2}
                  sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
                >
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          👤 {connectedUser.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body1" color="textSecondary">
                          📞 Ramal: {connectedUser.device} • 🆔 ID:{" "}
                          {connectedUser.id}
                        </Typography>
                      }
                    />
                    <Box display="flex" alignItems="center" gap={2}>
                      <Chip
                        label="🟢 Online"
                        color="success"
                        sx={{ fontWeight: "bold" }}
                      />
                      {connectedUser.id !== user.user.id && !currentCall && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="large"
                          startIcon={<PhoneIcon />}
                          onClick={() =>
                            setCallDialog({
                              open: true,
                              targetUser: connectedUser,
                            })
                          }
                          sx={{ borderRadius: 2, px: 3, fontWeight: "bold" }}
                        >
                          📞 Chamar
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Dialog de Confirmação de Chamada */}
      <Dialog
        open={callDialog.open}
        onClose={() => setCallDialog({ open: false, targetUser: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
          <PhoneIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" fontWeight="bold">
            📞 Fazer Chamada
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Deseja ligar para <strong>{callDialog.targetUser?.name}</strong>?
          </Typography>
          <Typography variant="h6" color="textSecondary">
            📞 Ramal: {callDialog.targetUser?.device}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4, gap: 2 }}>
          <Button
            onClick={() => setCallDialog({ open: false, targetUser: null })}
            variant="outlined"
            size="large"
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: "bold" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => initiateCall(callDialog.targetUser)}
            variant="contained"
            size="large"
            startIcon={<PhoneIcon />}
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: "bold" }}
          >
            📞 Chamar Agora
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
