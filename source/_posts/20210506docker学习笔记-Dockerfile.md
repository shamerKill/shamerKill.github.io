---
title: docker学习笔记-Dockerfile
tags:
  - docker
abbrlink: b7297d0a
date: 2021-05-06 09:43:48
---

# Dockerfile定制镜像

所谓定制镜像，就是以一个惊喜那个为基础，在其上进行定制。
Dockerfile是一个文本文件，为了解决定制镜像无法重复、构建透明性、无效体积的问题。其内包含了一条条的**指令(Instruction)**，每一条指令构建一层，因此每一条指令的内容，就是描述该层应当如何构建。

> 构建文件名就是Dockerfile，无后缀

## 关键词列表
``` docker
  FROM # 指定基础镜像
  RUN # 执行命令
  COPY # 复制文件
  ADD # 高级复制文件
  CMD # 容器启动命令
  ENTRYPOINT # 入口点
  ENV # 设置环境变量
  ARG # 构建参数
  VOLUME # 定义匿名卷
  EXPOSE # 暴漏端口
  WORKDIR # 指定工作目录
  USER # 指定当前用户
  HEALTHCHECK # 健康检查
  ONBUILD # 作为其他镜像基础镜像时执行
```
``` sh
  docker build # 构建镜像
```

## 关键词解释

``` docker
  FROM <镜像名>
```
FROM用来指定基础镜像，因此一个`Dockerfile`第一条指令必须是`FROM`
> 特殊镜像为`scratch`，该镜像表明一个空镜像，实际不存在，意味着不以任何镜像为基础，接下来写的指令将作为镜像第一层存在

``` docker
  RUN <命令>
```
`RUN`指令用来执行命令行命令。是最常用的指令之一。执行格式有两种
- *shell*格式: 在`RUN`指令之后直接跟随shell命令
- *exec*格式: `RUN ["和执行文件", "参数1", "参数2"]`
  
每次执行`RUN`命令都会建立一个新镜像层，所以尽量不要连续使用`RUN`命令执行类似的命令。将相近的命令放到同一层。
dockerfile支持`\`命令换行以及`#`注释
``` docker {.line-numbers}
  FROM debian:stretch

  RUN buildDeps='gcc libc6-dev make wget' \
      && apt-get update \
      && apt-get install -y $buildDeps \
      && wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \
      && mkdir -p /usr/src/redis \
      && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
      && make -C /usr/src/redis \
      && make -C /usr/src/redis install \
      && rm -rf /var/lib/apt/lists/* \
      && rm redis.tar.gz \
      && rm -r /usr/src/redis \
      && apt-get purge -y --auto-remove $buildDeps
```
这一组命令的最后添加了清理工作的命令，删除了为了编译构建所需要的软件，清理了所有下载、展开的文件，并且还清理了 apt 缓存文件。这是很重要的一步，我们之前说过，镜像是多层存储，每一层的东西并不会在下一层被删除，会一直跟随着镜像。因此镜像构建时，一定要确保每一层只添加真正需要添加的东西，任何无关的东西都应该清理掉。很多人初学 Docker 制作出了很臃肿的镜像的原因之一，就是忘记了每一层构建的最后一定要清理掉无关文件。

``` sh
  docker build [选项] <Dockerfile上下文路径>
```
这个命令会根据dockerfile创建一个镜像，可以个用`-f 文件`指定某个文件作为Dockerfile

- 可以通过git仓库进行构建
- 可以通过tar压缩包构建

``` docker
  COPY [--chown=<user>:<group>] <源路径>...<目标路径>
  COPY [--chown=<user>:<group>] ["<源路径>"..."<目标路径>"]
```
`--chown=<user>:<group>`更改文件的所属用户以及所属组。
将构建上下文目录中的源路径复制到目标路径内，源路径可以是多个或通配符。
此外，还需要注意一点，使用 COPY 指令，源文件的各种元数据都会保留。比如读、写、执行权限、文件变更时间等。这个特性对于镜像定制很有用。特别是构建相关文件都在使用 Git 进行管理的时候。

