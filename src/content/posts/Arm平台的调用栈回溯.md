---
title: "arm平台的调用栈回溯(backtrace)"
date: "2018-09-19"
updated: "2018-09-25"
description: "arm平台的调用栈与x86平台的调用栈大致相同，稍微有些区别，主要在于栈帧的压栈内容和传参方式不同。在arm平台的不同程序，采用的编译选项不同，程序运行期间的栈帧也会不同。有些工具在对arm的调用栈回溯时，可能会遇到无法回溯的情况。例如gdb在使用bt查看core dump文件调用栈时，有时会出现B"
slug: "Arm平台的调用栈回溯"
tags: ["C/C++","调试"]
---

<a id="介绍"></a>

## 介绍

arm平台的调用栈与x86平台的调用栈大致相同，稍微有些区别，主要在于栈帧的压栈内容和传参方式不同。在arm平台的不同程序，采用的编译选项不同，程序运行期间的栈帧也会不同。有些工具在对arm的调用栈回溯时，可能会遇到无法回溯的情况。例如gdb在使用bt查看core dump文件调用栈时，有时会出现`Backtrace stoped`的情况,有可能就是栈空间的压栈顺序导致的。当工具无法回溯时，就需要人工结合汇编代码对栈进行回溯，或者使用unwind进行回溯。

<a id="arm栈帧结构"></a>

## arm栈帧结构

![arm的一种栈结构](/images/stack.svg)

通常情况下，arm的调用栈大致结构与x86相同，都是从高地址向低地址扩张。上图是其中一种内存分布。

pc, lr, sp, fp是处理器的寄存器，其含义如下：

-   pc, program counter，程序计数器。程序当前运行的指令会放入到pc寄存器中
-   fp, 即frame pointer,帧指针。通常指向一个函数的栈帧底部，表示一个函数栈的开始位置。
-   sp, stack pointer，栈顶指针。指向当前栈空间的顶部位置，当进行push和pop时会一起移动。
-   lr, link register。在进行函数调用时，会将函数返回后要执行的下一条指令放入lr中，对应x86架构下的返回地址。

调用栈从高地址向低地址增长，当函数调用时，分别将分别将pc, lr, ip和 fp寄存器压入栈中，然后移动sp指针，为当前程序开辟栈空间。

arm官方手册描述如下：

> 一个arm程序，在任一时刻都存在十五个通用寄存器，这取决于当前的处理器模式。 它们分别是 r0-r12、sp、lr。  
> sp（或 r13）是堆栈指针。 C 和 C++ 编译器始终将 sp 用作堆栈指针。 在 Thumb-2 中，sp 被严格定义为堆栈指针，因此许多对堆栈操作无用而又使用了 sp 的指令会产生不可预测的结果。 建议您不要将 sp 用作通用寄存器。  
> 在用户模式下，lr（或 r14）用作链接寄存器 (lr)，用于存储调用子例程时的返回地址。 如果返回地址存储在堆栈上，则也可将 r14 用作通用寄存器。  
> 在异常处理模式下，lr 存放异常的返回地址；如果在一个异常内执行了子例程调用，则 lr 存放子例程的返回地址。如果返回地址存储在堆栈上，则可将 lr 用作通用寄存器。

除了官方手册中描述的sp,lr寄存器，通常r12还会作为fp寄存器。fp寄存器对于程序的运行没有帮助，主要用于对栈帧的回溯。因为sp时刻指向的栈顶，通过fp得知上一个栈帧的起始位置。

上图的调用栈对应的汇编代码如下。

1.  8514行将当前的sp保存在ip中(ip只是个通用寄存器，用来在函数间分析和调用时暂存数据,通常为r12);
2.  8518行将4个寄存器从右向左依次压栈。
3.  851c行将保存的ip减4，得到当前被调用函数的fp地址，即指向栈里的pc位置。
4.  8520行将sp减8，为栈空间开辟出8个字节的大小，用于存放局部便令。

