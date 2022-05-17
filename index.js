import fs from "fs";
import parser from "@babel/parser"; // 解析代码为 ast
import traverse from "@babel/traverse"; // 通过 ast获取依赖路径
import ejs from "ejs"; // 配置代码模版，生成代码
import path from "path";
import { transformFromAst } from "babel-core"; // 代码转换， esm - cjs
import {jsonLoader} from "./jsonLoader.js";
import { ChangeOutputPath } from "./ChangeOutputPath.js";
import { SyncHook } from "tapable";
let id = 0;

const webpackConfig = {
	module:{
		rules:[{
			test: /\.json$/,
			use: [jsonLoader]
		}]
	},
	plugins:[ new ChangeOutputPath()]
}


const hooks = {
	// 初始化钩子
	emitFile: new SyncHook(["context"])
}

function createAsset(filePath){
	// 1. 获取文件内容
	let source = fs.readFileSync(filePath, {
		encoding: "utf-8"
	});

	// initLoader
	const loaders = webpackConfig.module.rules;
	// 添加依赖
	const loaderContext = {
		addDeps(dep){
			console.log("addDeps", dep);
		}
	}
	loaders.forEach(({test, use}) => {
		if(test.test(filePath)){
			if(Array.isArray(use)){
				
				use.forEach((fn) => {
					source = fn.call(loaderContext, source);
				});
			}
		
		}
	});

	// 2. 获取依赖路径
	const ast = parser.parse(source, { 
		sourceType: "module"
	});

	const deps = [];
	traverse.default(ast, {
		ImportDeclaration({ node }){
			deps.push(node.source.value);
		}
	});

	const { code } = transformFromAst(ast, null, {
		presets: ['env']// 这里有坑，需要去安装 babel-preset-env
	});
	return {
		filePath,
		code,
		deps,
		mapping: {},
		id: id++
	}
}

// 初始化pligin
function initPlugins(){
	const plugins = webpackConfig.plugins;
	plugins.forEach((plugin) => {
		// 注册事件
		plugin.apply(hooks);
	});
}

initPlugins();

function craeteGraph(){
	const mianAseet = createAsset("./example/main.js");

	// 用队列遍历图
	const queue = [mianAseet];
	for (const asset of queue) {
		asset.deps.forEach(relativePath => {
			const child = createAsset(path.resolve("./example", relativePath));
			asset.mapping[relativePath] = child.id;
			queue.push(child);
		});
	}

	return queue;
}

const graph = craeteGraph();

function build(graph){
	const template = fs.readFileSync("./bundle.ejs", {
		encoding: "utf-8"
	});
	
	const data = graph.map((asset)=>{
		let { id, code, mapping } = asset || {};
		return {
			id, 
			code, 
			mapping
		}
	});
	let outputPath = "./dist/bundle.js";
	const code = ejs.render(template, { data });
	const context = {
		changeOutputPath(path){
			outputPath = path;
		}
	}
	// 触发事件
	hooks.emitFile.call(context);
	fs.writeFileSync(outputPath, code);
}

build(graph);