``` docker
  ADD <源路径>...<目标路径>
```
源路径可以是一个URL，但是如果需要处理文件需要另外使用RUN，所以不推荐。
但是源路径为一个tar压缩文件的时候，会自动解压缩。所以经常仅用来下载文件并解压缩

``` docker
  CMD <命令>
```
`CMD`指令和`RUN`指令相似用来执行命令行命令。是最常用的指令之一。执行格式有两种
- *shell*格式: 在`CMD`指令之后直接跟随shell命令
- *exec*格式: `CMD ["和执行文件", "参数1", "参数2"]`
- 参数列表格式：`CMD ["参数1", "参数2"...]`。在指定了 `ENTRYPOINT` 指令后，用 `CMD` 指定具体的参数。

docker 不是虚拟机，是容器，容器就是进程。既然是进程，那么在启动容器的时候就要制定所运行的程序及参数。
`CMD`命令就是为了指定默认的容器主进程的启动命令的。
推荐使用`exec`格式。
不能使用守护进程运行主进程，因为容器是因为了主进程存在的，如果没有主进程，容器会自动退出。

``` docker
  ENTRYPOINT <命令>
```
和`CMD`格式一样，不过`CMD`通过命令传递参数的时候，会将命令替代。`ENTRYPOINT`可以将命令参数传入file里的命令

``` docker
  ENV <key> <value>
  ENV <key1>=<value1> <key2>=<value2>
```
用来设置环境变量

``` docker
  ARG <参数名>[=<默认值>]
```
构建参数和 `ENV` 的效果一样，都是设置环境变量。所不同的是，`ARG` 所设置的构建环境的环境变量，在将来容器运行时是不会存在这些环境变量的。但是不要因此就使用 ARG 保存密码之类的信息，因为 `docker history` 还是可以看到所有值的。
`Dockerfile` 中的 `ARG` 指令是定义参数名称，以及定义其默认值。该默认值可以在构建命令 `docker build` 中用 `--build-arg <参数名>=<值>` 来覆盖。

``` docker
  VOLUME ["<路径1>", "<路径2>"...]
  VOLUME <路径>
```
之前我们说过，容器运行时应该尽量保持容器存储层不发生写操作，对于数据库类需要保存动态数据的应用，其数据库文件应该保存于卷(volume)中，后面的章节我们会进一步介绍 Docker 卷的概念。为了防止运行时用户忘记将动态文件所保存目录挂载为卷，在 Dockerfile 中，我们可以事先指定某些目录挂载为匿名卷，这样在运行时如果用户不指定挂载，其应用也可以正常运行，不会向容器存储层写入大量数据。
但是这个匿名卷并没有对应宿主目录，而是在容器创建时，在容器目录下新建目录。可以在创建容器时用`-v 宿主目录:容器目录`进行挂载

``` docker
  EXPOSE <端口1> [<端口2>...]
```
只是用来声明，但是不会在创建时开启端口服务，为了帮助镜像使用者方便映射。只是为了声明

``` docker
  WORKDIR <工作目录路径>
```
使用 WORKDIR 指令可以来指定工作目录（或者称为当前目录），以后各层的当前目录就被改为指定的目录，如该目录不存在，WORKDIR 会帮你建立目录。

``` docker
  USER <用户名>[:<用户组>]
```
`USER` 指令和 `WORKDIR` 相似，都是改变环境状态并影响以后的层。`WORKDIR` 是改变工作目录，`USER` 则是改变之后层的执行 `RUN`, `CMD` 以及 `ENTRYPOINT` 这类命令的身份。
用户必须事先建立好，该命令不负责创建身份。
如果以 `root` 执行的脚本，在执行期间希望改变身份，比如希望以某个已经建立好的用户来运行某个服务进程，不要使用 `su` 或者 `sudo`，这些都需要比较麻烦的配置，而且在 `TTY` 缺失的环境下经常出错。建议使用 `gosu`。