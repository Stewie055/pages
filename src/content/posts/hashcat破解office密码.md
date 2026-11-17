---
title: "hashcat破解office(97-03,2007,2010,2013)密码"
date: "2015-09-13"
updated: "2015-09-14"
description: "hashcat是一款免费的密码破解工具。它支持使用AMD和NVidia显卡运算，同时也保留使用cpu计算的版本。hashcat号称是世界上最快的密码破解工具，同时也是世界上第一款和唯一一款使用通用图形处理器的工具。它支持windows和linux操作系统，同时支持OpenCL和CUDA。hashca"
slug: "hashcat破解office密码"
tags: ["安全","工具"]
---

<a id="hashcat-是什么"></a>

#### hashcat 是什么

hashcat是一款免费的密码破解工具。它支持使用AMD和NVidia显卡运算，同时也保留使用cpu计算的版本。hashcat号称是世界上最快的密码破解工具，同时也是世界上第一款和唯一一款使用通用图形处理器的工具。它支持windows和linux操作系统，同时支持OpenCL和CUDA。hashcat可以支持破解包括MD5,sha1等150多种加密算法生成的密码。具体特性和支持的加密算法见[http://hashcat.net/oclhashcat/。](http://hashcat.net/oclhashcat/。)

使用hashcat破解office密码的时候需要指定加密方式，Office 03 - 2013一共有9种hash方式，分别如下

```less
Office 97-03(MD5+RC4,oldoffice$0,oldoffice$1): flag -m 9700
Office 97-03(MD5+RC4,collider-mode#1): flag -m 9710
Office 97-03(MD5+RC4,collider-mode#2): flag -m 9720
Office 97-03(SHA1+RC4,oldoffice$3,oldoffice$4): flag -m 9800
Office 97-03(SHA1+RC4,collider-mode#1): flag -m 9810
Office 97-03(SHA1+RC4,collider-mode#2): flag -m 9820
Office 2007: flag -m 9400
Office 2010: flag -m 9500
Office 2013: flag -m 9600
```

本文将介绍如何使用hashcat破解office密码。现在我有一个密码加密的xls文件test.xls，我将在windows平台使用hashcat破解它的密码。

<a id="获取文件hash值"></a>

#### 获取文件hash值

首先，我们需要获取文件的hash值，使用[office2john.py](https://github.com/kholia/RC4-40-brute-office/blob/master/office2john.py)可以提取文件的hash值。  
运行这个脚本首先需要安装python2.7环境。

在命令行中执行

```shell
$ python office2john.py test.xls
```

我们这里的例子得到的hash结果为：

```dns
test.xls:$oldoffice$0*2031e09b28a2a13a891dff99bae0927d*65264ab10fdde25b221
46e2c94778c50*981ec9419aa5dd88c0340491ed07f38c:::936 111 730895 936 111
12798626794 12798538993 12932656957 Microsoft Excel 1::test.xls
```

第一个`:`号前边是文件名，紧跟着的是加密方式，这里是`oldoffice$0`。然后在hashcat官网的  
[wiki](http://hashcat.net/wiki/doku.php?id=oclhashcat#options)页面的options中  
Generic hash types 找到对应的代号，这里`oldoffice$0`的代号是9700。我们用hashcat只需要第一个冒号和第二个冒号之间的内容。  
这里是

```routeros
$oldoffice$0*2031e09b28a2a13a891dff99bae0927d*65264ab10fdde25b22146e2c94778c50*981ec9419aa5dd88c0340491ed07f38c
```

将得到的hash值保存到文本文件中，这里保存到hash.txt里。

<a id="使用hashcat破解"></a>

#### 使用hashcat破解

hashcat可以使用字典或者掩码对密码进行攻击。一开始我使用掩码，但是使用较短位数密码时它不断警告字典空间过小，无法发挥GPU的并行运算能力。所以我这里使用了字典。  
因为这个文件是我同学交给我让我帮忙找回密码的，我猜测密码可能是纯数字的，并且有可能在8位以下。我首先生成了一个4到8位数字密码的字典。

在hashacat目录下打开命令行，输入下面的命令开始破解。  

```stylus
cudaHashcat64.exe -a 0 -m 9700 -o found.txt hash.txt F:\wordlist\wordlist
```

-   cudaHashcat64.exe 是在英伟达显卡电脑上要运行的版本。
-   \-a 参数指定攻击方式,这里的 0 表示使用字典攻击。
-   \-m 参数指定密码加密方式，这里使用我们查到的9700，代表我们的excel2003加密。
-   \-o 指定结果输出的位置，这里指定输出到found.txt。接下来hash.txt是保存hash值的文件名，`F:\wordlist\wordlist`是字典的位置和文件名。

程序开始运行后按s可以查看破解状态,按p暂停，按r继续，按q退出。

```routeros

[s]tatus [p]ause [r]esume [b]ypass [q]uit =>

Session.Name...: cudaHashcat
Status.........: Running
Input.Mode.....: File (F:\wordlist\wordlist)
Hash.Target....: $oldoffice$0*2031e09b28a2a13a891dff99bae0...
Hash.Type......: MS Office <= 2003 MD5 + RC4, oldoffice$0, oldoffice$1
Time.Started...: Mon Sep 14 00:18:38 2015 (1 sec)
Time.Estimated.: Mon Sep 14 00:20:50 2015 (2 mins, 10 secs)
Speed.GPU.#1...:   910.1 kH/s
Recovered......: 0/1 (0.00%) Digests, 0/1 (0.00%) Salts
Progress.......: 1401856/111110000 (1.26%)
Rejected.......: 0/1401856 (0.00%)
Restore.Point..: 1401856/111110000 (1.26%)
HWMon.GPU.#1...: 65% Util, 54c Temp, N/A Fan
```

在经过35秒的计算后，文件的密码被算出。屏幕上输出状态，程序结束运行。结果将输出到found.txt中。

```routeros
Session.Name...: cudaHashcat
Status.........: Cracked
Input.Mode.....: File (F:\wordlist\wordlist)
Hash.Target....: $oldoffice$0*2031e09b28a2a13a891dff99bae0...
Hash.Type......: MS Office <= 2003 MD5 + RC4, oldoffice$0, oldoffice$1
Time.Started...: Mon Sep 14 00:18:38 2015 (35 secs)
Speed.GPU.#1...:   887.4 kH/s
Recovered......: 1/1 (100.00%) Digests, 1/1 (100.00%) Salts
Progress.......: 30941184/111110000 (27.85%)
Rejected.......: 0/30941184 (0.00%)
Restore.Point..: 30940160/111110000 (27.85%)
HWMon.GPU.#1...: 27% Util, 58c Temp, N/A Fan
```

打开found.txt，其中内容如下。  

```routeros
$oldoffice$0*2031e09b28a2a13a891dff99bae0927d*65264ab10fdde25b22146e2c94778c50*981ec9419aa5dd88c0340491ed07f38c:19830312
```

冒号后边就是破解的密码19830312。至此，这个密码加密的excel的密码就被破解了。

这里使用的excel文件是office2003版本，相对与office2007以后的版本加密算法要弱。所以hashcat运算速度也相对较快。我在使用word2013文件进行测试的时候，hashcat破解速度极慢。  
而且这个文件的密码是8位纯数字，字典空间较小，所以才能很快的破解出来。
