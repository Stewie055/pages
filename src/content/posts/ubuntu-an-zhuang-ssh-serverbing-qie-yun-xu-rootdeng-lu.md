---
title: "ubuntu 安装ssh-server并且允许root登陆"
date: "2014-11-28"
description: "ubuntu 安装ssh-server并且允许root登陆"
slug: "ubuntu-an-zhuang-ssh-serverbing-qie-yun-xu-rootdeng-lu"
tags: ["Linux","SSH"]
---

1.  **安装ssh-server:**  
    `sudo apt-get install ssh-server`
2.  **允许root账号通过ssh连接**  
    编辑`/etc/ssh/sshd_config`文件，找到`PermitRootLogin without-password`  
    并在下边添加  
    `PermitRootLogin yes`  
    然后  
    `service ssh restart`或`service ssh reload`
