import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "开发文档",
      icon: "material-symbols:developer-mode-tv-outline",
      prefix: "plugin-dev/",
      link: "plugin-dev/",
      children: "structure",
    }
  ],
});
