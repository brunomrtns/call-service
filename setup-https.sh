#!/bin/bash

# Script para configurar HTTPS no Call Service

echo "🔒 Configurando HTTPS para Call Service..."

# Criar diretório SSL
mkdir -p ssl

# Gerar certificados auto-assinados
echo "📜 Gerando certificados SSL auto-assinados..."

openssl req -x509 -newkey rsa:4096 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -days 365 \
  -nodes \
  -subj "/C=BR/ST=State/L=City/O=CallService/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.15.165,IP:192.168.15.176"

if [ $? -eq 0 ]; then
  echo "✅ Certificados SSL criados com sucesso!"
  
  # Criar arquivo .env com configurações HTTPS
  echo "📝 Configurando variáveis de ambiente..."
  
  cat >> .env << EOF

# Configurações HTTPS
HTTPS_ENABLED=true
HTTPS_PORT=3443
HTTPS_CERT_PATH=./ssl/cert.pem
HTTPS_KEY_PATH=./ssl/key.pem
EOF
  
  echo "✅ Configurações HTTPS adicionadas ao .env"
  
  echo ""
  echo "🚀 Configuração concluída!"
  echo ""
  echo "Para iniciar o servidor com HTTPS:"
  echo "  npm start"
  echo ""
  echo "URLs disponíveis:"
  echo "  HTTPS: https://localhost:3443"
  echo "  HTTPS (rede): https://192.168.15.165:3443"
  echo "  HTTP (redirect): http://localhost:3001 -> HTTPS"
  echo ""
  echo "⚠️  Para o Asterisk:"
  echo "  Configure WSS na porta 8089 no http.conf:"
  echo "  enabled=yes"
  echo "  bindaddr=0.0.0.0"
  echo "  bindport=8089"
  echo "  tlsenable=yes"
  echo "  tlscertfile=/path/to/cert.pem"
  echo "  tlsprivatekey=/path/to/key.pem"
  
else
  echo "❌ Erro ao gerar certificados SSL"
  exit 1
fi
