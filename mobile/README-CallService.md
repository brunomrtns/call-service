# Call Service Mobile - React Native

Este é um aplicativo React Native que replica a funcionalidade do frontend web do sistema de chamadas SIP, adaptado para dispositivos móveis.

## Funcionalidades

- **Login/Registro de usuários**
- **Conexão SIP com Asterisk**
- **Chamadas de voz**
- **Lista de contatos com status online/offline**
- **Interface moderna com React Native Paper**
- **Suporte a Android, iOS e Web**

## Estrutura do Projeto

```
src/
├── types/index.ts           # Tipos TypeScript adaptados do frontend web
├── services/sipService.ts   # Serviço SIP usando JsSIP
├── screens/CallServiceScreen.tsx # Tela principal do app
└── App.tsx                  # App principal simplificado
```

## Diferenças do Frontend Web

### Componentes

- **Material UI → React Native Paper**: Migração completa dos componentes
- **HTML Elements → React Native Components**: View, ScrollView, etc.
- **CSS Styles → StyleSheet**: Estilos nativos do React Native

### Funcionalidades

- **Permissões de Microfone**: Solicitação automática no Android
- **AsyncStorage**: Substituição do localStorage
- **WebSocket**: Mantido para atualizações em tempo real
- **JsSIP**: Mesma biblioteca SIP do frontend web

### Interface

- **Layout Responsivo**: Adaptado para telas móveis
- **Navegação Touch**: Otimizada para dispositivos móveis
- **Diálogos Nativos**: Portal e Dialog do React Native Paper

## Dependências Principais

- `jssip`: Cliente SIP para JavaScript
- `react-native-paper`: Componentes Material Design
- `@react-native-async-storage/async-storage`: Armazenamento local
- `axios`: Cliente HTTP
- `react-native-vector-icons`: Ícones

## Configuração

### Pré-requisitos

1. React Native development environment configurado
2. Servidor Asterisk configurado (mesmo do frontend web)
3. Backend API rodando em localhost:3001

### Instalação

```bash
cd /home/bruno/Desenvolvimento/call-service/mobile
yarn install
```

### Executar

```bash
# Android
yarn android

# iOS
yarn ios

# Web
yarn web
```

## Configurações SIP

As configurações estão em `src/types/index.ts`:

```typescript
export const ASTERISK_HOST = "192.168.15.176";
export const SIP_WS_URI = `ws://${ASTERISK_HOST}:8088/asterisk/ws`;
export const SIP_REALM = ASTERISK_HOST;
export const SIP_PASSWORD_DEFAULT = "Teste123";
```

## Permissões

### Android

O app solicita automaticamente permissão de microfone quando necessário.

### iOS

Adicione no `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Este app precisa acessar o microfone para fazer chamadas.</string>
```

## Funcionalidades Implementadas

### ✅ Tela de Login/Registro

- Formulários de login e registro
- Validação de campos
- Mensagens de erro/sucesso

### ✅ Dashboard Principal

- Lista de contatos com status SIP
- Botão de discar número
- Status de conexão SIP
- Logout

### ✅ Sistema de Chamadas

- Fazer chamadas para contatos online
- Discar números diretamente
- Receber chamadas
- Atender/recusar chamadas
- Desligar chamadas

### ✅ Interface Responsiva

- Design adaptado para mobile
- Componentes Material Design
- Animações e transições suaves

## Melhorias Futuras

- [ ] Histórico de chamadas
- [ ] Configurações de áudio
- [ ] Notificações push para chamadas
- [ ] Suporte a vídeo chamadas
- [ ] Modo escuro
- [ ] Internacionalização (i18n)

## Troubleshooting

### Erro de Conexão SIP

1. Verifique se o Asterisk está rodando
2. Confirme as configurações de rede
3. Teste a conectividade WebSocket

### Erro de Permissão de Microfone

1. Verifique as permissões do app nas configurações
2. Reinstale o app se necessário

### Erro de Build

1. Execute `yarn install` novamente
2. Limpe o cache: `yarn clean`
3. Verifique a versão do Node.js (recomendado: 18+)
