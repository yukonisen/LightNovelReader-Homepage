---
home: true
title: 主页 - 开源的轻小说阅读器
heroImage: /lnr.svg
bgImage: assets/image/hero-bg.webp
bgImageDark: assets/image/hero-bg-dark.webp
bgImageStyle:
  background-attachment: fixed
heroStyle:
  min-height: 940px
heroText: LightNovelReader
tagline: 开源的轻小说阅读器
actions:
  - text: 下载发布版
    icon: material-symbols:download
    link: ./download
    type: primary

#  - text: 开发指南
#    link: ./guide/
#
#  - text: 常见问题
#    link: ./faq/
    
highlights:
  - header: 主要功能
    description: 以下是我们提供的一些功能，了解 LightNovelReader 的不同之处。
    image: /assets/image/placeholder.svg
    bgImage: assets/image/hero-bg-secondary.webp
    bgImageDark: assets/image/hero-bg-dark-secondary.webp
    bgImageStyle:
      background-attachment: fixed
    features:
      - title: 全新重构
        icon: material-symbols:fiber-new
        details: 自从 1.0.0 开始，我们重构了整体软件架构。

      - title: Jetpack Compose
        icon: simple-icons:jetpackcompose
        details: 使用 Jetpack Compose 编写，具有流畅的阅读体验。

      - title: 缓存
        icon: material-symbols:cached
        details: 支持缓存书本内容，以及离线优先的阅读

      - title: 探索
        icon: material-symbols:explore-rounded
        details: 发现新书、推荐榜，标签分类，关键词搜索……

      - title: 多数据源 *¹
        icon: material-symbols:frame-source-sharp
        details: 多数据源插件支持，数据源之间数据独立。开发属于自己的数据源插件。

      - title: 书架
        icon: material-symbols:shelves
        details: 完整的书架系统，支持自定义书架、加入收藏、获取书本更新提示。

      - title: 导出
        icon: material-symbols:file-export
        details: 支持将书本导出为 EPUB 格式文件。

      - title: 统计
        icon: material-symbols:analytics
        details: 查看每日阅读时长、获取整体阅读数据。

      - title: 良好兼容
        icon: material-symbols:check-circle-rounded
        details: 支持 Android 7.0 至最新版本，应用体积小巧，适合在各种设备上使用。

      - title: 自定义
        icon: material-symbols:custom-typography-rounded
        details: 配置主题、字体、阅读背景……超多自定义选项，打造属于你的阅读体验。

      - title: 设计
        icon: material-symbols:design-services-rounded
        details: 遵循 Material Design 设计，致力于打造易用且别具一格的用户界面。

      - title: 热情的开发者
        icon: material-symbols:communication
        details: 加入讨论群和我们热情的开发者一起讨论，或提供意见反馈。
        link: https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=P__gXIArh5UDBsEq7ttd4WhIYnNh3y1t&authKey=GAsRKEZ%2FwHpzRv19hNJsDnknOc86lYzNIHMPy2Jxt3S3U8f90qestOd760IAj%2F3l&noverify=0&group_code=867785526

