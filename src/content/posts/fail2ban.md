---
title: "使用fail2ban阻止暴力破解ssh"
date: "2016-12-12"
updated: "2018-02-04"
description: "今天晚上在博客服务器上进行操作的时候，突然发现登录后提示本次登录前有几十次的失败登录。查看登录Log（/val/log/secure）,发现有大量失败的ssh登录记录。可以判断有人是在尝试暴力破解ssh。以前曾经使用过fail2ban，这次决定用fail2ban来禁止对方登录。以下是在centos7"
slug: "fail2ban"
tags: ["Linux","安全"]
---

今天晚上在博客服务器上进行操作的时候，突然发现登录后提示本次登录前有几十次的失败登录。查看登录Log（/val/log/secure）,发现有大量失败的ssh登录记录。可以判断有人是在尝试暴力破解ssh。以前曾经使用过fail2ban，这次决定用fail2ban来禁止对方登录。以下是在centos7上的操作。记录下来，以便以后查阅。

<a id="第一步-安装fail2ban"></a>

## 第一步 安装fail2ban

我所用的centos版本默认安装了软件源epel，如果没有安装，则需要先添加软件源。  
`sudo yum install epel-releas`

然后安装fail2ban,并设置开机启动

`sudo yum install fail2ban`

`sudo systemctl enable fail2ban`

<a id="第二步-配置Fail2ban"></a>

## 第二步 配置Fail2ban

Fail2ban的默认屏蔽设置位于/etc/fail2ban/jail.conf,不要编辑这个文件，因为每次软件更新，新的文件会覆盖你所做的修改。所以这里需要在相同目录创建jail.local文件，将需要的配置写入本地文件，本地文件会覆盖jail.conf。

下边是一个简单的jail.local文件实例。（一开始我没有添加那行enable = true, 导致fail2ban一直不起作用。）

```bash
[DEFAULT]
# Ban hosts for one hour:
bantime = 3600

# Override /etc/fail2ban/jail.d/00-firewalld.conf:
banaction = iptables-multiport

[sshd]
enabled = true
```

这里的bantime可以设置为-1，表示永久封禁。  
修改完jail.local后就可以重启fail2ban。

`sudo systemctl restart fail2ban`  
配置完成后就可以使用fail2ban-client查看状态。

`sudo fail2ban-client status`  
![jail](/content/images/2016/sp161212_232935.png)

上图只是显示现在是jail数量和名称，要想查看具体封禁的ip，还需要指定jail名。这是我在使用fail2ban后封禁的恶意ip地址。

\`sudo fail2ban-client status sshd  
![sshd](/content/images/2016/sp161212_233044.png)

Explore Available Settings  
The version of jail.local we defined above is a good start, but you may want to adjust a number of other settings. Open jail.conf, and we’ll examine some of the defaults. If you decide to change any of these values, remember that they should be copied to the appropriate section of jail.local and adjusted there, rather than modified in-place.

`sudo nano /etc/fail2ban/jail.conf`  
Default Settings for All Jails  
First, scroll through the \[DEFAULT\] section.

ignoreip = 127.0.0.1/8  
You can adjust the source addresses that Fail2ban ignores by adding a value to the ignoreip parameter. Currently, it is configured not to ban any traffic coming from the local machine. You can include additional addresses to ignore by appending them to the end of the parameter, separated by a space.

bantime = 600  
The bantime parameter sets the length of time that a client will be banned when they have failed to authenticate correctly. This is measured in seconds. By default, this is set to 600 seconds, or 10 minutes.

findtime = 600  
maxretry = 3  
The next two parameters that you want to pay attention to are findtime and maxretry. These work together to establish the conditions under which a client should be banned.

The maxretry variable sets the number of tries a client has to authenticate within a window of time defined by findtime, before being banned. With the default settings, Fail2ban will ban a client that unsuccessfully attempts to log in 3 times within a 10 minute window.

destemail = root@localhost  
sendername = Fail2Ban  
mta = sendmail  
If you wish to configure email alerts, you may need to override the destemail, sendername, and mtasettings. The destemail parameter sets the email address that should receive ban messages. The sendername sets the value of the “From” field in the email. The mta parameter configures what mail service will be used to send mail.

action = $(action\_)s  
This parameter configures the action that Fail2ban takes when it wants to institute a ban. The value action\_ is defined in the file shortly before this parameter. The default action is to simply configure the firewall to reject traffic from the offending host until the ban time elapses.

If you would like to configure email alerts, you can override this value from action\_ to action\_mw. If you want the email to include the relevant log lines, you can change it to action\_mwl. You’ll want to make sure you have the appropriate mail settings configured if you choose to use mail alerts.

Settings for Individual Jails  
After \[DEFAULT\], we’ll encounter sections configuring individual jails for different services. These will typically include a port to be banned and a logpath to monitor for malicious access attempts. For example, the SSH jail we already enabled in jail.local has the following settings:

/etc/fail2ban/jail.local  
\[sshd\]

port = ssh  
logpath = %(sshd\_log)s  
In this case, ssh is a pre-defined variable for the standard SSH port, and %(sshd\_log)s uses a value defined elsewhere in Fail2ban’s standard configuration (this helps keep jail.conf portable between different operating systems).

Another setting you may encounter is the filter that will be used to decide whether a line in a log indicates a failed authentication.

The filter value is actually a reference to a file located in the /etc/fail2ban/filter.d directory, with its .conf extension removed. This file contains the regular expressions that determine whether a line in the log is bad. We won’t be covering this file in-depth in this guide, because it is fairly complex and the predefined settings match appropriate lines well.

However, you can see what kind of filters are available by looking into that directory:

ls /etc/fail2ban/filter.d  
If you see a file that looks to be related to a service you are using, you should open it with a text editor. Most of the files are fairly well commented and you should be able to tell what type of condition the script was designed to guard against. Most of these filters have appropriate (disabled) sections in jail.conf that we can enable in jail.local if desired.

For instance, pretend that we are serving a website using Nginx and realize that a password-protected portion of our site is getting slammed with login attempts. We can tell Fail2ban to use the nginx-http-auth.conf file to check for this condition within the /var/log/nginx/error.log file.

This is actually already set up in a section called \[nginx-http-auth\] in our /etc/fail2ban/jail.conf file. We would just need to add an enabled parameter for the nginx-http-auth jail to jail.local:

```bash
/etc/fail2ban/jail.local
[DEFAULT]
# Ban hosts for one hour:
bantime = 3600

# Override /etc/fail2ban/jail.d/00-firewalld.conf:
banaction = iptables-multiport

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

And restart the fail2ban service:

sudo systemctl restart fail2ban  
Monitor Fail2ban Logs and Firewall Configuration  
It’s important to know that a service like Fail2ban is working as-intended. Start by using systemctl to check the status of the service:

sudo systemctl status fail2ban  
If something seems amiss here, you can troubleshoot by checking logs for the fail2ban unit since the last boot:

sudo journalctl -b -u fail2ban  
Next, use fail2ban-client to query the overall status of fail2ban-server, or any individual jail:

sudo fail2ban-client status  
sudo fail2ban-client status jail\_name  
Follow Fail2ban’s log for a record of recent actions (press Ctrl-C to exit):

sudo tail -F /var/log/fail2ban.log  
List the current rules configured for iptables:

sudo iptables -L  
Show iptables rules in a format that reflects the commands necessary to enable each rule:

sudo iptables -S
