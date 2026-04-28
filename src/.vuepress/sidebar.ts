import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "文档",
      icon: "material-symbols:docs-outline",
      prefix: "docs/",
      link: "docs/",
      children: [
        {
          text: "更新日志",
          icon: "material-symbols:history",
          link: "changelogs",
        },
      ],
    },
    {
      text: "开发文档",
      icon: "material-symbols:developer-mode-tv-outline",
      prefix: "plugin-dev/",
      link: "plugin-dev/",
      children: "structure",
    }
  ],
});
