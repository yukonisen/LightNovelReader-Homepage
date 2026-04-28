---
title: 插件仓库 API
order: 10
---

# 插件仓库 API

这组接口保留给独立的插件仓库前端或客户端使用。

当前保留的接口有：

- `GET /api/plugins`
- `GET /api/plugins?id=<pluginId>`
- `GET /api/plugin-asset?path=<repositoryPath>`

接口设计目标：

- 让网站前端和客户端共用一套数据源
- 不需要维护总列表文件，服务端直接扫描仓库
- 返回结构尽量稳定，便于后续新增字段
- 下载资源走同源代理，避免浏览器直接请求第三方代理地址

## 数据来源

服务端当前会扫描 GitHub 仓库：

```text
dmzz-yyhyy/LightNovelReader-PluginRepository@main
```

支持两种元数据来源：

1. 推荐格式：`plugins/<pluginId>/plugin.toml`
2. 兼容格式：`data/<pluginId>/metadata.json`

如果同一个插件同时存在两种格式，优先使用 `plugin.toml`。

## 1. 获取插件列表

### 请求

```http
GET /api/plugins
```

### 返回

```json
{
  "schema_version": 1,
  "generated_at": "2026-04-10T10:49:03.991Z",
  "repository": {
    "owner": "dmzz-yyhyy",
    "repo": "LightNovelReader-PluginRepository",
    "ref": "main"
  },
  "categories": [
    {
      "id": "all",
      "name": "全部插件",
      "count": 2
    }
  ],
  "plugins": [
    {
      "id": "com.example.plugin",
      "name": "example",
      "author": "none",
      "category": "未分类",
      "summary": "a example plugin",
      "languages": [],
      "copyright": "Copyright (c) Example Author",
      "release": {
        "version_name": "0.0.1",
        "version_code": 1,
        "updated_at": "2026-04-10T10:30:00Z"
      },
      "compatibility": {
        "target_api": 2
      },
      "assets": {
        "icon": {
          "path": "plugins/com.example.plugin/icon",
          "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon",
          "variants": [
            {
              "path": "plugins/com.example.plugin/icon.png",
              "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.png",
              "mime_type": "image/png"
            }
          ]
        },
        "hero_image": {
          "path": "plugins/com.example.plugin/heroImage",
          "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2FheroImage",
          "variants": [
            {
              "path": "plugins/com.example.plugin/heroImage.jpg",
              "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2FheroImage.jpg",
              "mime_type": "image/jpeg"
            }
          ]
        },
        "screenshots": []
      }
    }
  ]
}
```

### 字段说明

#### 顶层字段

- `schema_version`
  - 接口 schema 版本。当前为 `1`。
- `generated_at`
  - 服务端生成快照时间，ISO 8601 格式。
- `repository`
  - 当前读取的仓库信息。
- `categories`
  - 分类列表，永远包含 `全部插件`。
- `plugins`
  - 插件摘要列表。

#### `categories[]`

- `id`
  - 稳定的 slug，可用于前端筛选。
- `name`
  - 分类显示名称。
- `count`
  - 当前分类下的插件数量。

#### `plugins[]`

- `id`
  - 插件唯一 ID。
- `name`
  - 插件名称。
- `author`
  - 作者名称。
- `category`
  - 分类名称。
- `summary`
  - 摘要说明。
- `languages`
  - 插件内容语言列表。
- `copyright`
  - 版权信息。
- `release`
  - 当前发布版本摘要。
- `compatibility`
  - 兼容性信息。
- `assets`
  - 图片资源信息。

#### `release`

- `version_name`
  - 版本名称，如 `0.0.1`
- `version_code`
  - 数字版本号，可选
- `updated_at`
  - 当前版本更新时间，可选，ISO 8601 字符串
  - 不由开发者手动填写
  - 服务端会根据元数据文件在 git 中最近一次提交时间推导

#### `compatibility`

- `target_api`
  - 插件目标 API 版本，可选

#### `assets`

- `icon`
  - 插件图标，可选
- `hero_image`
  - 详情页头图，可选
- `screenshots`
  - 简介预览图列表，按文件名排序

图片资源结构统一为：

```json
{
  "path": "plugins/com.example.plugin/icon",
  "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon",
  "variants": [
    {
      "path": "plugins/com.example.plugin/icon.png",
      "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.png",
      "mime_type": "image/png"
    }
  ]
}
```

- `path`
  - 仓库内逻辑资源路径，不带图片后缀
- `url`
  - 同源代理地址，不带图片后缀
- `variants`
  - 当前存在的具体图片文件列表

如果前端不确定图片类型，可以直接请求 `url`，例如：

```http
GET /api/plugin-asset?path=plugins/com.example.plugin/icon
```

接口会返回：

```json
{
  "path": "plugins/com.example.plugin/icon",
  "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon",
  "variants": [
    {
      "path": "plugins/com.example.plugin/icon.png",
      "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.png",
      "mime_type": "image/png"
    },
    {
      "path": "plugins/com.example.plugin/icon.jpg",
      "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.jpg",
      "mime_type": "image/jpeg"
    }
  ]
}
```

