import { defineClientConfig } from "vuepress/client";
import { createPinia } from "pinia";
import Varlet from "@varlet/ui";
import "@varlet/ui/es/style";
import ChangelogPage from "./components/changelog/ChangelogPage.vue";
import DownloadPage from "./components/download/DownloadPage.vue";
import FooterBlock from "./components/layout/FooterBlock.vue";

export default defineClientConfig({
  rootComponents: [FooterBlock],

  enhance({ app, router }) {
    app.use(createPinia());
    app.use(Varlet);
    app.component("ChangelogPage", ChangelogPage);
    app.component("DownloadPage", DownloadPage);
    
    if (typeof window !== "undefined") {
      import("vue-matomo").then((module) => {
        const VueMatomo = module.default;
        app.use(VueMatomo, {
          host: "https://analytics.nariko.org/",
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