```armasm
00008514 <func1>:
     8514:   e1a0c00d    mov ip, sp
     8518:   e92dd800    push    {fp, ip, lr, pc}
     851c:   e24cb004    sub fp, ip, #4
     8520:   e24dd008    sub sp, sp, #8
     8524:   e3a03000    mov r3, #0
     8528:   e50b3010    str r3, [fp, #-16]
     852c:   e30805dc    movw    r0, #34268  ; 0x85dc
     8530:   e3400000    movt    r0, #0
     8534:   ebffff9d    bl  83b0 <puts@plt>
     8538:   e51b3010    ldr r3, [fp, #-16]
     853c:   e12fff33    blx r3
     8540:   e3a03000    mov r3, #0
     8544:   e1a00003    mov r0, r3
     8548:   e24bd00c    sub sp, fp, #12
     854c:   e89da800    ldm sp, {fp, sp, pc}
```

<a id="mapcs-frame编译选项"></a>

## \-mapcs-frame编译选项

在第一节中，程序压栈的寄存器有{fp, ip, lr, pc} 4个，这是在gcc带有-mapcs-frame的编译选项下编译出来的。而gcc默认情况下的参数为mno-apcs-frame。关于该选项，gcc的手册描述为，

> Generate a stack frame that is compliant with the ARM Procedure Call Standard for all functions, even if this is not strictly necessary for correct execution of the code. Specifying -fomit-frame-pointer with this option causes the stack frames not to be generated for leaf functions. The default is -mno-apcs-frame. This option is deprecated.

也就是说，该编译选项会产生(push {fp, ip, lr, pc})，保证栈帧的格式。如果没有-mapcs-frame，则不保证帧格式和当前帧格式，GCC生成的指令可能会发生各种变化。在AAPCS发布之后\[附录1\]，1993年的APCS就已经太旧了，所以  
在gcc5.0之后，该选项已经被废弃。gcc5.0的更新记录写到：

> The options -mapcs, -mapcs-frame, -mtpcs-frame and -mtpcs-leaf-frame which are only applicable to the old ABI have been deprecated.  
> 至于该参数在将来是否会被gcc移除，那就不知道了。

将第一节中的程序重新使用默认编译选项，用4.7版本的gcc编译，结果如下。这时，fp还在，调用栈push了fp和lr到栈空间，新的fp指向了lr在栈中的位置。

```armasm
00008514 <func1>:
     8514:   e92d4800    push    {fp, lr}
     8518:   e28db004    add fp, sp, #4
     851c:   e24dd008    sub sp, sp, #8
     8520:   e3a03000    mov r3, #0
     8524:   e50b3008    str r3, [fp, #-8]
     8528:   e30805d4    movw    r0, #34260  ; 0x85d4
     852c:   e3400000    movt    r0, #0
     8530:   ebffff9e    bl  83b0 <puts@plt>
     8534:   e51b3008    ldr r3, [fp, #-8]
     8538:   e12fff33    blx r3
     853c:   e3a03000    mov r3, #0
     8540:   e1a00003    mov r0, r3
     8544:   e24bd004    sub sp, fp, #4
     8548:   e8bd8800    pop {fp, pc}

 0000854c <main>:
     854c:   e92d4800    push    {fp, lr}
     8550:   e28db004    add fp, sp, #4
     8554:   ebffffee    bl  8514 <func1>
     8558:   e1a00003    mov r0, r3
     855c:   e8bd8800    pop {fp, pc}
```

使用gcc-7.3默认选项编译结果如下，fp已经不在了，虽然这里仍然可能通过r7得知上个栈帧的位置，但是已经没法使用fp获取栈帧了。此时是不保证栈帧保存在栈中的。所以依赖栈帧内容进行恢复已经非常不可靠。那么既然无法依赖fp，那该怎么进行栈帧回溯呢，gnu说使用unwind方法回溯，这节暂时不会介绍unwind方法。

```armasm
000103c8 <func1>:
    103c8:   b580        push    {r7, lr}
    103ca:   b082        sub sp, #8
    103cc:   af00        add r7, sp, #0
    103ce:   2300        movs    r3, #0
    103d0:   607b        str r3, [r7, #4]
    103d2:   f240 4048   movw    r0, #1096   ; 0x448
    103d6:   f2c0 0001   movt    r0, #1
    103da:   f7ff ef7e   blx 102d8 <puts@plt>
    103de:   687b        ldr r3, [r7, #4]
    103e0:   4798        blx r3
    103e2:   2300        movs    r3, #0
    103e4:   4618        mov r0, r3
    103e6:   3708        adds    r7, #8
    103e8:   46bd        mov sp, r7
    103ea:   bd80        pop {r7, pc}

 000103ec <main>:
    103ec:   b580        push    {r7, lr}
    103ee:   af00        add r7, sp, #0
    103f0:   f7ff ffea   bl  103c8 <func1>
    103f4:   2300        movs    r3, #0
    103f6:   4618        mov r0, r3
    103f8:   bd80        pop {r7, pc}
```

