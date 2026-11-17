# 二哈博客

Astro 静态博客，正式地址计划使用 https://erossr.com。

## Cloudflare Workers 发布

源码仓库：https://github.com/Stewie055/pages
在 Cloudflare 的 Workers & Pages 中创建 Worker，连接此仓库，生产分支选择 `main`。

- Worker 名称：`erossr-blog`，与 `wrangler.jsonc` 保持一致。
- 构建命令：`npm run build`。
- 部署命令：`npm run deploy`。
- Node.js：24，可设置构建环境变量 `NODE_VERSION=24`。
- 先使用分配的 `workers.dev` 地址，由用户检查页面、搜索和旧链接重定向。
- 用户确认后，在 Worker 的 Domains & Routes 中添加 `erossr.com`；`www` 跳转通过 Cloudflare Redirect Rules 配置。

Workers Static Assets 托管 `dist` 内的静态文件，不需要服务端渲染适配器。
构建与部署由 Cloudflare 完成，平时只需提交 Markdown 到 GitHub。
当前已准备发布配置；Cloudflare 连接、部署与域名绑定需在控制台完成。

## 在个人 PC 编辑和预览

安装 Node.js 24 和 Git（也可以使用 GitHub Desktop）：

```bash
git clone https://github.com/Stewie055/pages.git
cd pages
npm ci
npm run dev
```

打开 http://localhost:4321，可边编辑边查看。文章位于 `src/content/posts/`，图片可以放入 `public/images/` 并使用 `/images/文件名` 引用。
检查完整站点与搜索时执行：

```bash
npm run build
npm run preview
```

构建生成 Pagefind 索引，因此搜索需要使用构建后的预览。
编辑完成后提交并推送到 GitHub，Cloudflare 自动构建部署。
以上流程不依赖最初准备项目的服务器；日常编辑和预览在个人 PC 完成。

```bash
git add .
git commit -m "更新文章"
git push origin main
```

## 用户验证

- 首页文章列表、归档和标签：22 篇文章，原文日期保留。
- 文章页：检查代码块、图片、目录跳转与相邻文章。
- 搜索：输入 Linux、core、Vim 等关键词。
- 手机宽度：检查导航、文章和代码块是否方便阅读。
- 深浅主题：切换后刷新，检查主题是否保留。
- RSS：访问 `/rss.xml`。

6 张外部图片目前无法下载，保留原地址，并显示失败提示。本地 12 个图片资源已迁移。
Cloudflare 的 `_redirects` 规则需要部署后验证，本地预览不会应用这些规则。
标题锚点转换已调整，尚未重新构建或验证；可在云端发布后检查。

## 写文章

在 `src/content/posts/` 添加 Markdown，头部示例：

```yaml
---
title: "文章标题"
date: "2026-11-17"
description: "文章摘要"
slug: "new-post"
tags: ["Linux"]
draft: false
---
```

## 域名切换

本机旧配置的 `/ssh/` 需要在切换域名前迁移到独立子域名。
`wrangler.jsonc` 暂不声明正式域名，避免初次部署直接切换现有站点。

已迁移的 Markdown 与本地图片包含在项目中，正常编辑、构建不依赖旧网站副本。
最初恢复的旧网站在准备机器的 `../recovered-blogs/Aaron1992.github.io`。
`npm run migrate` 与 `npm run verify` 是迁移阶段使用的工具，依赖该副本，个人 PC 日常使用不需要运行。
`docs/migration.json` 记录迁移文章、资源和重定向；`docs/external-images.json` 记录外部图片下载结果。
迁移脚本及 `npm run verify` 需要原始副本，日常编辑无需运行它们。
