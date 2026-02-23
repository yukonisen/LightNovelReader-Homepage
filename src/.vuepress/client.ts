import { defineClientConfig } from "vuepress/client";
import { createPinia } from "pinia";
import Varlet from "@varlet/ui";
import "@varlet/ui/es/style";
import "./components/plugin-repository/style/main.css";
import PluginRepositoryApp from "./components/plugin-repository/App.vue";
import DownloadPage from "./components/download/DownloadPage.vue";

export default defineClientConfig({
  enhance({ app, router }) {
    app.use(createPinia());
    app.use(Varlet);
    app.component("PluginRepositoryApp", PluginRepositoryApp);
    app.component("DownloadPage", DownloadPage);
    
    if (typeof window !== "undefined") {
      import("vue-matomo").then((module) => {
        const VueMatomo = module.default;
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
      });
    }
  },
});
