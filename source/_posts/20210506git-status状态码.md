---
title: git-status状态码
categories: git
tags:
  - git
abbrlink: a2383ac5
date: 2021-05-06 17:56:44
---


A: 本地新增的文件（服务器上没有）.

C: 文件的一个新拷贝.

D: 本地删除的文件（服务器上还在）.

M: 文件的内容或者mode被修改了.

R: 文件名被修改了。

T: 文件的类型被修改了。

U: 文件没有被合并(需要完成合并才能进行提交)。

X: 未知状态(很可能是遇到git的bug了，你可以向git提交bug report)

?: 未被git进行管理，可以使用git add file1把file1添加进git能被git所进行管理