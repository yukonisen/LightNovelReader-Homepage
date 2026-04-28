import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { removeHtmlExtensionPlugin } from "vuepress-plugin-remove-html-extension";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "LightNovelReader",
  description: "开源的多数据源轻小说阅读器。",

  theme,
  plugins: [removeHtmlExtensionPlugin()],

  bundler: viteBundler({
    viteOptions: {
      ssr: {
        // Ensure Varlet UI (and its CSS) is bundled for SSR build.
        noExternal: ["@varlet/ui"]
      }
    }
  }),

  extendsPage: (page) => {
    if (page.filePathRelative?.startsWith("blog/")) {
      page.frontmatter.sidebar = false;
    }
  }
});