具体图片文件项中的 `mime_type` 当前仅返回 `image/png` 或 `image/jpeg`。

## 2. 获取插件详情

### 请求

```http
GET /api/plugins?id=com.example.plugin
```

### 返回

```json
{
  "schema_version": 1,
  "generated_at": "2026-04-10T10:49:03.991Z",
  "repository": {
    "owner": "dmzz-yyhyy",
    "repo": "LightNovelReader-PluginRepository",
    "ref": "main"
  },
  "plugin": {
    "id": "com.example.plugin",
    "name": "example",
    "author": "none",
    "category": "未分类",
    "summary": "a example plugin",
    "description": "a example plugin",
    "languages": [],
    "copyright": "Copyright (c) Example Author",
    "release": {
      "version_name": "0.0.1",
      "version_code": 1,
      "updated_at": "2026-04-10T10:30:00Z"
    },
    "compatibility": {
      "target_api": 2
    },
    "changelog": "",
    "privacy": {
      "data_keys": [
        "network_access"
      ],
      "custom_items": [
        "站点返回的用户等级信息"
      ],
      "notes": ""
    },
    "assets": {
      "icon": {
        "path": "plugins/com.example.plugin/icon",
        "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon",
        "variants": [
          {
            "path": "plugins/com.example.plugin/icon.png",
            "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.png",
            "mime_type": "image/png"
          }
        ]
      },
      "hero_image": {
        "path": "plugins/com.example.plugin/heroImage",
        "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2FheroImage",
        "variants": [
          {
            "path": "plugins/com.example.plugin/heroImage.jpg",
            "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2FheroImage.jpg",
            "mime_type": "image/jpeg"
          }
        ]
      },
      "screenshots": [
        {
          "path": "plugins/com.example.plugin/1",
          "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2F1",
          "variants": [
            {
              "path": "plugins/com.example.plugin/1.png",
              "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2F1.png",
              "mime_type": "image/png"
            }
          ]
        },
        {
          "path": "plugins/com.example.plugin/2",
          "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2F2",
          "variants": [
            {
              "path": "plugins/com.example.plugin/2.jpg",
              "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2F2.jpg",
              "mime_type": "image/jpeg"
            }
          ]
        }
      ]
    },
    "links": {
      "homepage": "https://example.com",
      "repository": "https://github.com/example/repo",
      "source_directory": "https://github.com/dmzz-yyhyy/LightNovelReader-PluginRepository/tree/main/data/com.example.plugin"
    },
    "download": {
      "type": "multipart_zip",
      "file_name": "example-0.0.1.apk.lnrp",
      "size_bytes": 1048576,
      "part_urls": [
        "/api/plugin-asset?path=data%2Fcom.example.plugin%2Fplugin.zip.001"
      ]
    },
    "source": {
      "format": "legacy_metadata_json",
      "manifest_path": "data/com.example.plugin/metadata.json"
    }
  }
}
```

### 详情字段补充说明

#### `description`

完整介绍文本。

#### `changelog`

当前版本更新日志。可能为空字符串。

#### `copyright`

版权信息。可能为空字符串。

#### `privacy`

- `data_keys`
  - 开发者从你定义的“标准收集信息命名列表”中选择的键名列表
- `custom_items`
  - 不在标准命名列表中的手动说明项
- `notes`
  - 额外补充说明

#### `assets`

- `icon`
  - 列表和详情页可用的插件图标
- `hero_image`
  - 详情页宽图背景
- `screenshots`
  - 简介预览图列表

服务端会返回仓库内路径和同源代理地址。

#### `links`

- `homepage`
  - 插件主页，可选
- `repository`
  - 源码仓库，可选
- `source_directory`
  - 插件仓库中的源码目录

#### `download`

支持两种下载形式：

1. `single_file`
2. `multipart_zip`

##### `single_file`

```json
{
  "type": "single_file",
  "file_name": "plugin.apk.lnrp",
  "size_bytes": 524288,
  "url": "/api/plugin-asset?path=plugins%2Fexample%2Fplugin.apk.lnrp"
}
```

##### `multipart_zip`

```json
{
  "type": "multipart_zip",
  "file_name": "example-0.0.1.apk.lnrp",
  "size_bytes": 1048576,
  "part_urls": [
    "/api/plugin-asset?path=data%2Fcom.example.plugin%2Fplugin.zip.001",
    "/api/plugin-asset?path=data%2Fcom.example.plugin%2Fplugin.zip.002"
  ]
}
```

前端或客户端拿到 `multipart_zip` 后，需要：

1. 按顺序下载全部分卷
2. 以二进制顺序拼接
3. 作为 zip 解包
4. 取出其中的插件文件

#### `download.size_bytes`

- 插件下载资源的大致大小，单位为字节
- 对于单文件下载，通常是文件自身大小
- 对于分卷 zip，通常是所有分卷文件大小之和
- 如果仓库上游没有提供大小，字段可能缺失

#### `source`

- `format`
  - 元数据来源格式
  - 当前可能值：
    - `plugin_toml_v1`
    - `legacy_metadata_json`
- `manifest_path`
  - 仓库内的元数据文件路径

