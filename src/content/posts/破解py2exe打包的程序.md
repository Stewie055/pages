---
title: "破解py2exe打包的程序"
date: "2015-12-31"
description: "py2exe是一个将python脚本转换成windows上的可独立执行的可执行程序(*.exe)的工具，这样，你就可以不用装python而在windows系统上运行这个可执行程序。然而如果不对代码做任何混淆，仅使用Py2exe将程序打包的程序容易被破解。本文讲解破解Py2exe打包的程序的过程。 P"
slug: "破解py2exe打包的程序"
tags: ["Python","逆向分析"]
---

py2exe是一个将python脚本转换成windows上的可独立执行的可执行程序(\*.exe)的工具，这样，你就可以不用装python而在windows系统上运行这个可执行程序。然而如果不对代码做任何混淆，仅使用Py2exe将程序打包的程序容易被破解。本文讲解破解Py2exe打包的程序的过程。

<a id="Py2exe打包的程序的结构"></a>

### Py2exe打包的程序的结构

Py2exe打包的exe程序有三部分组成，分别是PYTHONxx.dll(xx是版本号，比如27), PYTHONSCRIPT, library.zip。PYTHON27.dll应该就是python的运行环境了。PYTHONSCRIPT是程序开始执行的入口，就想main函数。libarary.zip中是程序用到的库文件，包括自带的库和用户自己写的库文件。 破解程序的时候需要处理的文件就是PYTHONSCRIPT和library.zip。

如果直接使用winrar解压缩exe的pe文件，只能得到library.zip中的文件，如果想要得到全部的文件，需要对处理pe文件。幸运的是，现在已经有程序可以做这个工作： py2exe binary editor。 使用Py2exe Bynary Editor(以下简称pbe) 可以简单的将Py2exe打包的程序dump成原来的三个文件，也可以将修改后的文件再打包回去。使用界面如图。

<a id="逆向library-zip中的文件"></a>

### 逆向library.zip中的文件

解压缩library.zip中的文件，可以看到有很多的pyo文件。这是python脚本优化过的字节码。不能直接阅读，需要先反编译成py文件。反编译python字节码的工具有很多，我这里使用uncompyle2，uncompile2可以反编译python2.5 到 2.7的文件，如果你需要反编译其他版本的文件，需要使用其他工具。使用uncompule2 可以很简单的将pyo文件反编译成原来的文件。从效果上看，几乎与看源代码无异。这里将不再对uncompyle2的安装和使用进行介绍。具体操作可以看官方文档，或者我下次更新文章时会写出来。

将pyo文件反编译后，找到需要修改的代码，在文件中修改。然后再使用如下命令将修改后的py文件编译成pyo文件：  

```vim
python -O -m py_compile filename.py
```

然后用修改后的pyo文件替换library.zip中的文件的源文件。最后，使用pbe仍打开pe文件，最好勾选update options下的Backup Original. 然后点击下边的library，在弹出的窗口中选择更新后的library.zip。然后pbe就会使用更改后的library更新原来的pe文件，而原文件的备份保存为后缀为bak的文件。

<a id="逆向PYTHONSCRIPT文件"></a>

### 逆向PYTHONSCRIPT文件

PYTHONSCRIPT文件处理起来相对更麻烦一些。通过阅读py2exe的源码可以了解到该文件的结构, 下边截取了build\_exe.py文件里的一部分代码。不关心内容的可以直接跳到逆向的处理过程。  

