# Call Service

Microsserviço backend para gerenciamento de chamadas VoIP com integração Asterisk ARI.

## Funcionalidades

- 🔐 **Autenticação e Autorização**: JWT com diferentes níveis de usuário
- 📞 **Gerenciamento de Chamadas**: Iniciar, atender, transferir e finalizar chamadas
- 🎯 **Integração Asterisk**: Comunicação em tempo real via ARI WebSocket
- 💬 **Socket.IO**: Notificações em tempo real para o frontend
- 📊 **Histórico de Chamadas**: Registro completo de todas as chamadas
- 👥 **Gerenciamento de Usuários**: CRUD completo com diferentes perfis
- 🔢 **Dispositivos SIP**: Geração automática de devices para usuários

## Tecnologias

- **TypeScript**: Linguagem principal
- **Express.js**: Framework web
- **Prisma**: ORM para PostgreSQL
- **Socket.IO**: WebSocket para tempo real
- **Jest**: Testes unitários
- **Asterisk ARI**: Integração com PBX
- **JWT**: Autenticação
- **Winston**: Logs

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- Asterisk com ARI habilitado
- npm ou yarn

## Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd call-service
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrações do banco:

```bash
npm run migrate
```

5. Popule o banco com dados iniciais:

```bash
npm run db:seed
```

## Scripts

- `npm run dev` - Executar em modo desenvolvimento
- `npm run build` - Compilar TypeScript
- `npm start` - Executar aplicação compilada
- `npm test` - Executar testes
- `npm run test:coverage` - Executar testes com coverage
- `npm run migrate` - Executar migrações
- `npm run db:seed` - Popular banco com dados iniciais

## Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controladores das rotas
├── middleware/      # Middlewares
├── services/        # Lógica de negócio
├── routes/          # Definição das rotas
├── types/           # Tipos TypeScript
├── utils/           # Utilitários
└── tests/           # Testes
```

## API Endpoints

### Autenticação

- `POST /api/users/login` - Login do usuário
- `POST /api/users/register` - Registro de usuário

### Usuários

- `GET /api/users/profile` - Perfil do usuário logado
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users` - Listar usuários (admin)
- `POST /api/users` - Criar usuário (admin)
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/:id` - Atualizar usuário (admin)
- `DELETE /api/users/:id` - Deletar usuário (admin)

### Chamadas

- `POST /api/calls/make` - Iniciar chamada
- `POST /api/calls/:id/answer` - Atender chamada
- `POST /api/calls/:id/hangup` - Finalizar chamada
- `POST /api/calls/:id/transfer` - Transferir chamada
- `GET /api/calls/history` - Histórico de chamadas
- `GET /api/calls/active` - Chamadas ativas
- `GET /api/calls/statistics` - Estatísticas
- `POST /api/calls/:id/notes` - Adicionar notas

## Socket.IO Events

### Cliente para Servidor

- `join_call` - Entrar em uma chamada
- `leave_call` - Sair de uma chamada
- `update_status` - Atualizar status
- `typing` - Indicador de digitação

### Servidor para Cliente

- `call_initiated` - Chamada iniciada
- `call_ringing` - Telefone tocando
- `call_answered` - Chamada atendida
- `call_ended` - Chamada finalizada
- `call_transferred` - Chamada transferida

## Configuração do Asterisk

### ARI Configuration (ari.conf)

```ini
[general]
enabled = yes
pretty = yes

[admin]
type = user
read_only = no
password = admin
```

### Extensions Configuration (extensions.conf)

```ini
[default]
exten => _3XXX,1,Stasis(call-service,${EXTEN})
```

## Desenvolvimento

1. Execute o servidor em modo desenvolvimento:

```bash
npm run dev
```

2. Execute os testes:

```bash
npm test
```

3. Execute com coverage:

```bash
npm run test:coverage
```

## Logs

Os logs são salvos em:

- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
