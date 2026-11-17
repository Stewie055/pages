---
title: "电信服务商屏蔽digitalocean新加坡ip"
date: "2014-11-28"
description: "因为最近在旧金山的digitalocean上的vps访问起来ping值越来越高，平均都在200以上了，所以今天想把droplet转移到新加坡机房。转移过后问题出现了。丢包特别严重平均50%。而且到后来ssh都无法连接成功。 给support提交了ticket，他们让我们traceroute和ping"
slug: "dian-xin-fu-wu-shang-ping-bi-digitaloceanxin-jia-po-ip"
tags: ["网络"]
---

　　因为最近在旧金山的digitalocean上的vps访问起来ping值越来越高，平均都在200以上了，所以今天想把droplet转移到新加坡机房。转移过后问题出现了。丢包特别严重平均50%。而且到后来ssh都无法连接成功。

　　给support提交了ticket，他们让我们traceroute和ping ，把结果给他们看。最后客服给回复后，他Ping我的Ip也是很高的丢包，但是给其他任何地方ping都不会产生如此高的丢包。

　　室友说是GFW的问题。我觉得很认同。

　　晚上的时候，我突然想到换个网络通出口，我平时一直用的是电信出口。我将网络通出口换成了移动出口，这一次，ssh连接成功了。延迟很低。就像在本地一样。但是如果用移动出口，访问国内网站又会效果不好。我这一次换成了教育网出口。显而易见，也是非常的通畅。把shadowsocks本地的配置更改了一下，浏览器代理加了规则list:[http://autoproxy-gfwlist.googlecode.com/svn/trunk/gfwlist.txt。](http://autoproxy-gfwlist.googlecode.com/svn/trunk/gfwlist.txt。) 今天完工。

　　该死的电信防火墙。
