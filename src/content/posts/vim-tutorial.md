---
title: "Vim tutorial"
date: "2014-12-17"
description: "写在前边请忽略任何将VIM配置成类似Notepad编辑器的建议（Please ignore anyone who provides advice on how to configure Vim to operate like Notepad!） Vim中有Normal(普通)，Insert（编辑）和"
slug: "vim-tutorial"
tags: ["Vim"]
---

_写在前边_  
请忽略**任何**将VIM配置成类似Notepad编辑器的建议（Please ignore anyone who provides advice on how to configure Vim to operate like Notepad!）

<a id="编辑"></a>

##### 编辑

Vim中有Normal(普通)，Insert（编辑）和Visual（视图），在Insert模式下进行编辑。从普通模式进入编辑模式的快捷键：

-   i 在光标当前位置插入
-   a 在光标当前位置之后插入
-   I 在当前行起始位置插入
-   A 在当前行末尾插入
-   o 在当前行下方插入新的行
-   O 在当前行上方插入一行
-   s 删除当前位置的字符并在此插入
-   S 删除当前行并进入编辑模式
-   cw 替换当前位置的单词并进入编辑 (any movement command can be substituted for w)
-   cc 同S (change line)
-   C 删除从光标位置到行尾的单词并进入编辑模式

<a id="保存并退出"></a>

##### 保存并退出

在普通模式下使用 `:q`退出不保存，`:w`保存，`:w <filename>`保存问,`:wq`或`:x`保存并退出

-   :wa write all changed files (save all changes)
-   :xa exit all (save all changes and close Vim)
-   :qa quit all (close Vim, but not if there are unsaved changes)
-   :qa! quit all (close Vim without saving—discard any changes)

* * *

_reference:_

-   [http://vim.wikia.com/wiki/Tutorial](http://vim.wikia.com/wiki/Tutorial)
