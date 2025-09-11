#!/bin/bash

set -e

export ANDROID_SDK_ROOT=/home/bruno/Android/Sdk
export ANDROID_HOME=$ANDROID_SDK_ROOT
export PATH=$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH

EMULATOR_NAME="Pixel34"

echo "🚀 Iniciando o emulador $EMULATOR_NAME com SwiftShader..."
emulator -avd "${EMULATOR_NAME}" -gpu swiftshader_indirect &

echo "⏳ Aguardando o emulador iniciar..."
adb wait-for-device
sleep 10

echo "📦 Iniciando Metro bundler..."
yarn start
# yarn start &

# sleep 5

# echo "📱 Construindo e instalando app no emulador..."
# npx react-native run-android

wait