```python
 # We create a list of code objects, and write it as a marshaled
 # stream.  The framework code then just exec's these in order.
 # First is our common boot script.
 boot = self.get_boot_script("common")
 boot_code = compile(file(boot, "U").read(),
                     os.path.abspath(boot), "exec")
 code_objects = [boot_code]
 if self.bundle_files < 3:
     code_objects.append(
         compile("import zipextimporter; zipextimporter.install()",
                 "<install zipextimporter>", "exec"))
 for var_name, var_val in vars.items():
     code_objects.append(
             compile("%s=%r\n" % (var_name, var_val), var_name, "exec")
     )
 if self.custom_boot_script:
     code_object = compile(file(self.custom_boot_script, "U").read() + "\n",
                           os.path.abspath(self.custom_boot_script), "exec")
     code_objects.append(code_object)
 if script:
     code_object = compile(open(script, "U").read() + "\n",
                           os.path.basename(script), "exec")
     code_objects.append(code_object)
 code_bytes = marshal.dumps(code_objects)
 if self.distribution.zipfile is None:
     relative_arcname = ""
 si = struct.pack("iiii",
                  0x78563412, # a magic value,
                  self.optimize,
                  self.unbuffered,
                  len(code_bytes),
                  ) + relative_arcname + "\000"
script_bytes = si + code_bytes + '\000\000'
self.announce("add script resource, %d bytes" % len(script_bytes))
```

倒数第二行的script\_bytes就是最后写入PYTHONSCRIPT文件中的内容。code\_bytes是个marshal处理过的list, list中有我们关心的代码。si是一个4个整形大小的结构。

<a id="处理过程"></a>

#### 处理过程

首先，使用二进制编辑软件将头部的4个整数si和最后的两个0字节去掉，这里使用winhex的示例如图，将阴影部分的内容删去。

![winhex处理头部](/content/images/2015/12/script1.png)

![winhex处理尾部](/content/images/2015/12/script2.png)

将得到的文件另存为一个新的文件，这样就只剩下了 code\_bytes。

在 Python 中输入：

```ruby
>>>import marshal
>>>mylist=marshal.load(open("dumpfile", "r"))  #目的是为了把 dump 下来的文件加载到内存当中，成为 Python 的一个对象。
```

_注1：加载dump下来的对象，Python 版本一定要和 dump 时候的版本兼容才行。_  
_注2：如果出现`EOFError: EOF read where object expected`错误，更换到linux操作系统可能可以解决。_

```stylus
>>>mylist
[<code object <module> at 0xb7473ad0, file "C:\Python27\lib\site-packages\py2exe\boot_common.py", line 44>, <code object <module> at 0xb7473b18, file "<install zipextimporter>", line 1>, <code object <module> at 0xb7202a88, file "main.py", line 3>]    #包含了 3 个 code object 对象。第一个是 py2exe 初始化用的，第二个是解压 zip 用的，第三个就是我们的关键脚本了。
```

为了反编译主函数的代码，我们将main.py的code object保存到文件中，然后仍然使用umcompyle2反编译。

```ruby
>>>>>> marshal.dump(mylist[2], open("main.pyo","w"))   # 将main函数的内容dump到pyo文件中
```

仅仅将code object dump到文件中还不行，还需要再文件头部添加文件头。用 WinHex 加上 8 个字节的 file header。前 4 个字节代表 Python 版本号，后 4 个字节是 timestamp，可以打开另外一个pyo文件将前 8 个字节复制过去(图中阴影部分)。  
![winhex添加文件头](/content/images/2015/12/script3.png)

然后使用uncompyle2反编译修改后的文件，得到源码。修改过代码之后，按照和本节相反的顺序，打包到源文件中去。  
![反编译代码](/content/images/2015/12/code1.png)

<a id="结语"></a>

### 结语

将py2exe打包的pe程序反编译回python代码后，如果未经混淆，可以看到几乎与源码无异。Python 开发的商业软件，其安全性还值得商榷。抵御攻击的做法是使用第三方库编译成 native code，使用代码混淆器，或者修改 Python 源代码防止被反汇编。

参考资料：

-   [http://bbs.pediy.com/archive/index.php?t-111428.html](http://bbs.pediy.com/archive/index.php?t-111428.html)
-   [https://github.com/wibiti/uncompyle2](https://github.com/wibiti/uncompyle2)