## 3. 下载资源代理

### 请求

```http
GET /api/plugin-asset?path=data/com.example.plugin/plugin.zip.001
```

### 作用

这个接口是资源二进制代理，给浏览器或独立前端使用。

当 `path` 指向具体文件时，它会按顺序尝试从以下上游读取文件：

1. `raw.githubusercontent.com`
2. `cdn.jsdelivr.net`

然后以同源响应的方式返回给调用方。

当 `path` 是不带后缀的图片逻辑名时，例如 `plugins/com.example.plugin/icon`，它不会返回二进制，而是返回当前存在的图片变体列表。

### 参数

- `path`
  - 仓库内文件路径
  - 必须是相对路径
  - 不能以 `/` 开头
  - 不能包含 `..`

### 成功响应

具体文件：

- 原样返回二进制内容
- `Content-Type` 会继承上游，缺失时回退为 `application/octet-stream`

逻辑图片名：

```json
{
  "path": "plugins/com.example.plugin/icon",
  "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon",
  "variants": [
    {
      "path": "plugins/com.example.plugin/icon.png",
      "url": "/api/plugin-asset?path=plugins%2Fcom.example.plugin%2Ficon.png",
      "mime_type": "image/png"
    }
  ]
}
```

### 失败响应

```json
{
  "error": "Failed to fetch asset",
  "path": "data/com.example.plugin/plugin.zip.001",
  "details": [
    "https://raw.githubusercontent.com/... => 404",
    "https://cdn.jsdelivr.net/... => 404"
  ]
}
```

## 错误处理

### `GET /api/plugins`

常见错误：

- `405 Method not allowed`
- `500 Failed to load repository snapshot`

### `GET /api/plugins?id=<id>`

当插件不存在时返回：

```json
{
  "schema_version": 1,
  "error": "Plugin not found",
  "id": "unknown.plugin"
}
```

状态码为 `404`。

### `GET /api/plugin-asset`

常见错误：

- `400 Invalid path`
- `405 Method not allowed`
- `502 Failed to fetch asset`

## 缓存行为

### `/api/plugins`

- 服务端内存缓存 5 分钟
- 适合用于插件列表页和详情页初始化

### `/api/plugin-asset`

- 响应头为 `Cache-Control: public, max-age=300, s-maxage=300`
- 适合 CDN 和浏览器短期缓存

## 兼容性说明

服务端不再推导宿主兼容矩阵。

当前只返回插件声明的：

- `compatibility.target_api`

具体“这个 API 被哪些宿主支持”，应由插件 API 或宿主自身去维护和解释，不由插件仓库接口展开。

## `plugin.toml` 建议字段

推荐把新的元数据写在 `plugins/<pluginId>/plugin.toml`。

示例：

```toml
id = "com.example.plugin"
name = "Example Plugin"
author = "Example Author"
summary = "简短介绍"
description = """
这里是更完整的插件介绍。
"""
category = "未分类"
languages = ["zh-CN", "en"]
copyright = "Copyright (c) Example Author"
target_api = 2

[release]
version_name = "0.0.1"
version_code = 1
changelog = "首个公开版本"

[release.download]
file = "plugin.apk.lnrp"
output_file = "Example Plugin-0.0.1.apk.lnrp"

[privacy]
data_keys = ["network_access", "account_id"]
custom_items = ["站点返回的用户等级信息"]
notes = "仅用于站点鉴权和目录抓取"

[links]
homepage = "https://example.com"
repository = "https://github.com/example/repo"

[assets]
icon = "icon.png"
hero_image = "heroImage.png"
```

说明：

- `release.updated_at` 不需要填写，服务端会直接读取该元数据文件最近一次 git 提交时间
- `privacy.data_keys` 由开发者填写你后续定义的标准命名
- `privacy.custom_items` 用于补充不在标准列表中的描述
- `assets.icon` 和 `assets.hero_image` 可填写相对路径
- 即使开发者填写了带后缀的文件名，接口返回时也会统一折叠成不带后缀的逻辑路径
- `assets.screenshots` 可以不填；如果不填，服务端会自动扫描插件目录下除 `icon.*`、`heroImage.*` 外的 `png/jpg/jpeg` 文件，并按文件名字典序返回
- 图片目前支持 `png`、`jpg`、`jpeg`

## 推荐调用方式

### 独立前端

1. 首屏请求 `GET /api/plugins`
2. 进入详情页请求 `GET /api/plugins?id=<pluginId>`
3. 下载时使用详情中的 `download` 字段
4. 不要自行拼第三方资源地址

### 客户端

1. 直接调用 `GET /api/plugins`
2. 使用 `schema_version` 做兼容判断
3. 下载时优先使用 `download.url` 或 `download.part_urls`
4. `multipart_zip` 需要客户端自己合并和解包

## 二进制兼容建议

如果后续要扩展字段，建议遵守这些约定：

- 只新增字段，不重命名已有字段
- 保持 `schema_version` 单调递增
- 老字段语义不要漂移
- `download.type` 新增枚举值时，旧客户端应按“不支持”处理
- 前端和客户端都要忽略未知字段
