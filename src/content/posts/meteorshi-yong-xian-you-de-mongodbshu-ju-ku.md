---
title: "Meteor使用现有的mongodb数据库"
date: "2015-05-01"
description: "meteor使用环境变量MONGO_URL确定mongodb的位置。如果已经存在一个监听在27017端口上的mongdb，则可以使用下边的一句话使用现有的mongodb。 将其中的your_db替换成你要使用的数据库。每次重开一个终端或主机重启的时候，环境变量会还原，需要重新导入。"
slug: "meteorshi-yong-xian-you-de-mongodbshu-ju-ku"
tags: ["Web","数据库"]
---

meteor使用环境变量MONGO\_URL确定mongodb的位置。如果已经存在一个监听在27017端口上的mongdb，则可以使用下边的一句话使用现有的mongodb。  

```routeros
export MONGO_URL=mongodb://localhost:27017/your_db
```

将其中的your\_db替换成你要使用的数据库。每次重开一个终端或主机重启的时候，环境变量会还原，需要重新导入。
