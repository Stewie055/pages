---
title: "create git service with gog"
date: "2018-02-02"
updated: "2018-02-03"
description: "今天发现gog挺好玩的，再加上自己的博客即将从wordpress转为hexo，所以希望有个git仓库保存自己的资源。借此机会，试一下gog的服务。 遇到的第一个难题就是在安装gog时，遇到Error 1071: Specified key was too long; max key length i"
slug: "create-git-service-with-gog"
tags: ["Git","部署"]
---

<a id="使用Gog创建git服务"></a>

## 使用Gog创建git服务

今天发现gog挺好玩的，再加上自己的博客即将从wordpress转为hexo，所以希望有个git仓库保存自己的资源。借此机会，试一下gog的服务。

<a id="升级mariadb到10-2"></a>

### 升级mariadb到10.2

遇到的第一个难题就是在安装gog时，遇到`Error 1071: Specified key was too long; max key length is 767 bytes`。经过查找资料，产生这种错误的原因主要是因为

> Because of mysql 5.6 (includes prior versions) InnoDB max index length is 767 bytes, mysql 5.7.7 is up to 3072 bytes.  
> If some varchar column’s length is 255, when the character format is utf-8 needs 255_3=765 bytes for index length, It’s OK.  
> But, an utf8mb needs 255_4=1020 bytes for index length.  
> 写这篇文章的时候gog暂时还没有修复这个bug,最简单的办法是升级mysql, 在centos上即mariadb.过程如下：
> 
> Once you have your MariaDB.repo entry, add it to a file under /etc/yum.repos.d/. (We suggest something like /etc/yum.repos.d/MariaDB.repo.)

```bash
[mariadb]
name = MariaDB
baseurl = http://yum.mariadb.org/10.2/centos7-amd64
gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
gpgcheck=1
```

之后执行`yum update`以及`yum install mariadb-server`即可。
