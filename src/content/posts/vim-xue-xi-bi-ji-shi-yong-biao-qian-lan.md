---
title: "Vim 学习笔记-使用tab分页（1）"
date: "2014-12-09"
description: "下边的的内容会介绍利用tab分页打开和编辑文件。在Vim中，所有文本都被放在缓存区，每一个缓存区都可以被显示在任意数量的窗口或任意数量的tab页面中（就像谷歌浏览器的标签页，以下将用tab描述）。 在很多编辑器中（不包括Vim）,一个文件只能在一个分页中打开，而每一个分页只能显示一个文件，一个文件不"
slug: "vim-xue-xi-bi-ji-shi-yong-biao-qian-lan"
tags: ["Vim"]
---

<a id="使用tab分页"></a>

#### 使用tab分页

下边的的内容会介绍利用tab分页打开和编辑文件。在Vim中，所有文本都被放在缓存区，每一个缓存区都可以被显示在任意数量的窗口或任意数量的tab页面中（就像谷歌浏览器的标签页，以下将用tab描述）。

在很多编辑器中（不包括Vim）,一个文件只能在一个分页中打开，而每一个分页只能显示一个文件，一个文件不能出现在多个分页中。在Vim中并没有这个限制。Vim中的tabs可以很方便的组织你的工作。

(本文将省略Gvim的说明)

* * *

<a id="打开和关闭tabs"></a>

##### 打开和关闭tabs

当打开Vim的时候，可以指定-p参数，使得每个文件在各自的tab中显示（直到设定的上限tabpagemax）。例如：  

```stylus
vim -p first.txt second.txt
gvim -p *.txt
```

当Vim被启动后，可以使用下边的命令创建和关闭文件  

```elixir
:tabedit {file}   #在一个新的tab中编辑file文件
:tabfind {file}   #在‘path'变量中搜索指定文件file,并在新的tab中打开
:tabclose         #关闭当前的tab
:tabclose {i}     #关闭第i个tab
:tabonly          #关闭除当前tab外的所有tab
```

\==:tabfind== 命令会使用Vim中的==’path’==选项最顶搜索的路径。例如下边的例子中。==.==会使Vim搜索当前文件所在的目录，然后搜索当前目录（两个连续的逗号==,,==），接着搜索当前目录的子目录(==\*\*==)  

```routeros
:set path=.,,**
```

记住，就像Vim中的很多命令一样，你只要输入足够多的字符使Vim分辨出来你的命令就可以了。例如，你可以用==:tabe==和==:tabf==来代替==:tabedit==和==:tabfind==

另外，由于Vim中有大量的关于窗口的操作命令，在这些命令前加上tab就可以是这些命令变成对tab的操作。例如：  

```vim
:tab ball         #show each buffer in a tab (up to 'tabpagemax' tabs) （我现在也不是很懂）
:tab help         #在它自己的tab页打开help文件
:tab drop {file}  #为file打开一个新的tab, 如果已经存在，就跳转到它所在的窗口或tab
:tab split        #将当前文件完全复制到另外一个新的tab中
```

使用==:sp myfile.txt==类似的命令可以再当前的tab中打开一个新的窗口(即将当前页面分裂成两个窗口)。可以使用命令==Ctrl-w T==将那个窗口移动到一个新的tab, 也可以在不改变原来页面的情况下，使用==:tab sp==将那个窗口复制的另外一个页面。

你可以使用==Ctrl-W c==关闭当前窗口，如果这个窗口已经是当前tab的最后一个窗口，这个tab也会被关闭。

如果你现在编辑的文件中含有另外一个文件的名字，你可以将光标移动文江名上，然后按==gf==去编辑那个文件。使用==Ctrl-W gf==会让该文件显示在一个新的tab中。

* * *

<a id="导航"></a>

##### 导航

```elixir
:tabs         #显示所有的tab，包括它们中的窗口
:tabm 0       #将当前tab移动到第一个
:tabm         #将当前tab移动到最后一个
:tabm {i}     #将当前tab移动到第i+1个

:tabn         #切换到下个tab
:tabp         #切换到上个tab
:tabfirst     #切换到第一个tab
:tablast      #切换到最后一个tab
```

在常规模式(命令视图)中，可以使用这些快捷键：  

```crmsh
gt            #切换到下个tab
gT            #切换到上个tab
{i}gt         #切换到第i个tab
```

记住gt命令是从1开始计数。0gt和1gt都会跳到第一个tab。

* * *

<a id="捷径"></a>

##### 捷径

下边这些内容需要添加到vimrc文件中，可以得到一些关于tab操作的快捷键。（我省略了暂时没看）

With the following mappings (which require gvim), you can press Ctrl-Left or Ctrl-Right to go to the previous or next tabs, and can press Alt-Left or Alt-Right to move the current tab to the left or right.  

```vim
nnoremap <C-Left> :tabprevious<CR>
nnoremap <C-Right> :tabnext<CR>
nnoremap <silent> <A-Left> :execute 'silent! tabmove ' . (tabpagenr()-2)<CR>
nnoremap <silent> <A-Right> :execute 'silent! tabmove ' . tabpagenr()<CR>
```

With the following, you can press F8 to show all buffers in tabs, or to close all tabs (toggle: it alternately executes :tab ball and :tabo).  

```elixir
let notabs = 0
nnoremap <silent> <F8> :let notabs=!notabs<Bar>:if notabs<Bar>:tabo<Bar>:else<Bar>:tab ball<Bar>:tabn<Bar>:endif<CR>
```

The following command abbreviation allows typing :tabv myfile.txt to view the specified file in a new tab; the buffer is read-only and nomodifiable so you cannot accidentally change it.  

```vim
cabbrev tabv tab sview +setlocal\ nomodifiable
```

Refrence:[http://vim.wikia.com/wiki/Using\_tab\_pages](http://vim.wikia.com/wiki/Using_tab_pages)
