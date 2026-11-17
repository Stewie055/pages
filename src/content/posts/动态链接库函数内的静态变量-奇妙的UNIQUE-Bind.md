---
title: "动态链接库函数内的静态变量,奇妙的UNIQUE Bind"
date: "2018-09-28"
updated: "2018-09-29"
description: "模板函数和内敛函数中的静态变量，在跨so中的表现，和定义在其他函数中的静态变量的表现稍微有所不同。使用不慎，会造成预期之外的结果。本文对该现象进行了探讨。 最近遇到一个使用多个共享动态库时，由于静态变量导致的逻辑问题。考虑如下一个问题，主模块要打开A.so和B.so两个动态库，两个动态库的代码使用到"
slug: "动态链接库函数内的静态变量-奇妙的UNIQUE-Bind"
tags: ["C/C++","Linux"]
---

<a id="介绍"></a>

## 介绍

模板函数和内敛函数中的静态变量，在跨so中的表现，和定义在其他函数中的静态变量的表现稍微有所不同。使用不慎，会造成预期之外的结果。本文对该现象进行了探讨。

<a id="多共享动态库的静态变量问题"></a>

## 多共享动态库的静态变量问题

最近遇到一个使用多个共享动态库时，由于静态变量导致的逻辑问题。考虑如下一个问题，主模块要打开A.so和B.so两个动态库，两个动态库的代码使用到了同一个模板函数，而该模板函数有一个静态变量。那么，当两个动态库都加载到内存时，这两个函数间会产生联系吗？

头文件和so的示例代码如下：  

```cpp
//so_test.h

#include <stdio.h>

template<typename T> void print_msg(T) {
    static int num = 0;
    num++;

    printf("msg form , num = %d, \n", num );
    printf("-----------------------\n");
}

#define EXPORT_DYN_SYM __attribute__ ((visibility ("default")))

extern "C" {
EXPORT_DYN_SYM  void test_a();

EXPORT_DYN_SYM void test_b();

EXPORT_DYN_SYM void test_c();
}

//A.so
#include "so_test.h"

void test_a()
{
    printf("this is in test_a...\n");
    print_msg();
}

//B.so
#include "so_test.h"

void test_b()
{
    printf("this is in test_b...\n");
    print_msg();
}
```

加载模块的代码如下,动态加载两个so，并调用两个函数，RTLD\_LOCAL属性表示调用函数时应该尽量在本地so寻找符号。

```cpp
#include "so_test.h"
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>

#define LIB_A_PATH "./liba.so"
#define LIB_B_PATH "./libb.so"

typedef void (*DYN_FUNC)();

int main()
{
    //test_a();
    //test_b();
    void *handle,* handle2;
    char *error;
    DYN_FUNC func_a = NULL;
    DYN_FUNC func_b = NULL;

    //打开动态链接库
    handle = dlopen(LIB_A_PATH, RTLD_LAZY |RTLD_LOCAL); //错误处理过程已省略
    handle2 = dlopen(LIB_B_PATH, RTLD_LAZY | RTLD_LOCAL);//错误处理过程已省略

    func_a = (DYN_FUNC)dlsym(handle, "test_a" );//错误处理过程已省略
    func_b = (DYN_FUNC)dlsym(handle2, "test_b");//错误处理过程已省略

    func_b();
    func_a();

    return 0;
}
```

使用如下的命令编译该代码：  

```stylus
g++ -fPIC -shared -g  -o liba.so so_a.c
g++ -fPIC -shared -g  -o libb.so so_b.c
g++ -o test test.c -g  -ldl
```

程序执行后结果如下：  

```asciidoc
this is in test_b...
msg , num = 1,
-----------------------
this is in test_a...
msg , num = 2,
-----------------------
```

从程序执行结果看，这两个so中的同名函数产生了联系，这种联系是怎么产生的呢？是因为调用了同一个print\_msg函数，还是因为使用了相同的静态变量呢？

<a id="模板函数中的静态变量分析"></a>

## 模板函数中的静态变量分析

在第一节中，发现不同so中实例化的同名模板函数之间产生了联系。  
在往下分析之前，首先要了解两个事实:

1.  这个模板函数在a.so和b.so分别实例化了一份代码，可以通过`readelf -sW liba.so`看到两个的函数各自的符号。
2.  如果不适用模板，而是将`print_msg`分别在a.c和b.c中各定义一份，此时编译生成so之后，执行结果的两个函数间是没有联系的，也就是打印结果是两个`num=1`。该测试这里不再详细描述。

那么为什么两个不同的函数中的num++会互相影响呢？

1.  是因为plt调用了同一个print\_msg函数吗？
2.  还是因为两个print\_msg函数使用了同一个静态变量。

首先看问题1， 是不是因为plt调用了同一个print\_msg函数。可以在gdb中下断点观察函数的地址，也可以在代码中添加print打印函数的地址。  
在代码中打印print\_msg函数的代码如下，将这两行代码分别添加到test\_a和test\_b函数中。  

