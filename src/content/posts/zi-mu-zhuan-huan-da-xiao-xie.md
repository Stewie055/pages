---
title: "字母转换大小写"
date: "2015-05-01"
description: "在ASCII码中，大写字母A-Z的编码是41h-5Ah,小写字母a-z的编码是61h-8Ah,中间相差20h，用二进制表示就是0010 0000。所以当从大写转换成小写或者从小写转换到大写的时候只需改变一位即可。可以用位操作很快的实现。 c语言示例代码"
slug: "zi-mu-zhuan-huan-da-xiao-xie"
tags: ["编程"]
---

在ASCII码中，大写字母A-Z的编码是41h-5Ah,小写字母a-z的编码是61h-8Ah,中间相差20h，用二进制表示就是0010 0000。所以当从大写转换成小写或者从小写转换到大写的时候只需改变一位即可。可以用位操作很快的实现。

c语言示例代码  

```c
//小写转换成大写
char upper(char input){  
    return input & 0xdf;
}

//大写转换成小写
char lower(char input){  
    return input | 0x20 ;
}

//大小写转换,大写变小写，小写变大写。
char reverse(char input){  
    return input ^ 0x20;
}
```
