#!/bin/bash

set -e

PROJECT_ROOT=$(
    cd "$(dirname "${BASH_SOURCE[0]}")"
    pwd -P
)
PARENT_PATH="${PARENT_PATH}/.."

KEYSTORE_PATH="$PROJECT_ROOT/android/app/release.keystore"
KEYSTORE_ALIAS="release"
JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
ANDROID_HOME="/opt/android-sdk"
BUILD_TOOLS_VERSION="34.0.0"

export JAVA_HOME
export ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION:$PATH"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

if [ -z "$1" ]; then
    print_error "Uso: $0 <caminho-para-apk-unsigned>"
    echo "Exemplo: $0 compiled_apk/app-release-20240721-234500.apk"
    exit 1
fi

APK_INPUT="$1"
APK_ALIGNED="${APK_INPUT/unsigned/aligned}"
APK_OUTPUT="${APK_INPUT/unsigned/signed}"

if [ ! -f "$APK_INPUT" ]; then
    print_error "APK não encontrado: $APK_INPUT"
    exit 1
fi

rm -f "$APK_ALIGNED" "$APK_OUTPUT"

print_step "Preparando assinatura do APK..."

if [ ! -f "$KEYSTORE_PATH" ]; then
    print_warning "Keystore não encontrado. Criando novo keystore..."

    mkdir -p "$(dirname "$KEYSTORE_PATH")"

    echo "⌨️  Digite as informações para o keystore:"
    read -p "Nome da empresa/desenvolvedor: " COMPANY_NAME
    read -p "Nome da aplicação: " APP_NAME
    read -s -p "Senha do keystore (mínimo 6 caracteres): " KEYSTORE_PASSWORD
    echo
    read -s -p "Confirme a senha: " KEYSTORE_PASSWORD_CONFIRM
    echo

    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        print_error "Senhas não coincidem!"
        exit 1
    fi

    keytool -genkeypair \
        -alias "$KEYSTORE_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -keystore "$KEYSTORE_PATH" \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEYSTORE_PASSWORD" \
        -dname "CN=$APP_NAME, OU=$COMPANY_NAME, O=$COMPANY_NAME, L=Unknown, S=Unknown, C=BR"

    print_success "Keystore criado em: $KEYSTORE_PATH"

    cat > "$PROJECT_ROOT/keystore-info.txt" << EOF
Keystore criado em: $(date)
Caminho: $KEYSTORE_PATH
Alias: $KEYSTORE_ALIAS
Empresa: $COMPANY_NAME
App: $APP_NAME

IMPORTANTE: Guarde a senha do keystore em local seguro!
A senha NÃO está salva neste arquivo por segurança.
EOF

    print_warning "Informações do keystore salvas em: $PROJECT_ROOT/keystore-info.txt"
    print_warning "IMPORTANTE: Guarde a senha em local seguro!"

else
    print_step "Usando keystore existente: $KEYSTORE_PATH"
    read -s -p "Digite a senha do keystore: " KEYSTORE_PASSWORD
    echo
fi

print_step "Executando zipalign..."
zipalign -v -p 4 "$APK_INPUT" "$APK_ALIGNED"

print_step "Assinando APK com apksigner..."
apksigner sign \
  --ks "$KEYSTORE_PATH" \
  --ks-key-alias "$KEYSTORE_ALIAS" \
  --ks-pass pass:"$KEYSTORE_PASSWORD" \
  --key-pass pass:"$KEYSTORE_PASSWORD" \
  --out "$APK_OUTPUT" \
  "$APK_ALIGNED"

if [ $? -eq 0 ]; then
    print_success "APK assinado com sucesso!"
else
    print_error "Falha ao assinar APK"
    exit 1
fi

print_step "Verificando assinatura do APK..."
apksigner verify --verbose "$APK_OUTPUT"

if [ $? -eq 0 ]; then
    print_success "Assinatura verificada com sucesso!"
else
    print_error "Falha na verificação da assinatura"
    exit 1
fi

echo ""
echo "APK assinado: $APK_OUTPUT"
echo "Tamanho: $(du -h "$APK_OUTPUT" | cut -f1)"
