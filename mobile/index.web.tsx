import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./app.json";

// import "./index.css";

const root = document.getElementById("root");
if (root) {
  root.style.height = "100%";

  AppRegistry.registerComponent(appName, () => App);

  AppRegistry.runApplication(appName, {
    rootTag: root,
  });
}
