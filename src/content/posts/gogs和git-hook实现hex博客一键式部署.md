---
title: "hexo博客一键式部署到服务器"
date: "2018-02-04"
updated: "2018-02-05"
description: "hexo博客部署到服务器可以使用git和rsync方法，本文首先接受git方式。通过hexo d命令将public目录推送到git服务器，并触发部署代码到网站目录。 git服务器可以选择gitlab或者gogs, 本文选择gogs。gogs安装链接 安装完gogs服务器后，配置好git网站git.e"
slug: "gogs和git-hook实现hex博客一键式部署"
tags: ["Git","部署"]
---

hexo博客部署到服务器可以使用git和rsync方法，本文首先接受git方式。通过`hexo d`命令将public目录推送到git服务器，并触发部署代码到网站目录。

<a id="搭建git服务器"></a>

## 搭建git服务器

git服务器可以选择gitlab或者gogs, 本文选择gogs。  
[gogs安装链接](/2018/02/02/create-git-service-with-gog/)

安装完gogs服务器后，配置好git网站git.example.com，并创建博客文件仓库,例如blog\_public。

<a id="设置hexo的git同步方式"></a>

## 设置hexo的git同步方式

在hexo的\_config.yml文件中, 配置如下的git部署信息，其中repo字段可以在gogs网页上创建仓库后的页面找到。配置完以后，在本地运行`hexo d`会将public目录推送到git服务器。

```dts
deploy:
  type: git
  repo: <ssh_name>@git.gitserver:<account>/blog_public.git
  branch: master
  message: update blog
```

<a id="创建服务器git仓库"></a>

## 创建服务器git仓库

为了在服务器上访问blog\_public仓库的文件，还需要在服务器的网站目录添加git本地仓库，用来存储生成的网站文件。这个文件夹同时也是网站的目录，通过配置nginx，完成对该目录的访问。

```bash
mkdir /var/www/blog_public
cd /var/www/blog_public
git init
git clone ~/repos/test.git
```

<a id="使用githook实现自动部署"></a>

## 使用githook实现自动部署

进入到/gogs-repositories//blog\_public.git/hooks文件夹，使用vi post-receive创建一个脚本，当你在本地仓库执行git push后就会触发post-receive（[关于Git Hok](https://git-scm.com/book/zh/v1/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git%E6%8C%82%E9%92%A9)）。  
post-receive的内容

```bash
#!/usr/bin/env bash

unset GIT_DIR
NowPath=`pwd`
#部署路径为网站服务器设置的文件目录
DeployPath="/var/www/blog_public"
cd $DeployPath
git pull origin master
cd $NowPath
exit 0
```

之后在本地使用git deploy命令触发提交后，会自动以上脚本，实现自动部署。
