import fs from "fs";
import parser from "@babel/parser"; // 解析代码为 ast
import traverse from "@babel/traverse"; // 通过 ast获取依赖路径
import ejs from "ejs"; // 配置代码模版，生成代码代码
import path from "path";
import { transformFromAst } from "babel-core"; // 代码转换， esm - cjs
import {jsonLoader} from "./jsonLoader.js";
let id = 0;

const webpackConfig = {
	module:{
		rules:[{
			test: /\.json$/,
			use: [jsonLoader]
		}]
	}
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
// console.log(graph);


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

	const code = ejs.render(template, { data });
	fs.writeFileSync("./dist/bundle.js", code);
}

build(graph);