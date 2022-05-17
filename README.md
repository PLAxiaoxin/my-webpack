# my-webpack
 ## webpack 实现流程梳理
 1. 通过 [@babel/parser](https://www.npmjs.com/package/@babel/parser)把代码解析为 AST 输出。
 2. 通过 [@babel/traverse](https://www.npmjs.com/package/@babel/traverse)解析 AST 拿到文件的依赖。
 3. import 引入的文件无法识别，通过 [babel/core](https://www.npmjs.com/package/babel/core) 把 esm 转为 cjs
 4. 通过 [ejs](https://www.npmjs.com/package/ejs) 配置通用模版，生产组合的js文件。
 
 *** ⚠️注意事项 ***
 - babel/core esm 转 cjs 时，会有一个莫名报错，安装 babel-preset-env 解决；


 ## loader 实现流程
 > 原理：把各种 webpack 不能识别的文件转为可以识别的文件。
 1. loader 的执行时机，为代码转为 AST 时。 
 2. 通过 webpackConfig 配置的正则去截获对应文件，用配置的 loader 进行处理。

 *** ⚠️注意事项 ***
 - loader 的执行顺序是倒序。


 ## plugin 实现流程
 > 原理：基于 webpack 执行过程中产生的回调事件进行处理。
 1. 事件初始化

```js 
		const hooks = {
			// 初始化钩子
			emitFile: new SyncHook(["context"])
		 }
```

2. 注册事件 

```js
	export class ChangeOutputPath{
		apply(hooks){
			hooks.emitFile.tap("changeOutputPath", (context)=>{
				context.changeOutputPath("./dist/wzx.js")
				console.log("changeOutputPath");	
			})
		}
	}
```

3. 触发事件

```js
	hooks.emitFile.call(context);
``` 

*** ⚠️注意事项 ***
- 注册事件时，必须实现 apply 方法。
 