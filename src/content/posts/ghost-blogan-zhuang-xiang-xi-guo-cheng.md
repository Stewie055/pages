---
title: "ghost blog安装过程"
date: "2014-12-02"
updated: "2014-12-05"
description: "ghost blog是一个用node.js写成的开源博客平台，由前 WordPress UI 部门主管 John O’Nolan 和 WordPress 高级工程师（女） Hannah Wolfe 创立，目的是为了给用户提供一种更加纯粹的内容写作与发布平台。ghost blog现在有从zip压缩包安"
slug: "ghost-blogan-zhuang-xiang-xi-guo-cheng"
tags: ["部署","Web"]
---

ghost blog是一个用node.js写成的开源博客平台，由前 WordPress UI 部门主管 John O’Nolan 和 WordPress 高级工程师（女） Hannah Wolfe 创立，目的是为了给用户提供一种更加纯粹的内容写作与发布平台。ghost blog现在有从zip压缩包安装，git安装和npm安装三种方式。其中从zip压缩包安装是最简单也是最快的的方式，本文主要讨论这种安装方式。

<a id="从zip安装ghost程序"></a>

##### 从zip安装ghost程序

1.  ghost博客运行在node.js上，首先需要安装Node.js。可以从linux的包管理器安装node.js。  
    在ubuntu系统上，首先运行  
    `curl -sL https://deb.nodesource.com/setup | sudo bash -`  
    然后运行  
    `sudo apt-get install -y nodejs`  
    在debian操作系统上（root用户）:
    
    ```
    apt-get install cur
    curl -sL https://deb.nodesource.com/setup | bash -
    ```
    
    其他操作系统的安装方式见[https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
    
2.  **安装ghost博客**。
    
    -   使用下边的方式下载最新的gost  
        `$ curl -L https://ghost.org/zip/ghost-latest.zip -o ghost.zip`
    -   解压缩下载的安装包  
        `$ unzip -uo ghost.zip -d ghost`
    -   在解压缩下载的安装包后，在ghost目录下执行  
        `npm install --production`
    -   使用下边的命令在developement 环境下启动ghost:  
        `npm start`
3.  **配置反向代理服务器（推荐nginx)**
    
    -   建立文件`/etc/nginx/sites-available/ghost.conf`.其中添加如下内容：
        
        ```
        server {
           listen 80;
           server_name example.com;  
           location / {
               proxy_set_header   X-Real-IP $remote_addr;
               proxy_set_header   Host      $http_host;
               proxy_pass         http://127.0.0.1:2368;
                   }
          }
        ```
        
    -   将example.com更改成你的域名
    -   在`/sites-enabled`下创建配置文件的软链接
        
        ```
        $ sudo ln -s /etc/nginx/sites-available/ghost.conf /etc/nginx/sites-enabled/ghost.conf
        ```
        
    -   重新载入nginx文件`service nigix restart`