<a id="使用栈帧进行回溯"></a>

## 使用栈帧进行回溯

这一节使用gcc4.7版本，默认编译选项编译出来的程序，演示调用栈回溯。该编译选项下，压栈的寄存器为{fp, lr}。

下边的内容是一段core dump中的寄存器和调用栈，本节将对这段内容进行回溯。  

```x86asm
Reg:         r9, Val = 0xf7578000;  Reg:        r10, Val = 0x00000001;  
Reg:         fp, Val = 0x827d3104;  Reg:         ip, Val = 0xf7578ae0;  
Reg:         sp, Val = 0x827d30e0;  Reg:         lr, Val = 0xf7549990;  
Reg:         pc, Val = 0xf7548c20;  Reg:       cpsr, Val = 0x60000210;

0x827d30e0:	0x00000031	0x827d31a0	0x00000001	0xd5dff060	
0x827d30f0:	0xd5e0e6b1	0xd5dec134	0xf7578000	0xf7577c40	
0x827d3100:	0x827d313c	0xf7549990		
0x827d3140:	0x00000000	0xd5dec104	0xf7568514	0x00000002	
0x827d3150:	0xd5dec104	0xf7577c40	0xf7577c38	0xd5de9224	
0x827d3160:	0x827d31a0	0xf757a084	0xf7577c40	0xd5df6dd4	
0x827d3170:	0x827d3194	0x00000001	0xd5e0e678	0xd5dec104	
0x827d3180:	0xd5de9224	0xf7568548	0x00000000	0xf7568550
```

1.  当前sp地址为0x827d30e0，fp地址为0x827d3104，从而得知当前函数frame0的栈帧。fp指向的地址0x827d3104为frame1的lr,0x827d3100为上一个栈帧的fp。
    
    ```x86asm
    0x827d30e0:	0x00000031	0x827d31a0	0x00000001	0xd5dff060	
    0x827d30f0:	0xd5e0e6b1	0xd5dec134	0xf7578000	0xf7577c40	
    0x827d3100:	0x827d313c(fp)	0xf7549990(lr)
    ```
    
2.  从frame0的fp地址0x827d313c可知，frame1的调用栈起始地址，去掉frame0的内容，得到frame1的栈帧。
    
    ```x86asm
                                                                            0x827d312c	0xf7530c14	
    0x827d3110:	0xd5dff060	0x0000002c	0xd5e0e6b1	0xd5e0e6b1	
    0x827d3120:	0x00000001	0xd5e0e6b1	0xd5dff060	0xd5dec134	
    0x827d3130:	0xf7578000	0xf7577c40	0x827d3194(fp)	0xf754ad0c(lr)
    ```
    
3.  依次类推，依次得到frame2、frame3…的栈帧。
    

当汇编代码的函数调用使用`push {fp, ip, lr, pc}`时，则上一个栈帧的fp2在当前栈帧的(fp - #4)位置。栈帧的回溯要结合程序的汇编代码具体分析，有可能程序并不使用fp指针，也有可能栈中根本没有保存fp。

<a id="unwind方法回溯"></a>

## unwind方法回溯

TODO

<a id="附录1-函数调用标准缩略语"></a>

## 附录1-函数调用标准缩略语

-   PCS Procedure Call Standard.
-   AAPCS Procedure Call Standard for the ARM Architecture (this standard).
-   APCS ARM Procedure Call Standard (obsolete).
-   TPCS Thumb Procedure Call Standard (obsolete).
-   ATPCS ARM-Thumb Procedure Call Standard (precursor to this standar

<a id="参考资料"></a>

## 参考资料

1.  [ARM 体系结构概述](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0204ic/Cihfddaf.html)
2.  [Procedure Call Standard for the ARM® Architecture](http://infocenter.arm.com/help/topic/com.arm.doc.ihi0042f/IHI0042F_aapcs.pdf)
3.  [GCC 5 Release Series](https://gcc.gnu.org/gcc-5/changes.html#arm)
