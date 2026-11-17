---
title: "core dump文件分析和调试"
date: "2018-09-25"
description: "当程序运行的过程中异常终止或崩溃，操作系统会将程序当时的内存状态记录下来，保存在一个文件中，这种行为就叫做Core Dump（中文有的翻译成“核心转储”)。我们可以认为 core dump 是“内存快照”，但实际上，除了内存信息之外，还有些关键的程序运行状态也会同时 dump 下来，例如寄存器信息（"
slug: "core-dump文件分析和调试"
tags: ["调试","Linux"]
---

<a id="core介绍"></a>

## core介绍

当程序运行的过程中异常终止或崩溃，操作系统会将程序当时的内存状态记录下来，保存在一个文件中，这种行为就叫做Core Dump（中文有的翻译成“核心转储”)。我们可以认为 core dump 是“内存快照”，但实际上，除了内存信息之外，还有些关键的程序运行状态也会同时 dump 下来，例如寄存器信息（包括程序指针、栈指针等）、内存管理信息、其他处理器和操作系统状态和信息。

<a id="core文件生成"></a>

## core文件生成

<a id="core文件的生成开关和大小限制"></a>

### core文件的生成开关和大小限制

1.  使用ulimit -c命令可查看core文件的生成开关。若结果为0，则表示关闭了此功能，不会生成core文件。
2.  使用ulimit -c命令可查看core文件的生成开关。若结果为0，则表示关闭了此功能，不会生成core文件。
3.  使用ulimit -c filesize命令，可以限制core文件的大小（filesize的单位为kbyte）。若ulimit -c unlimited，则表示core文件的大小不受限制。如果生成的信息超过此大小，将会被裁剪，最终生成一个不完整的core文件。在调试此core文件的时候，gdb会提示错误。

在bash中使用`ulimit -c unlimited`修改core开关，仅对当前shell生效，若希望永久生效，

<a id="core文件生成路径和文件名"></a>

### core文件生成路径和文件名

1.  /proc/sys/kernel/core\_uses\_pid可以控制产生的core文件的文件名中是否添加pid作为扩展，如果添加则文件内容为1，否则为0
    
2.  /proc/sys/kernel/core\_pattern可以设置格式化的core文件保存位置或文件名，比如原来文件内容是core-%e  
    可以这样修改:
    
    ```perl
    echo "/corefile/core-%e-%p-%t" > /proc/sys/kernel/core_pattern
    ```
    

将会控制所产生的core文件会存放到/corefile目录下，产生的文件名为core-命令名-pid-时间戳

如果core\_uses\_pid这个文件的内容被配置成1，那么即使core\_pattern中没有设置%p，最后生成的core dump文件名仍会加上进程ID。

注意linux的内核参数信息都存在内存中，因此可以用过命令直接修改，并直接生效。但是当系统reboot后，之前设置的参数值就会丢失，而系统每次启动时都会去/etc/sysctl.conf文件中读取内核参数。

因此可以将参数写在这个配置文件中，如：

`kernel.core_pattern = %e.core.%p`

并保存退出，执行下面指令使其生效

`sysctl -p`

在我的linux机器中，core\_pattern的配置为`|/usr/lib/systemd/systemd-coredump %P %u %g %s %t %e`， `|`表示使用管道，将core文件重定向给后边的程序处理，这里是交由systemd-coredump程序处理。要获取core文件则应该使用`coredumpctl`命令获取core文件(需要sudo权限)。

这里我使用a.out产生一个core文件。首先使用`sudo coredumpctl list | grep a.out`获取core文件的信息。显示结果如下：  

```crystal
Wed 2018-09-19 17:22:39 CST   54666  1100     0  11 * /polestar_build/home/dev/test/core/a.out
```

从结果中知道PID是54666,可以使用`sudo coredumpctl dump 54666 -o a.dump`,将core文件dump到a.dump中。

<a id="core文件格式"></a>

## core文件格式

core文件是一个标准的ELF格式的文件，使用`readelf`工具可以对core文件的属性进行检查。如下所示，core文件的TYPE显示是`CORE (Core file)`。  

```ocaml
:~/test/core> readelf -h a.dump
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              CORE (Core file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x0
  Start of program headers:          64 (bytes into file)
  Start of section headers:          0 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         36
  Size of section headers:           0 (bytes)
  Number of section headers:         0
  Section header string table index: 0
```

<a id="gdb加载core文件"></a>

## gdb加载core文件

使用gdb加载core文件的命令为`gdb -c core_file_name`，也可以再启动gdb后使用命令`core core_file_name`在gdb中随时加载core文件。

