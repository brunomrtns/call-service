# React Native CLI App

Este projeto foi migrado do Expo para React Native CLI (RN CLI) e utiliza o fluxo nativo de build para Android e iOS.

## Pré-requisitos

- Node.js (recomendado: versão LTS)
- Yarn ou npm
- Android Studio (para build/emulação Android)
- Xcode (apenas para build iOS, macOS)
- Java 17+
- [Ambiente React Native CLI configurado](https://reactnative.dev/docs/environment-setup) (siga a opção "React Native CLI Quickstart")

## Instalação

1. Instale as dependências:

   ```bash
   yarn install
   # ou
   npm install
   ```

2. Instale pods (apenas no macOS para iOS):

   ```bash
   cd ios && pod install && cd ..
   ```

## Rodando o app

### Android

```bash
npx react-native run-android
```

### iOS (apenas macOS)

```bash
npx react-native run-ios
```

### Metro Bundler

O Metro Bundler será iniciado automaticamente, mas você pode rodar manualmente:

```bash
npx react-native start
```

## Scripts úteis

- `yarn lint` ou `npm run lint`: roda o ESLint
- `yarn android` ou `npm run android`: build e instala no emulador/dispositivo Android
- `yarn ios` ou `npm run ios`: build e instala no simulador iOS

## Estrutura do projeto

- `app/` — código-fonte principal (componentes, telas, hooks, etc)
- `android/` — projeto nativo Android (Gradle)
- `ios/` — projeto nativo iOS (Xcode)
- `assets/` — imagens, fontes, etc
- `scripts/` — scripts utilitários

## Dicas e problemas comuns

- Sempre limpe o cache após atualizar dependências nativas:
  ```bash
  cd android && ./gradlew clean && cd ..
  npx react-native start --reset-cache
  ```
- Se tiver problemas com pods (iOS):
  ```bash
  cd ios && pod install --repo-update && cd ..
  ```
- Certifique-se de que as variáveis de ambiente JAVA_HOME e ANDROID_HOME estão configuradas.

## Documentação

- [Documentação React Native](https://reactnative.dev/docs/environment-setup)
- [Guia de migração Expo → RN CLI (oficial)](https://reactnative.dev/docs/moving-to-expo-managed-workflow)

## Licença

Este projeto está sob a licença MIT.
