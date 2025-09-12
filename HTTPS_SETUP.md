# HTTPS Setup para WebRTC - Call Service

## ⚠️ Por que HTTPS é Necessário?

### Problema Identificado

Chamadas SIP/WebRTC **não funcionam fora do localhost** quando usando HTTP. Isso acontece porque:

1. **Navegadores modernos** bloqueiam `getUserMedia()` em HTTP para IPs externos
2. **WebRTC requer contexto seguro** para funcionar adequadamente
3. **ICE/STUN servers** têm melhor performance com HTTPS
4. **Políticas de segurança** dos navegadores são mais restritivas em HTTP

### Sintomas do Problema

- ✅ Chamadas funcionam em `localhost`
- ❌ Chamadas falham quando acessando via IP (ex: `192.168.15.165`)
- ❌ Microfone pode não ser detectado
- ❌ Conexões WebRTC falam

## 🔒 Solução: Configuração HTTPS

### 1. Configuração Automática

Execute o script de configuração:

```bash
cd /home/bruno/Desenvolvimento/call-service
./setup-https.sh
```

Este script irá:

- Gerar certificados SSL auto-assinados
- Configurar variáveis de ambiente
- Preparar o servidor para HTTPS

### 2. Estrutura de Arquivos

Após a configuração:

```
call-service/
├── ssl/
│   ├── cert.pem     # Certificado SSL
│   └── key.pem      # Chave privada SSL
├── .env             # Configurações atualizadas
└── setup-https.sh  # Script de configuração
```

### 3. Configurações de Ambiente

O arquivo `.env` terá:

```bash
# Configurações HTTPS
HTTPS_ENABLED=true
HTTPS_PORT=3443
HTTPS_CERT_PATH=./ssl/cert.pem
HTTPS_KEY_PATH=./ssl/key.pem
```

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
npm start
```

O servidor iniciará:

- **HTTPS**: `https://localhost:3443`
- **HTTPS (rede)**: `https://192.168.15.165:3443`
- **HTTP redirect**: `http://localhost:3001` → redireciona para HTTPS

### 2. Acessar as Aplicações

**Frontend Web:**

```
https://localhost:3443         # Desenvolvimento local
https://192.168.15.165:3443    # Acesso via rede
```

**Mobile (React Native):**

- Detecção automática de HTTPS/HTTP
- Prioriza HTTPS quando disponível
- Fallback para HTTP com aviso

### 3. URLs de WebSocket

**Seguro (WSS):**

```
wss://localhost:3443/ws/device-status
wss://192.168.15.165:3443/ws/device-status
```

**Normal (WS):**

```
ws://localhost:3001/ws/device-status   # Apenas localhost
```

## 🛠️ Configuração do Asterisk

Para funcionar com HTTPS, configure WSS no Asterisk:

### 1. Arquivo `/etc/asterisk/http.conf`

```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088

; WebSocket Seguro (WSS)
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/path/to/cert.pem
tlsprivatekey=/path/to/key.pem
```

### 2. Copiar Certificados

```bash
# Copiar certificados para o Asterisk
sudo cp ssl/cert.pem /etc/asterisk/
sudo cp ssl/key.pem /etc/asterisk/
sudo chown asterisk:asterisk /etc/asterisk/*.pem
```

### 3. Reiniciar Asterisk

```bash
sudo systemctl restart asterisk
```

## 🔧 Detecção Automática

O sistema detecta automaticamente:

### Frontend (React)

- Se `window.location.protocol === "https:"` → usa portas HTTPS
- Se IP externo → força HTTPS para WebRTC funcionar
- URLs WebSocket se ajustam automaticamente (WS/WSS)

### Mobile (React Native)

- Testa conectividade HTTPS primeiro
- Fallback para HTTP com aviso
- WebSocket se ajusta ao protocolo detectado

### SIP WebSocket

- HTTPS → `wss://asterisk:8089/asterisk/ws`
- HTTP → `ws://asterisk:8088/asterisk/ws`

## 📱 Certificados Auto-Assinados

### Aceitar no Navegador

1. Acesse `https://192.168.15.165:3443`
2. Ignore o aviso de segurança
3. Clique "Avançado" → "Prosseguir para..."

### Aceitar no Mobile

**Android (React Native):**

- Os certificados auto-assinados são aceitos automaticamente em desenvolvimento

**iOS (React Native):**

- Pode ser necessário configurar exceções adicionais

## 🧪 Teste de Funcionamento

### 1. Verificar HTTPS

```bash
curl -k https://localhost:3443/
curl -k https://192.168.15.165:3443/
```

### 2. Verificar WebSocket Seguro

```javascript
const ws = new WebSocket("wss://192.168.15.165:3443/ws/device-status");
ws.onopen = () => console.log("WSS conectado!");
```

### 3. Verificar WebRTC

1. Acesse via HTTPS
2. Verifique se microfone é detectado
3. Teste chamadas entre IPs diferentes

## 🎯 Benefícios da Configuração HTTPS

- ✅ **WebRTC funciona** em qualquer IP da rede
- ✅ **Microfone detectado** corretamente
- ✅ **Navegadores modernos** não bloqueiam recursos
- ✅ **Conexões seguras** entre dispositivos
- ✅ **Compatibilidade móvel** melhorada
- ✅ **Performance** otimizada de ICE/STUN

## 🔄 Migração de HTTP → HTTPS

O sistema mantém **compatibilidade total**:

1. **Localhost**: Funciona em HTTP e HTTPS
2. **IPs externos**: Força HTTPS automaticamente
3. **Redirecionamento**: HTTP → HTTPS transparente
4. **WebSocket**: WS ↔ WSS automático

## 📋 Checklist de Verificação

- [ ] Script `setup-https.sh` executado
- [ ] Certificados SSL criados
- [ ] Servidor iniciado com HTTPS
- [ ] Frontend acessível via HTTPS
- [ ] WebSocket funcionando (WSS)
- [ ] Asterisk configurado para WSS
- [ ] Chamadas funcionando entre IPs diferentes
- [ ] Microfone detectado em todos os dispositivos

## 🔍 Troubleshooting

### Erro: "Certificado não confiável"

- Normal para certificados auto-assinados
- Aceite no navegador manualmente

### Erro: "WSS connection failed"

- Verifique configuração Asterisk WSS
- Confirme portas abertas (8089)

### Erro: "Microfone não detectado"

- Confirme acesso via HTTPS
- Verifique permissões do navegador

### Erro: "Chamadas não conectam"

- Teste STUN/TURN servers
- Verifique firewall/NAT
- Confirme ambos os dispositivos em HTTPS
