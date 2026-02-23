import { defineClientConfig } from "vuepress/client";
import { createPinia } from "pinia";
import Varlet from "@varlet/ui";
import "@varlet/ui/es/style";
import "./components/plugin-repository/style/main.css";
import PluginRepositoryApp from "./components/plugin-repository/App.vue";
import DownloadPage from "./components/download/DownloadPage.vue";
import VueMatomo from "vue-matomo";

export default defineClientConfig({
  enhance({ app, router }) {
    app.use(createPinia());
    app.use(Varlet);
    app.component("PluginRepositoryApp", PluginRepositoryApp);
    app.component("DownloadPage", DownloadPage);
    
    app.use(VueMatomo, {
      host: "https://analytics.curiousers.org/",
      siteId: 3,
      router: router,
      enableLinkTracking: true,
      trackInitialView: true,
      disableCookies: false,
      requireConsent: false,
      enableHeartBeatTimer: false,
    });
  },
});
