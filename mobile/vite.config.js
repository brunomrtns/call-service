import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rnw from "vite-plugin-react-native-web";
import path from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react({
      tsconfig: "./tsconfig.web.json",
    }),
    svgr(),
    rnw(),
  ],
  resolve: {
    alias: {
      "react-native$": "react-native-web",
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".web.tsx", ".tsx", ".web.js", ".js"],
  },
  server: {
    port: 8080,
  },
  assetsInclude: ["**/*.ttf"],
});
