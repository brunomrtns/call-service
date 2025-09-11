#!/bin/bash

set -e

# Configurações do emulador:
# ~/.android/avd/Pixel34.avd/config.ini

export ANDROID_SDK_ROOT=/home/bruno/Android/Sdk
export ANDROID_HOME=$ANDROID_SDK_ROOT
export PATH=$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH

echo "==============================="
echo "Verificando dependências..."

if ! command -v java &> /dev/null; then
  echo "Java não está instalado."
  exit 1
fi

if [ ! -f "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "sdkmanager não encontrado em $ANDROID_SDK_ROOT"
  exit 1
fi

if [ ! -f "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager" ]; then
  echo "avdmanager não encontrado em $ANDROID_SDK_ROOT"
  exit 1
fi

if [ ! -f "$ANDROID_SDK_ROOT/emulator/emulator" ]; then
  echo "emulator não encontrado em $ANDROID_SDK_ROOT"
  exit 1
fi

if [ ! -f "$ANDROID_SDK_ROOT/platform-tools/adb" ]; then
  echo "adb não encontrado em $ANDROID_SDK_ROOT"
  exit 1
fi

echo "Requisitos atendidos!"
echo "==============================="

echo "Variáveis de ambiente configuradas."

echo "Instalando system image Android 34..."
sdkmanager --install "system-images;android-34;google_apis;x86_64"


if [ -d "$HOME/.android/avd/Pixel34.avd" ]; then
  echo "Removendo AVD Pixel34 antigo..."
  rm -rf "$HOME/.android/avd/Pixel34.avd"
fi
if [ -f "$HOME/.android/avd/Pixel34.ini" ]; then
  rm -f "$HOME/.android/avd/Pixel34.ini"
fi

echo "Criando AVD Pixel34..."
avdmanager create avd -n Pixel34 -k "system-images;android-34;google_apis;x86_64" -d pixel --force

echo "AVDs disponíveis:"
emulator -list-avds

echo "Desativando a janela de verificação de tempo de vida do GNOME..."
gsettings set org.gnome.mutter check-alive-timeout 60000

echo "Iniciando o emulador Pixel34..."
emulator -avd Pixel34 -gpu swiftshader_indirect -no-snapshot-load &

echo "Esperando o emulador iniciar..."
adb wait-for-device
sleep 10

echo "Corrigindo local.properties para SDK correto..."
PROJECT_DIR=$(pwd)
LOCAL_PROPERTIES_FILE="$PROJECT_DIR/android/local.properties"
echo "sdk.dir=$ANDROID_SDK_ROOT" > "$LOCAL_PROPERTIES_FILE"

echo "Rodando o app React Native no emulador..."
npx react-native run-android
