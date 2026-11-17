---
title: "使用Las Vegas随机算法求N皇后问题的解"
date: "2014-11-28"
description: "使用Las Vegas随机算法求N皇后问题的解"
slug: "shi-yong-las-vegassui-ji-suan-fa-qiu-nhuang-hou-wen-ti-de-jie"
tags: ["算法"]
---

```
#include<stdio.h>
#include<stdlib.h>
#include<time.h>

#define bool int
#define true 1
#define false 0

#define DIM 50 

int uniform(int n){   //random function
    double r;
    if(n<=0)
    return -1;
    r=rand();
    return (int)(r/RAND_MAX*(n-1))+1;
}

bool QueensLv(int try[]){   //LV算法解决N皇后问题
    int index,nb;
    int col,randcol;
    bool conflict=false;
    int row=0;
    bool success=false;

    do {   //从第一行开始
        nb=0;    ////计数器，nb值为（row)th皇后的open位置总数
        for(col=0;col<DIM;col++){   //从第一列开始
            conflict = false;
            for(index=0;index<row;index++){
                if(try[index]==col||abs(col-try[index])==(row-index))   //测试(row,col)是否冲突
                conflict=true;
            }
            if(conflict==false){   //是安全的
                nb=nb+1;
                if(uniform(nb)==1)  //或许放在第col列
                    randcol=col;   //注意第一次uniform一定返回1，即j一定有值
            }  //endif
        } //enddo,

        if(nb >0 ){   //nb=0时无安全位置，第row皇后尚未放好
                    //在所有nb个安全位置上，(row)th皇后选择位置j的概率为1/nb
            try[row] = randcol;
        }
        row++;
    }while(nb != 0&&row < DIM); //当前皇后找不到合适的位置或try是
                               // DIM-promising时结束.
    if(nb > 0)
        success = true;
    else 
        success = false;
    return success;
}

int SovleQueen(){   //不断调用LV算法直至成功
    bool success;
    int chess[DIM];
    int row;
    int i;
    for(i=0;i<DIM;i++)chess[i]=-1;
    do{
        success = QueensLv(chess);
    }while(success!=true);
    for(row = 0;row<DIM;row++){
        //printf("%d ",chess[row]);
        for(i = 0; i < chess[row]; i++)printf(".");
        printf("X");
        for(i=chess[row]+1;i<DIM;i++)printf(".");
        printf("\n");
    }
}

int main(int argc,char **argv){
    int index,j;
    clock_t start,end;
    double dur;
    srand(time(0));
    start = clock();
    SovleQueen();
    end = clock();
    dur = 1000.0*(end-start)/CLOCKS_PER_SEC;
    printf("used: %f ms.\n",dur);

}
```