```lisp
void (*p)(int) = print_msg<int>;
printf("print_msg is %p\n", p);
```

同时，在so\_test.h的print\_msg函数中打印静态变量的地址。  

```maxima
printf("msg ,num addess %p, num = %d, \n", &num, num );
```

更改之后，编译，执行，结果如下  

```asciidoc
print_msg is 0x7f42a8d94902
this is in test_b...
msg ,num addess 0x7f42a919704c, num = 1,
-----------------------
print_msg is 0x7f42a8f96812
this is in test_a...
msg ,num addess 0x7f42a919704c, num = 2,
-----------------------
```

从结果看，a.so和b.so之间的调用的print\_msg是不同的地址，这两个print\_msg是不同的函数，但是静态变量num的地址是相同的。这是不寻常的。

> 不熟悉的人可能会认为同名函数的静态变量本来应该是一个。实际上，如果没有使用模板函数的模板化，而是各自定义相同代码的print\_msg，甚至加载相同的so，两个so间同名函数使用的同名静态变量，也是不同的。可以将上文的print\_msg从模板函数改为本地函数得到验证.

> 在上文中的main函数里，使用了dlopen和dlsym来动态加载函数，而没有在编译是用`-L./ -la -lb`选项链接a.so和b.so，并直接调用test\_a和test\_b，是因为如果在编译时就指定了链接的话，print\_msg将从plt表中获取，此时test\_a和test\_b将调用的是同一个print\_msg函数。

首先，我们知道对于加了选项 -fpic或 -fPIC的共享库，全局变量的地址都存放在该共享库的全局偏移表（Global Offset Table，GOT）中，那么这个静态变量是不是这样呢，使用objdump或者 readelf命令分析共享库a.so结果如下。\_ZZ9print\_msgIiEvT\_E3num就是我们模板函数中的静态变变量(c++ name mangling后的符号名)，现在在GOT表中。  

```lsl
$objdump -x -R libb.so | grep num
0000000000201060 l     O .bss   0000000000000004              _ZZ11local_printvE3num
0000000000201068 u     O .bss   0000000000000004              _ZZ9print_msgIiEvT_E3num
0000000000200fd8 R_X86_64_GLOB_DAT  _ZZ9print_msgIiEvT_E3num@@Base
```

这就解释我们的问题了吗？不，虽然\_ZZ9print\_msgIiEvT\_E3num在GOT表中，但是这并不能解释为什么模板函数和普通函数的静态变量表现不同。即使我们在两个so中定义了同名的全局变量，全局变量也一样出现在GOT表中，但是这两个全局变量仍然会指向两个不同的地址。不同的so间同名全局变量不会相互干扰。

接下来，使用readelf工具查看这个静态变量到底有什么不同之处。  

```routeros
$readelf -sW liba.so
   Num:    Value          Size Type    Bind   Vis      Ndx Name
   ....
   10: 0000000000201054     4 OBJECT  UNIQUE DEFAULT   23 _ZZ9print_msgIiEvT_E3num
   60: 0000000000201054     4 OBJECT  UNIQUE DEFAULT   23 _ZZ9print_msgIiEvT_E3num
```

从结果看，\_ZZ9print\_msgIiEvT\_E3num就是我们要找的静态变量。这两行的结果分别是’.dynsym’节区和’.symtab’节区的内容。如果对ELF文件的格式熟悉的话，会注意到，常见的函数Bind Type一般是LOCAL、GLOBAL或者WEAK。_就算是全局变量，Bind类型也是GLOBAL_。这里出现了UNIQUE，`UNIQUE`是什么,它又表示什么意思？

<a id="STB-GNU-UNIQUE的Bind属性"></a>

## STB\_GNU\_UNIQUE的Bind属性

