---
title: Arthas诊断
publish: true
date: 2023-07-24
tags:
  - java
  - arthas
  - 诊断工具
aliases:
  - arthas
type: knowledge
status: stable
---

# Arthas诊断

阿里开源 Arthas 工具，线上诊断 Java 程序的神器。

## 一、Arthas简介

[Arthas官网](https://arthas.aliyun.com/en/) | [Arthas GitHub](https://github.com/alibaba/arthas/blob/master/README_CN.md)

![image-20230724144124654](https://raw.githubusercontent.com/Super-YYQ/PicGoPicture/main/PicGo/20230724144124.png)

### 1.1 使用准备

```shell
## 1、下载 arthas 的包
wget https://alibaba.github.io/arthas/arthas-boot.jar

## 2、启动 arthas
java -jar arthas-boot.jar

## 3、arthas 启动后会自动检测存在的 java 进程
$ java -jar arthas-boot.jar
* [1]: 35542 com.yyq.bootstrap.jar
  [2]: 71560 arthas-demo.jar
1

## 4、选择进程，使用相关命令

## 5、stop 命令可退出
```

## 二、基础命令

### 2.1 jad（反编译）

```java
## 查看 java 源码，可以用来诊断线上环境代码是否最新
jad demo.MathGame test
```

### 2.2 watch（数据观测）

```shell
## 监听 demo.MathGame 类的 primeFactors 方法，展示 params[0] 第一个参数、returnObj 返回值、throwExp 报错，过滤条件 params[0].getKey == '12345'，打印详细参数-v，收集n条数据-n
watch demo.MathGame primeFactors "{params[0],returnObj,throwExp}" "params[0].getKey == '12345'" -x 2 -v -n

## 过滤list数组中包含参数条件
wacth ... "params[0].parameters.indexOf('c1r4k4yv')>-1"
```

### 2.3 trace（调用路径）

> stack：当前方法被调用的调用路径（反向trace）

```shell
## 监控方法内部调用路径，并输出方法路径上的每个节点上耗时
trace demo.MathGame test
```

### 2.4 sc（JVM 已加载的类信息）

```shell
## 查看JVM已加载的类信息
$ sc -d demo.MathGame
class-info        demo.MathGame
code-source       /private/tmp/math-game.jar
name              demo.MathGame
isInterface       false
isAnnotation      false
isEnum            false
isAnonymousClass  false
isArray           false
isLocalClass      false
isMemberClass     false
isPrimitive       false
isSynthetic       false
simple-name       MathGame
modifier          public
annotation
interfaces
super-class       +-java.lang.Object
class-loader      +-sun.misc.Launcher$AppClassLoader@3d4eac69
                    +-sun.misc.Launcher$ExtClassLoader@66350f69
classLoaderHash   3d4eac69

Affect(row-cnt:1) cost in 875 ms.
```

### 2.5 logger（logger 信息）

```shell
## 查询所有日志设置
$ logger

## 更改日志级别
$ logger -c [hashcode] --name ROOT --level debug
```

### 2.6 tt（方法执行数据的时空隧道）

### 2.7 ognl表达式

> 如watch命令的过滤、计数等...

[Arthas特殊用法issues](https://github.com/alibaba/arthas/issues/71)

[OGNL表达式官网](https://commons.apache.org/proper/commons-ognl/language-guide.html)

## 三、高级应用

### 3.1 Idea插件

> arthas idea

### 3.2 线上热部署

### 3.3 获取任意bean

[GitHub教程](https://github.com/alibaba/arthas/issues/482)

**spring mvc应用，请求会经过一系列的spring bean处理，那么我们可以在spring mvc的类里拦截到一些请求。**

```shell
$ tt -t org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter invokeHandlerMethod
Press Ctrl+C to abort.
Affect(class-cnt:1 , method-cnt:1) cost in 101 ms.
 INDEX  TIMESTAMP         COST(ms  IS-RE  IS-EX  OBJECT       CLASS                     METHOD
                          )        T      P
------------------------------------------------------------------------------------------------------------------
 1000   2019-01-27 16:31  3.66744  true   false  0x4465cf70   RequestMappingHandlerAda  invokeHandlerMethod
        :54                                                   pter
```

**那么怎样获取到spring context？**

可以用`tt`命令的`-i`参数来指定index，并且用`-w`参数来执行ognl表达式来获取spring context：

```shell
$ tt -i 1000 -w 'target.getApplicationContext()'
@AnnotationConfigEmbeddedWebApplicationContext[
 reader=@AnnotatedBeanDefinitionReader[org.springframework.context.annotation.AnnotatedBeanDefinitionReader@35dc90ec],
 scanner=@ClassPathBeanDefinitionScanner[org.springframework.context.annotation.ClassPathBeanDefinitionScanner@72078a14],
  annotatedClasses=null,
  basePackages=null,
]
Affect(row-cnt:1) cost in 7 ms.
```

**从spring context里获取任意bean**

获取到spring context之后，就可以获取到任意的bean了，比如获取到`helloWorldService`，并调用`getHelloMessage()`函数：

```shell
$ tt -i 1000 -w 'target.getApplicationContext().getBean("helloWorldService").getHelloMessage()'
@String[Hello World]
Affect(row-cnt:1) cost in 5 ms.
```

### 3.4 获取数据库连接信息

**找到项目中数据库相关组件，如：mybatis-spring**

**查询数据库组件中存在DataSource的相关类和方法**

```shell
org.mybatis.spring.transaction.SpringManagedTransactionFactory#newTransaction(javax.sql.DataSource, org.apache.ibatis.session.TransactionIsolationLevel, boolean)
```

**通过tt方法检索DataSource中隐藏的数据库连接信息**

```shell
tt -t org.mybatis.spring.transaction.SpringManagedTransactionFactory newTransaction -n 5

tt -i 1001 -w 'params[0].**'
```

## 四、常见问题