在没有加载可执行程序以前，仅仅可以使用gdb对core文件内的内容进行检视，包括寄存器的值，以及内存分页(mappings)，调用栈内存等信息。所以还需要加载可执行程序，结合执行文件和core文件分析。加载方法是在bash命令行使用`gdb exe_file`,也可以在启动gdb后使用命令`file exe_file`随时加载文件。

有点可执行文件不包含符号表，加载文件后会提示`no debugging symbols found`， 如果有符号文件，可以使用命令”file exe\_file.sym\`读取符号表。

当可执行文件和core文件都加载完成后，就可以对案发现场进行验尸了，

<a id="设置sharedlibrary搜索路径"></a>

## 设置sharedlibrary搜索路径

如果程序需要的动态链接库在对应的路径，则gdb可以搜索加载到so文件。如果需要加载的so放在其他目录，比如，将所有依赖的so放在了.libs目录下，就需要设置链接库搜索路径。可以使用`set sysroot`和`set solib-search-path`这两个命令设置so的搜索路径。**需要注意的是这两个命令必须在加载core文件前使用**。  
下边是一个例子。第二行表示so的搜索路径包括`/lib`,`/usr/lib`和`./`三个目录，gdb会尝试在这三个目录中搜索依赖的so文件。  

```crystal
(gdb) set sysroot /no/such/file
(gdb) set solib-search-path /lib:/usr/lib:./    
(gdb) file Framwork.out                     #加载执行程序
(gdb) core core-1537131595-162728-14957-10  #加载core文件
(gdb) info sharedlibrary                    #查看已经加载的动态链接库
```

> 1.  set sysroot 与 set solib-absolute-prefix 是同一条命令，实际上，set sysroot是set solib-absolute-prefix 的别名。
> 2.  set solib-search-path设置动态库的搜索路径，该命令可设置多个搜索路径，路径之间使用“:”隔开（在linux中为冒号，DOS和Win32中为分号）。
> 3.  set solib-absolute-prefix 与 set solib-search-path 的区别：  
>     总体上来说solib-absolute-prefix设置库的绝对路径前缀，只对绝对路径有效；而solib-search-path设置库的搜索路径，对绝对路径和相对路径均起作用。（编译器自动链接的so库多采用绝对路径）。

<a id="常用命令"></a>

## 常用命令

1.  使用bt命令可以查看程序core文件现场的调用栈。仍然使用前文中的a.out。 栈帧0明显是对空指针函数进行调用，导致内存访问出错。

```shell
:~/test/core> gdb a.out -c a.dump
(gdb) bt
#0  0x0000000000000000 in ?? ()
#1  0x000000000040058f in register_tm_clones ()
#2  0x00000000004005b0 in register_tm_clones ()
#3  0x0000000000000000 in ?? ()
```

2.  `i r`可以查看寄存器，`x`可以查看内存空间，例如`x/20wx $sp`查看栈顶的20个WORD。
    
3.  `info proc mappings`查看内存映射表。
    

其他gdb命令参考gdb手册。

在arm程序中，由于压栈的寄存器不一致的问题，可能会导致gdb回溯调用栈失败,如下所示，此时需要结合汇编代码人工对调用栈进行回溯。参考另一篇文章。  

```gradle
(gdb) bt
#0  0xf72e12a0 in pthread_rwlock_timedwrlock () from /lib/libpthread-2.22.so
Backtrace stopped: previous frame identical to this frame (corrupt stack?)
```

<a id="交叉环境下的core-dump"></a>

## 交叉环境下的core dump

例如在Arm平台上执行的程序发生了core dump, 但是希望在x86平台的linux机器上对core文件进行调试, 则需要使用交叉环境的arm-linux-gdb，而不是x86的gdb。有两个选择：

1.  下载gdb源码，编译target为arm平台的arm-linux-gdb。
2.  下载预编译的arm-linux-gdb。这里提供一个网上的预编译好的gcc工具链[Linaro Releases](https://releases.linaro.org/components/toolchain/binaries/7.3-2018.05/arm-linux-gnueabi/).

<a id="参考链接"></a>

## 参考链接

-   [http://www.cnblogs.com/hazir/p/linxu\_core\_dump.html](http://www.cnblogs.com/hazir/p/linxu_core_dump.html)
-   [https://blog.csdn.net/ispeller/article/details/20232089](https://blog.csdn.net/ispeller/article/details/20232089)
-   [https://stackoverflow.com/questions/33886913/make-gdb-load-a-shared-library-from-a-specific-path](https://stackoverflow.com/questions/33886913/make-gdb-load-a-shared-library-from-a-specific-path)
-   [https://blog.csdn.net/\_xiao/article/details/23289971](https://blog.csdn.net/_xiao/article/details/23289971)