上一节中最后提到的UNIQUE属性全名是`STB_GNU_UNIQUE`。该属性表示了符号在动态链接过程中的一种类型，它的工作模式并不是很直观。这里找到了一份dllookup的[代码](https://sourceware.org/git/?p=glibc.git;a=blob;f=elf/dl-lookup.c;h=a2a699b48f5f188da2528ed163b7befffed586ee;hb=HEAD#l445)。在处理`STB_GNU_UNIQUE`时的注释如下：  

```basic
307             case STB_GNU_UNIQUE:;
308               /* We have to determine whether we already found a
309                  symbol with this name before.  If not then we have to
310                  add it to the search table.  If we already found a
311                  definition we have to use it.  */
```

大致意思是说，在处理该属性的符号时，会先查找搜索表内容，如果搜索表中已经存在该符号，则使用已经存在的符号，否则将其加入搜索表。

到这里，已经大致能够猜到，`STB_GNU_UNIQUE`属性的符号，在链接时只会有一份，即使这些符号分布在不同的so之间。就算由于模板函数中的静态变量是`STB_GNU_UNIQUE`属性，导致改模板函数即使在不同的so中各实例化了一份代码，也要使用同一个静态变量。

而且，通过在谷歌搜索`STB_GNU_UNIQUE`，发现`STB_GNU_UNIQUE`还有导致一个其他的更为常见的问题：无法使用dlclose卸载含有`STB_GNU_UNIQUE`变量的动态库。

在StackOverFlow有这么一个问题[dlclose() doesn’t work with factory function & complex static in function?](https://stackoverflow.com/questions/11050693/dlclose-doesnt-work-with-factory-function-complex-static-in-function)。其中一个回答的内容是

> What’s happening is that there is a STB\_GNU\_UNIQUE symbol in libempty.so:
> 
> readelf -Ws libempty.so | grep \_ZGVZN3Foo4initEvE2ns  
> 
> ```routeros
> 91: 0000000000203e80     8 OBJECT  UNIQUE DEFAULT   25 _ZGVZN3Foo4initEvE2ns
> 77: 0000000000203e80     8 OBJECT  UNIQUE DEFAULT   25 _ZGVZN3Foo4initEvE2ns
> ```

> The problem is that STB\_GNU\_UNIQUE symbols work quite un-intuitively, and persist across dlopen/dlclose calls.
> 
> The use of that symbol forces glibc to mark your library as non-unloadable here.
> 
> There are other surprises with GNU\_UNIQUE symbols as well. If you use sufficiently recent gold linker, you can disable the GNU\_UNIQUE with –no-gnu-unique flag.

可以知道，`STB_GNU_UNIQUE`将会强制标记动态库为不可使用dlcose卸载。如果不希望生成该类型的符号，则需要在编译时使用`--no-gnu-unique`选项。

<a id="inline函数的静态符号"></a>

## inline函数的静态符号

除了第一个节使用的模板函数外，在inline函数中使用静态符号，也会生成UNIQUE类型的变量符号。  
使用如下的代码  

```cpp
inline int goo() {
     static int xyz;
     return xyz++;
 }
void test_b()
 {
     print_msg<int>(1);
     goo();
 }
```

`g++ -fPIC -shared -g -o liba.so so_a.c`编译生成so文件后，使用readelf查看xyz变量的属性。  

```routeros
$readelf -sW libb.so | grep xyz
    13: 0000000000201064     4 OBJECT  UNIQUE DEFAULT   23 _ZZ3goovE3xyz
    67: 0000000000201064     4 OBJECT  UNIQUE DEFAULT   23 _ZZ3goovE3xyz
```

可以看到，xyz对应的符号\_ZZ3goovE3xyz属性也是UNIQUE。根据上一节的分析，不同so之间使用该inline函数，也会使用同一个静态变量符号。而且，使用了这个inline函数后，也会导致编译生成的动态库不可卸载。

<a id="避开UNIQUE"></a>

## 避开UNIQUE

有的时候，我们不希望不同so之间的同名函数互相影响，或者希望能够动态加载和卸载动态库，但又不得不让该变量继续是static。除了上文中提到过的`--no-gnu-unique`编译选项，还有什么办法可以避开`STB_GNU_UNIQUE`属性呢？

有一个方法是使用static。不是说static变量导致了该属性吗？怎么还要使用static。这一次的static使用在函数前，而不是变量前。例如上一节的内敛函数，可以使用static声明。  

```cpp
static inline int goo() {
     static int xyz;
     return xyz++;
 }
```

之后再次使用该函数时，生成的符号属性则如下所示。  

```routeros
$readelf -sW libb.so | grep xyz
   45: 0000000000201058     4 OBJECT  LOCAL  DEFAULT   23 _ZZL3goovE3xyz
```

处理发现变量的Bind从UNIQUE编程了LOCAL以外，还会发现，前边readelf都会发现该变量有两行结果，一个在’.dynsym’节区，一个在’.symtab’节区。而这次只剩下了一行结果。这是因为’.dynsym’节区没有这个符号了，只剩下了’.symtab’节区的符号。

此外，在编译选项中使用`--visibility=hidden`,也会将该符号变为LOCAL。

<a id="参考资料"></a>

## 参考资料

-   [https://www.ibm.com/developerworks/cn/linux/l-cn-sdlstatic/index.html](https://www.ibm.com/developerworks/cn/linux/l-cn-sdlstatic/index.html)
-   [https://stackoverflow.com/questions/11050693/dlclose-doesnt-work-with-factory-function-complex-static-in-function](https://stackoverflow.com/questions/11050693/dlclose-doesnt-work-with-factory-function-complex-static-in-function)
-   [https://sourceware.org/git/?p=glibc.git;a=blob;f=elf/dl-lookup.c;h=a2a699b48f5f188da2528ed163b7befffed586ee;hb=HEAD#l445](https://sourceware.org/git/?p=glibc.git;a=blob;f=elf/dl-lookup.c;h=a2a699b48f5f188da2528ed163b7befffed586ee;hb=HEAD#l445)
