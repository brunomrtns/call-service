module.exports = {
  project: {
    android: {
      sourceDir: "android",
      appName: "app",
      packageName: "com.brunomrtns.reactnative",
      mainActivity: ".MainActivity",
      manifestPath: "android/app/src/main/AndroidManifest.xml",
    },
    ios: {
      sourceDir: "ios",
      xcodeProject: {
        name: "reactnative.xcodeproj",
        isWorkspace: false,
      },
    },
  },
};