#  - header: 可定制的页面
#    description: 完整无障碍支持的可定制外观
#    image: /assets/image/ui.svg
#    bgImage: https://theme-hope-assets.vuejs.press/bg/9-light.svg
#    bgImageDark: https://theme-hope-assets.vuejs.press/bg/9-dark.svg
#    highlights:
#      - title: 深色模式
#        icon: circle-half-stroke
#        details: 可以自由切换浅色模式与深色模式
#        link: https://theme-hope.vuejs.press/zh/guide/interface/darkmode.html
#
#      - title: 主题色切换
#        icon: palette
#        details: 支持自定义主题色并允许用户在预设的主题颜色之间切换
#        link: https://theme-hope.vuejs.press/zh/guide/interface/theme-color.html
#
#      - title: 更多
#        icon: ellipsis
#        details: RTL 布局，打印支持，全局按钮等
#        link: https://theme-hope.vuejs.press/zh/guide/interface/others.html
#
#  - header: 布局
#    description: 一个完美的响应式布局。
#    image: /assets/image/layout.svg
#    bgImage: https://theme-hope-assets.vuejs.press/bg/5-light.svg
#    bgImageDark: https://theme-hope-assets.vuejs.press/bg/5-dark.svg
#    highlights:
#      - title: 导航栏
#        icon: window-maximize
#        details: 完全可定制的导航栏以及改进的移动端外观
#        link: https://theme-hope.vuejs.press/zh/guide/layout/navbar.html
#
#      - title: 侧边栏
#        icon: fas fa-window-maximize fa-rotate-270
#        details: 从文档标题或文件结构中自动生成侧边栏
#        link: https://theme-hope.vuejs.press/zh/guide/layout/sidebar.html
#
#      - title: 幻灯片页面
#        icon: person-chalkboard
#        details: 添加幻灯片页面以显示你喜欢的内容
#        link: https://theme-hope.vuejs.press/zh/guide/layout/slides.html
#
#      - title: 布局增强
#        icon: object-group
#        details: 添加路径导航、页脚、改进的导航栏、改进的页面导航等。
#        link: https://theme-hope.vuejs.press/zh/guide/layout/
#
#      - title: 更多
#        icon: ellipsis
#        details: RTL 布局，打印支持，全局按钮等
#        link: https://theme-hope.vuejs.press/zh/guide/interface/others.html
#
#  - header: 新功能
#    image: /assets/image/features.svg
#    bgImage: https://theme-hope-assets.vuejs.press/bg/1-light.svg
#    bgImageDark: https://theme-hope-assets.vuejs.press/bg/1-dark.svg
#    features:
#      - title: 目录页面
#        icon: network-wired
#        details: 自动生成目录页以及开箱即用的目录组件
#        link: https://theme-hope.vuejs.press/zh/guide/feature/catalog.html
#
#      - title: 浏览量与评论
#        icon: comment-dots
#        details: 配合 4 个评论服务开启阅读量统计与评论支持
#        link: https://theme-hope.vuejs.press/zh/guide/feature/comment.html
#
#      - title: 文章信息
#        icon: circle-info
#        details: 为你的文章添加作者、写作日期、预计阅读时间、字数统计等信息
#        link: https://theme-hope.vuejs.press/zh/guide/feature/page-info.html
#
#      - title: 文章加密
#        icon: lock
#        details: 你可以为你的特定页面或特定目录进行加密，以便陌生人不能随意访问它们
#        link: https://theme-hope.vuejs.press/zh/guide/feature/encrypt.html
#
#      - title: 搜索支持
#        icon: search
#        details: 支持 docsearch 和基于客户端的搜索
#        link: https://theme-hope.vuejs.press/zh/guide/feature/search.html
#
#      - title: 代码块
#        icon: code
#        details: 自定义代码块主题、行号、行高亮、复制按钮等
#        link: https://theme-hope.vuejs.press/zh/guide/markdown/code/fence.html
#
#      - title: 图片预览
#        icon: image
#        details: 像相册一样允许你浏览、缩放并分享你的页面图片
#        link: https://theme-hope.vuejs.press/zh/guide/feature/photo-swipe.html
#
#  - header: 博客
#    description: 通过主题创建个人博客
#    image: /assets/image/blog.svg
#    bgImage: https://theme-hope-assets.vuejs.press/bg/5-light.svg
#    bgImageDark: https://theme-hope-assets.vuejs.press/bg/5-dark.svg
#    highlights:
#      - title: 博客功能
#        icon: blog
#        details: 通过文章的日期、标签和分类展示文章
#        link: https://theme-hope.vuejs.press/zh/guide/blog/intro.html
#
#      - title: 博客主页
#        icon: house
#        details: 全新博客主页
#        link: https://theme-hope.vuejs.press/zh/guide/blog/home.html
#
#      - title: 博主信息
#        icon: circle-info
#        details: 自定义名称、头像、座右铭和社交媒体链接
#        link: https://theme-hope.vuejs.press/zh/guide/blog/blogger.html
#
#      - title: 时间线
#        icon: clock
#        details: 在时间线中浏览和通读博文
#        link: https://theme-hope.vuejs.press/zh/guide/blog/timeline.html
#
#  - header: 高级
#    description: 增强站点与用户体验的高级功能
#    image: /assets/image/advanced.svg
#    bgImage: https://theme-hope-assets.vuejs.press/bg/4-light.svg
#    bgImageDark: https://theme-hope-assets.vuejs.press/bg/4-dark.svg
#    highlights:
#      - title: SEO 增强
#        icon: dumbbell
#        details: 将最终生成的网页针对搜索引擎进行优化。
#        link: https://theme-hope.vuejs.press/zh/guide/advanced/seo.html
#
#      - title: Sitemap
#        icon: sitemap
#        details: 自动为你的网站生成 Sitemap
#        link: https://theme-hope.vuejs.press/zh/guide/advanced/sitemap.html
#
#      - title: Feed 支持
#        icon: rss
#        details: 生成你的 Feed，并通知你的用户订阅它
#        link: https://theme-hope.vuejs.press/zh/guide/advanced/feed.html
#
#      - title: PWA 支持
#        icon: mobile-screen
#        details: 让你的网站更像一个 APP
#        link: https://theme-hope.vuejs.press/zh/guide/advanced/pwa.html
#
#copyright: false
---

<small>注：</small>
¹ <small><small>插件系统及 API 当前仍在开发阶段，具体效果以数据源实现为准。</small></small>