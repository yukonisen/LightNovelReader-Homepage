import { defineClientConfig } from "vuepress/client";
import { createPinia } from "pinia";
import Varlet from "@varlet/ui";
import "@varlet/ui/es/style";
import "./components/plugin-repository/style/main.css";
import PluginRepositoryApp from "./components/plugin-repository/App.vue";
import DownloadPage from "./components/download/DownloadPage.vue";

export default defineClientConfig({
  enhance({ app }) {
    app.use(createPinia());
    app.use(Varlet);
    app.component("PluginRepositoryApp", PluginRepositoryApp);
    app.component("DownloadPage", DownloadPage);
  },
});
